/**
 * Copyright (c) 2014 TopCoder, Inc. All rights reserved.
 */
'use strict';

/**
 * Module Dependencies.
 */
var config = require('../config.js');
var _ = require('lodash');
var routeHelper = require('../lib/routeHelper');
var ChallengeTCFormat = require('../format/challenges-tc-format');
var Challenge = require('./challenge-consumer').Challenge;
var Q = require('q');
var request = require('request');

var client = new Challenge(config.challengeApiUrl);

var CHALLENGE_FIELDS = ['id','regStartAt','subEndAt','completedAt','title','overview','description','tags','prizes',
      'projectId','projectSource','source','sourceId','status','createdAt','updatedAt','createdBy','updatedBy'];


function _getChallengeParams(reqParams) {
  var challengeFields = CHALLENGE_FIELDS.join(',');
  // @TODO the whole user object can be fetch by using participants(user) fields parameter, but currently user returns null
  // so using userId property for registrant handle.
  var params = {
    fields: challengeFields+',participants,submissions,scorecards(id,submission,submissionId,scoreSum,scoreMax,pay,place,prize)'
  };
  if (reqParams) {
    _.extend(params, reqParams);
  }
  return params;
}

/**
 * allActiveChallenges is invoked by /getActiveChallenges.
 * allActiveChallenges queries all Challenges from lc1-challenge-service that are 'SUBMISSION' or 'REVIEW' status.
 * Those challenges are then mapped into the same json format used currently by Topcoder
 *   with the help of ChallengeTCFormat.Convert function.
 * All mapped challenges are sent as the response.
 */
exports.allActiveChallenges = function(req, res, next) {
  var params = _getChallengeParams();
  // only active challenges
  params.filter = 'status=in(\'SUBMISSION\',\'REVIEW\')';
  client.getChallenges(params)
    .then(function (result) {
    var challenges = result.body.content;

    var tcChallenges = [];
    for (var i = 0; i < challenges.length; i++) {
      tcChallenges.push(ChallengeTCFormat.Convert(challenges[i]));
    }
    req.data = tcChallenges;
  })
    .fail(function (err) {
      routeHelper.addError(req, err);
    })
    .fin(function () {
      next();
    })
    .done();  // end promise
};

/**
 * Function to get challenge detail, including requirements data.
 */
exports.challenge = function(req, res, next) {
  var params = _getChallengeParams(req.params);
  // add requirements
  params.fields += ',requirements';
  client.getChallengesByChallengeId(params)
    .then(function(result) {
      var challenge = result.body.content;
      req.data = ChallengeTCFormat.Convert(challenge);
    })
    .fail(function (err) {
      routeHelper.addError(req, err);
    })
    .fin(function () {
      next();
    })
    .done();  // end promise

};

/**
 * Function to get results for a challenge
 */
exports.getResults = function(req, res, next) {
  var challengeFields = CHALLENGE_FIELDS.join(',');
  // @TODO the whole user object can be fetch by using participants(user) fields parameter, but currently user returns null
  // so using userId property for registrant handle.
  var params = {
    fields: challengeFields + ',participants,submissions,scorecards(id,submission(status,files,submitterId,createdAt,submitterHandle),submissionId,scoreSum,scoreMax,pay,place,prize)'
  };
  _.extend(params, req.params);

  client.getChallengesByChallengeId(params)
      .then(function(result) {
        var challenge = result.body.content;
        req.data = ChallengeTCFormat.convertResult(challenge);
      })
      .fail(function (err) {
        routeHelper.addError(req, err);
      })
      .fin(function () {
        next();
      })
      .done();  // end promise
};

/**
 * Fake callback for checkpoints
 */
exports.getCheckpoints = function(req, res) {
  res.json({
    error: {
      name: "Not Found",
      value: 404,
      description: "The URI requested is invalid or the requested resource does not exist.",
      details: "Checkpoint data not found."
    }
  });
};

function checkTerms(req) {
  // Check terms API
  var deferred = Q.defer();

  var queryParams = {
    role: 'Submitter'
  };

  var headers = {
    Authorization: req.headers.authorization
  };

  request({
    method: 'GET',
    uri: config.tcApi + '/terms/' + config.tcTermChallengeId,
    qs: queryParams,
    headers: headers
  }, function(error, response, body) {
    if (error) {
      deferred.reject(error);
    } else {
      if (/^application\/(.*\\+)?json/.test(response.headers['content-type'])) {
        try {
          body = JSON.parse(body);
        } catch (e) {

        }
      }
      if (response.statusCode >= 200 && response.statusCode <= 299) {
        deferred.resolve({
          response: response,
          body: body
        });
      } else {
        deferred.reject({
          response: response,
          body: body
        });
      }
    }
  });

  return deferred.promise;
}

