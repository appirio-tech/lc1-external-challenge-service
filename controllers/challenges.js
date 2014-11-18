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

/**
 * register to a challenge
 */
exports.register = function(req, res, next) {
  var params = {
    challengeId: req.params.challengeId,
    body: {
      userId: 123,
      role: 'submitter'
    }
  };

  client.postChallengesByChallengeIdParticipants(params)
    .then(function (result) {
      req.data = result.body;
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
 * Get documents for a challenge
 */
exports.getDocuments = function(req, res, next) {
  req.data = {
    Documents: [{
      url: 'http://google.com',
      documentName: 'Hi Mom'
    }]
  };
  next();
};

/**
 * Submit to a challenge
 */
exports.submit = function(req, res, next) {
  req.data = {
    submissionId: 123
  };
  next();
};