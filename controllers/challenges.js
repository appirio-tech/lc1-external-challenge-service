/**
 * Copyright (c) 2014 TopCoder, Inc. All rights reserved.
 */
'use strict';

/**
 * Module Dependencies.
 */
var datasource = require('../datasource').getDataSource();
var Challenge = datasource.Challenge;
var ChallengeRegistrant = datasource.ChallengeRegistrant;
var Requirement = datasource.Requirement;
var _ = require('lodash');
var routeHelper = require('../lib/routeHelper');
var ChallengeTCFormat = require('../format/challenges-tc-format');

/**
 * allActiveChallenges is invoked by /getActiveChallenges.
 * allActiveChallenges queries all Challenges from PostgreSQL that are not 'complete' or 'draft'.
 * Those challenges are then mapped into the same json format used currently by Topcoder
 *   with the help of ChallengeTCFormat.Convert function.
 * All mapped challenges are sent as the response.
 *
 * It should also be noted that if there is no challenges returned, an empty array is sent as the response.
 */
exports.allActiveChallenges = function (req, res) {
  Challenge.findAll({
    where: ['"status" <> \'complete\' AND "status" <> \'draft\''],
    include: [ChallengeRegistrant]
  }).success(function (result) {
    var allChallengesInTCFormat = [];
    for (var i = 0; i < result.length; i++) {
      allChallengesInTCFormat.push(
        ChallengeTCFormat.Convert(result[i].dataValues)
      );
    }
    res.json(allChallengesInTCFormat);
  })
    .error(function (err) {
      console.log('list err: ' + JSON.stringify(err));
      return res.status(500).json({
        error: 'Cannot list the challenges'
      });
    });
};

/**
 * Function to get challenge detail, including requirements data.
 */
exports.challenge = function(req, res) {
  var challengeId = req.params.challengeId;
  Challenge.find({
    where: {"id": challengeId},
    include: [ChallengeRegistrant, Requirement]
  })
    .success(function (result) {
      var challenge = result.dataValues;

      var requirementDatas = challenge.requirements;
      challenge.requirements = [];
      _.forEach(requirementDatas, function(data) {
        // remove unnecessary sequelize related data.
        delete data.dataValues.challengeRequirement;

        // add requirement data, but not sequelize object to list.
        challenge.requirements.push(data.dataValues)

      });
      // convert the format and return in json.
      res.json(ChallengeTCFormat.Convert(challenge));
    })
    .error(function (err) {
      console.log('Get challenge err: ' + JSON.stringify(err));
      return res.status(500).json({
        error: 'Cannot get the challenge'
      });
    });

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
  var data = {
    challengeId: req.params.challengeId,
    userId: 123,
    handle: '_indy-' + Math.random(),
    role: 'registered'
  };

  ChallengeRegistrant.create(data).success(function () {
    req.data = {message: "ok"};
    next();
  })
    .error(function (err) {
      routeHelper.addError(req, 'DatabaseSaveError', err);
      next();
    });
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