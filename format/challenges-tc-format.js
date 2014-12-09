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
 * Convert is tasked to map attributes in Challenge data queried from lc-challenge-service
 * into attributes in JSON format currently used by Topcoder.
 *
 * For more info in table mapping, visit:
 *   https://github.com/topcoderinc/serenity-core/issues/46
 *
 * There are several notes here:
 * - numRegistrants is calculated by participants in the challenge.
 * - All dates are converted to UTC Time.
 * - currentPhaseRemainingTime is returned in milliseconds.
 *
 * @param ChallengeLCFormat Challenge data queried from PostgreSQL
 */

module.exports.Convert = function(ChallengeLCFormat) {
  var subEndDateInUTC = new Date(ChallengeLCFormat.subEndAt).toISOString();
  var nowInUTC = (new Date()).toUTCString();
  var differenceEndAndNow = new Date(subEndDateInUTC)-new Date(nowInUTC);
  if (differenceEndAndNow < 0) {
    differenceEndAndNow = 0;
  } else {
    differenceEndAndNow = Math.floor(differenceEndAndNow / 1000)
  }

  var phaseStatus;
  var currentStatus;
  var currentPhaseEndDate;
  var registrationOpen;
  var submissionDisabled;
  switch(ChallengeLCFormat.status) {
    case 'SUBMISSION':
      phaseStatus = 'Submission';
      currentStatus = 'Active';
      currentPhaseEndDate = subEndDateInUTC;
      registrationOpen = true;
      submissionDisabled = false;
      break;
    case 'REVIEW':
      phaseStatus = 'Review';
      currentStatus = 'Active';
      currentPhaseEndDate = subEndDateInUTC;
      registrationOpen = false;
      submissionDisabled = true;
      break;
    case 'COMPLETE':
      phaseStatus = 'Complete';
      currentStatus = 'Completed';
      currentPhaseEndDate = '';
      registrationOpen = false;
      submissionDisabled = true;
      break;
    default:
      phaseStatus = 'Draft';
      currentPhaseEndDate = subEndDateInUTC;
      registrationOpen = false;
      submissionDisabled = true;
      break;
  }

  // merge overview, description and requirement details as detail data
  // @TODO only do this for detail requests
  var detailData = "## Overview ##\n" + ChallengeLCFormat.overview +
    "\n## Description ##\n" +  ChallengeLCFormat.description;
  if (ChallengeLCFormat.requirements && ChallengeLCFormat.requirements.length) {
    detailData += "\n## Requirements ##";
    detailData += _.reduce(ChallengeLCFormat.requirements, function (text, item) {
      return text + "\n 1. " + item.requirementText;
    }, '');
  }
  var detailDataHtml = converter.makeHtml(detailData);

  var submissions =_.map(ChallengeLCFormat.submissions, function(submission) {
    var submissionStatus;
    switch(submission.status) {
      case 'VALID':
        submissionStatus = 'Active';
        break;
      case 'INVALID':
        submissionStatus = 'Failed Review';
        break;
      case 'LATE':
        submissionStatus = 'Failed Late';
        break;
      default:
        submissionStatus = 'Active';
        break;
    }

    var returnValue = {
      lcSubmissionId: submission.id,
      lcSubmitterId: submission.submitterId,
      handle: submission.submitterHandle,
      screeningScore: 0,
      initialScore: 0,
      submissionStatus: submissionStatus,
      points: 0,
      submissionDate: new Date(submission.createdAt).toISOString()
    };

    var scorecard = _.find(ChallengeLCFormat.scorecards, {submissionId: submission.id});

    if (scorecard) {
      returnValue.lcScorecardId = scorecard.id;
      returnValue.placement = scorecard.place;
      returnValue.finalScore = scorecard.scoreSum;
    }

    return returnValue;
  });

  var challengeRegistrants = _.map(ChallengeLCFormat.participants, function(participant) {

    var participantSubmission = _.findLast(submissions, {lcSubmitterId: participant.userId});

    if (typeof participantSubmission === 'undefined') {
      participantSubmission = { submissionDate: '', lcSubmissionId: 0};
    }

    return {
      handle: participant.userHandle,
      reliability: 'N/A',
      registrationDate: participant.createdAt,
      submissionDate: participantSubmission.submissionDate,
      rating: 'N/A',
      colorStyle: 'color: #000000',
      lcSubmissionId: participantSubmission.lcSubmissionId,
      lcScorecardId: participantSubmission.lcScorecardId
    };
  });


  return {
    source: 'serenity',
    isLC: true,
    challengeType: 'Architecture',
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
    numSubmissions: ChallengeLCFormat.submissions.length,
    numRegistrants: challengeRegistrants.length,
    numberOfSubmissions: ChallengeLCFormat.submissions.length,
    numberOfRegistrants: challengeRegistrants.length,
    registrants: challengeRegistrants,
    postingDate: new Date(ChallengeLCFormat.regStartAt).toISOString(),
    registrationEndDate: ChallengeLCFormat.subEndAt,
    checkpointSubmissionEndDate: null,
    submissionEndDate: ChallengeLCFormat.subEndAt,
    type: "develop",
    forumLink: "#lc-discussion",
    appealsEndDate: "",
    finalFixEndDate: "",
    currentStatus: currentStatus,
    digitalRunPoints: 0,
    reliabilityBonus: 0,
    directUrl: null,
    isPrivate: false,
    currentPhaseEndDate: currentPhaseEndDate,
    currentPhaseRemainingTime: differenceEndAndNow,
    currentPhaseName: phaseStatus,
    prizes: ChallengeLCFormat.prizes || [],
    prize: ChallengeLCFormat.prizes || [],
    challengeCommunity: 'develop',
    phases: [{scheduledStartTime: ChallengeLCFormat.regStartAt}],
    event: {"id": 3442, "description": "2015 topcoder Open", "shortDescription": "tco15"},
    submissions: submissions
  };
};

