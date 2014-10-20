/**
 * Copyright (c) 2014 TopCoder, Inc. All rights reserved.
 *
 * This module is used to define any logic that involves mapping attributes
 * to JSON format currently used by Topcoder site.
 */
'use strict';

/**
 * Module Dependency.
 */
var config = require('../config.js');

/**
 * Convert is tasked to map attributes in Challenge data queried from PostgreSQL
 * into attributes in JSON format currently used by Topcoder.
 *
 * For more info in table mapping, visit:
 *   https://github.com/topcoderinc/serenity-core/issues/46
 *
 * There are several notes here:
 * - numRegistrants is calculated by setting up the relationship via the model.
 * - All dates are converted to UTC Time.
 * - currentPhaseRemainingTime is returned in milliseconds.
 *
 * @param ChallengeLCFormat Challenge data queried from PostgreSQL
 */

module.exports.Convert = function(ChallengeLCFormat) {
  var regStartDateInUTC = ChallengeLCFormat.regStartDate.toUTCString();
  var subEndDateInUTC = ChallengeLCFormat.subEndDate.toUTCString();
  var nowInUTC = (new Date()).toUTCString();
  var differenceEndAndNow = new Date(subEndDateInUTC)-new Date(nowInUTC);
  if (differenceEndAndNow < 0) differenceEndAndNow = 0;
  
  var ChallengeTCFormat = {
    source: 'serenity',
    challengeType: ChallengeLCFormat.type,
    challengeName: ChallengeLCFormat.title,
    challengeUrl: config.urlPrefix + ChallengeLCFormat.id,
    challengeId: ChallengeLCFormat.id,
    platforms: ChallengeLCFormat.tags,
    technologies: ChallengeLCFormat.tags,
    numSubmissions: 0,
    numRegistrants: ChallengeLCFormat.challengeRegistrants.length,
    postingDate: regStartDateInUTC,
    registrationEndDate: subEndDateInUTC,
    isPrivate: false,
    submissionEndDate: subEndDateInUTC,
    currentPhaseEndDate: subEndDateInUTC,
    currentPhaseRemainingTime: differenceEndAndNow,
    currentStatus: ChallengeLCFormat.status,
    currentPhaseName: 'Submission',
    prize: [],
    reliabilityBonus: 0,
    challengeCommunity: 'develop',
    registrationOpen: 'Yes'
  }

  return ChallengeTCFormat;
};