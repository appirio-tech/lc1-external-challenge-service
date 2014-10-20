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