/**
 * register to a challenge
 */
exports.register = function(req, res, next) {

 checkTerms(req)
   .then(function(result) {

     var allPassed = true;
     /*_.forEach(result.terms, function(terms) {
        if (!terms.agreed) {
          allPassed = false;
        }
     });*/

     var term = _.find(result.body.terms, {termsOfUseId: parseInt(config.tcTermId) });

     if (term) {
       allPassed = term.agreed;
     }

     if (allPassed) {

       var params = {
         challengeId: req.params.challengeId,
         body: {
           userId: req.user.tcUser.id,
           userHandle: req.user.tcUser.handle,
           role: 'SUBMITTER'
         },
         headers: {
           Authorization: req.headers.authorization
         }
       };

       client.postChallengesByChallengeIdParticipants(params)
         .then(function (result) {
           req.data = {
             message: "ok"
           };
         })
         .fail(function (err) {
           console.log(err);
           routeHelper.addError(req, err);
         })
         .fin(function () {
           next();
         })
         .done();  // end promise
     } else {
       req.data = {
         error: {
           details: 'You should agree with all terms of use.'
         }
       }
     }
   })
   .fail(function(err) {
     console.log(err);
     routeHelper.addError(req, err);
     next();
   })
   .done();

};

/**
 * Get documents for a challenge
 */
exports.getDocuments = function(req, res, next) {
  var params = {
    challengeId: req.params.challengeId
  };

  client.getChallengesByChallengeIdFiles(params)
    .then(function(result) {
      var files = result.body.content;
      req.data = ChallengeTCFormat.convertFiles(files);
    })
    .fail(function (err) {
      routeHelper.addError(req, err);
    })
    .fin(function () {
      next();
    })
    .done();  // end promise
};

/**
 * Create the submission record
 */
exports.createSubmission = function(req, res, next) {

  var params = {
    challengeId: req.params.challengeId,
    body: {
      submitterId: req.user.tcUser.id,
      submitterHandle: req.user.tcUser.handle,
      status: 'VALID'
    },
    headers: {
      Authorization: req.headers.authorization
    }
  };

  var fileName = req.params.fileName;

  client.postChallengesByChallengeIdSubmissions(params)
    .then(function (result) {
      return result.body.id;
    })
    .then(function (submissionId) {
      params.body = {
        title: fileName,
        fileUrl: '/challenges/' + params.challengeId +
        '/submissions/' + req.user.tcUser.handle + '/' +
        submissionId + '/' + fileName,
        size: req.params.fileSize,
        storageLocation: 'S3'
      };

      params.submissionId = submissionId;

      return client.postChallengesByChallengeIdSubmissionsBySubmissionIdFiles(params);
    })
    .then(function(result) {
      params.fileId = result.body.id;
      delete params.body;
      return client.getLink(params, 'upload');
    })
    .then(function(result) {
      return result.body.url;
    })
    .fail(function (err) {
      routeHelper.addError(req, err);
      var deleteParams = {
        challengeId: params.challengeId,
        submissionId: params.submissionId
      };

      return client.deleteChallengesByChallengeIdSubmissionsBySubmissionId(deleteParams);
    })
    .fin(function (url) {
      req.data = {
        submissionId: params.submissionId,
        url: url
      };
      next();
    })
    .done();
};

/**
 * Get list of terms
 */
exports.getChallengeTerms = function(req, res, next) {

  var params = {
    role: 'Submitter'
  };

  var headers = {
    Authorization: req.headers.authorization
  };

  request({
    method: 'GET',
    uri: config.tcApi + '/terms/' + config.tcTermChallengeId,
    qs: params,
    headers: headers
  }, function(error, response, body) {
    if (error) {
      req.data = {
        error: {
          details: "Error loading terms"
        }
      };

      next();
    } else {
      if (/^application\/(.*\\+)?json/.test(response.headers['content-type'])) {
        try {
          body = JSON.parse(body);
        } catch (e) {

        }
      }
      if (response.statusCode >= 200 && response.statusCode <= 299) {
        req.data = {
          terms: body.terms
        };
      } else {
        req.data = {
          error: {
            details: "Error loading terms"
          }
        };
      }

      next();
    }

  });
};