module.exports.convertResult = function(ChallengeLCFormat) {

  var results = _.map(ChallengeLCFormat.scorecards, function(scorecard) {
    var submissionStatus;
    if (scorecard.submission) {
      switch(scorecard.submission.status) {
        case 'VALID':
          submissionStatus = 'Active';
          break;
        case 'INVALID':
          submissionStatus = 'Failed Review';
          break;
        case 'LATE':
          submissionStatus = 'Failed Late';
          break;
        default:
          submissionStatus = 'Active';
          break;
      }

      return {
        lcScorecardId: scorecard.id,
        lcSubmissionId: scorecard.submission.id,
        lcSubmitterId: scorecard.submission.submitterId,
        handle: scorecard.submission.submitterHandle,
        placement: scorecard.place,
        screeningScore: 0,
        initialScore: 0,
        finalScore: scorecard.scoreSum,
        points: 0,
        submissionStatus: submissionStatus,
        submissionDate: new Date(scorecard.submission.createdAt).toISOString(),
        submissionDownloadLink: scorecard.submission.files[0].fileUrl
      };
    } else {
      return false;
    }

  });

  return {
    isLC: true,
    challengeCommunity: "develop",
    challengeType: "Architecture",
    challengeName: ChallengeLCFormat.title,
    challengeId: ChallengeLCFormat.id,
    registrants: ChallengeLCFormat.participants.length,
    submissions: ChallengeLCFormat.submissions.length,
    submissionsPassedScreening: ChallengeLCFormat.scorecards.length,
    drPoints: 0,
    submissionsPercentage: 0,
    averageInitialScore: 0,
    averageFinalScore: 0,
    results: results
  };

};

module.exports.convertFiles = function(LCfiles) {
  var files = _.map(LCfiles, function(file) {
    return {
      id: file.id,
      url: file.fileUrl,
      documentName: file.title ? file.title : file.fileUrl.split(/(\\|\/)/g).pop()
    }
  });

  return {
    Documents: files
  };
};