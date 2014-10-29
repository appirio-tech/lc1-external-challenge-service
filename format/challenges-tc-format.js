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
var Showdown = require('showdown');
var _ = require('lodash');

// converter to convert markdown data to html.
var converter = new Showdown.converter();

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

  ChallengeLCFormat.prizes = [];

  var phaseStatus;
  var currentStatus;
  switch(ChallengeLCFormat.status) {
    case 'ACTIVE':
      phaseStatus = 'Submission';
      currentStatus = 'Active';
      break;
    case 'COMPLETE':
      phaseStatus = 'Complete';
      currentStatus = 'Completed';
      break;
    default:
      phaseStatus = 'Draft';
      break;
  }

  // merge overview, description and requirement details as detail data
  var detailData = "## Overview ##\n" + ChallengeLCFormat.overview +
    "\n## Description ##\n" +  ChallengeLCFormat.description;
  if (ChallengeLCFormat.requirements && ChallengeLCFormat.requirements.length) {
    detailData += "\n## Requirements ##";
    for(var i = 1; i < ChallengeLCFormat.requirements.length; i++){
      detailData += "\n" + i + ". " + ChallengeLCFormat.requirements[i].body;
    }
  }
  var detailDataHtml = converter.makeHtml(detailData);

  var challengeRegistrants = _.map(ChallengeLCFormat.challengeRegistrants, function(registrant) {
    return {
      handle: registrant.handle,
      reliability: 'N/A',
      registrationDate: registrant.createdAt,
      submissionDate: '', // @TODO find if this user submitted and add a date
      rating: 'N/A',
      colorStyle: 'color: #000000'
    };
  });

  var ChallengeTCFormat = {
    source: 'serenity',
    challengeType: ChallengeLCFormat.type,
    challengeName: ChallengeLCFormat.title,
    challengeUrl: config.urlPrefix + ChallengeLCFormat.id,
    challengeId: ChallengeLCFormat.id,
    projectId: null,
    forumId: null,
    detailedRequirements: detailDataHtml,
    finalSubmissionGuidelines: "Please check the requirements in the challenge overview",
    screeningScorecardId: null,
    reviewScorecardId: null,
    cmcTaskId: "",
    numberOfCheckpointsPrizes: 0,
    topCheckPointPrize: "",
    platforms: ChallengeLCFormat.tags,
    technologies: ChallengeLCFormat.tags,
    numSubmissions: 0,
    numRegistrants: challengeRegistrants.length,
    numberOfSubmissions: 0,
    numberOfRegistrants: challengeRegistrants.length,
    registrants: challengeRegistrants,
    postingDate: regStartDateInUTC,
    registrationEndDate: ChallengeLCFormat.subEndDate,
    checkpointSubmissionEndDate: ChallengeLCFormat.subEndDate,
    submissionEndDate: subEndDateInUTC,
    type: "develop",
    forumLink: config.urlPrefix + ChallengeLCFormat.id,
    appealsEndDate: "",
    finalFixEndDate: "",
    currentStatus: currentStatus,
    digitalRunPoints: 0,
    reliabilityBonus: 0,
    directUrl: null,
    isPrivate: false,
    currentPhaseEndDate: subEndDateInUTC,
    currentPhaseRemainingTime: differenceEndAndNow,
    currentPhaseName: 'Submission', //phaseStatus, Hard code utnil data is cleaner
    prizes: ChallengeLCFormat.prizes,
    prize: ChallengeLCFormat.prizes,
    challengeCommunity: 'develop',
    registrationOpen: 'Yes',
    phases: [{scheduledStartTime: ChallengeLCFormat.regStartDate}],
    event: {"id": 3442, "description": "2015 topcoder Open", "shortDescription": "tco15" }
  };

  return ChallengeTCFormat;
};