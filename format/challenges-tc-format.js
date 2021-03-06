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

module.exports.Convert = function(ChallengeLCFormat, curUser, isListing) {
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
  var detailDataHtml = '';
  if (!isListing) {
    var detailData = "## Overview ##\n" + ChallengeLCFormat.overview +
      "\n## Description ##\n" +  ChallengeLCFormat.description;

    if (ChallengeLCFormat.requirements && ChallengeLCFormat.requirements.length) {
      var requirements = _.sortBy(ChallengeLCFormat.requirements, 'id');

      detailData += "\n## Requirements ##";
      detailData += _.reduce(requirements, function (text, item) {
        return text + "\n 1. " + item.requirementText;
      }, '');
    }
    detailDataHtml = '<div class="markdownPreview">' + converter.makeHtml(detailData) + '</div>';
  }

  // if we're returning listings, we don't need to do all these transformations.
  // we just need the length
  var submissions = isListing ? ChallengeLCFormat.submissions : _.map(ChallengeLCFormat.submissions, function(submission) {
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
      lcSubmissionFileId: 0,
      handle: submission.submitterHandle,
      screeningScore: 0,
      initialScore: 0,
      submissionStatus: submissionStatus,
      points: 0,
      submissionDate: new Date(submission.createdAt).toISOString(),
      lcLinkViewable: checkUserSubmission(submission)
    };

    var scorecard = _.find(ChallengeLCFormat.scorecards, {submissionId: submission.id});

    if (scorecard) {
      returnValue.lcScorecardId = scorecard.id;
      returnValue.placement = scorecard.place;
      returnValue.finalScore = scorecard.scorePercent;
    }

    return returnValue;
  });

  // get the current user's role
  var curRole;
  // Did the current user submit?
  var curSubmit = false;

  if (curUser) {
    var curRoleObj = _.find(ChallengeLCFormat.participants, {userId: curUser.id});
    if (curRoleObj) {
      curRole = curRoleObj.role;
    }

    // if it's listings, we didn't do a transformation
    var searchObj = isListing ? {id: curUser.id} : {lcSubmitterId: curUser.id};
    if (_.find(submissions, searchObj)) {
      curSubmit = true;
    }
  }

  function checkUserSubmission(submission) {
    // Only register users can see scorecards.
    if (!curUser || !curRole || typeof submission === 'undefined') {
      return false
    } else {
      // The Owner and Reviewer of a challenge can see all links
      if (!_.contains(['OWNER', 'REVIEWER'], curRole)) {
        if (curRole !== 'SUBMITTER') {
          return false
        }

        // Only members who have submitted can see the scorecard
        if (!curSubmit) {
          return false
        } else {
          // if the challenge is not complete and this user is not the submitter of this submission
          if (ChallengeLCFormat.status !== 'COMPLETE' && submission.submitterId !== curUser.id) {
            return false
          }
        }
      }
    }

    return true
  }

  var challengeRegistrants = _.map(ChallengeLCFormat.participants, function(participant) {

    if (participant.role !== "SUBMITTER") {
      return false;
    }
    // for listings, we just want to make sure we're returning submitter role folks
    if (isListing) return true;

    var participantSubmission = _.findLast(submissions, {lcSubmitterId: participant.userId});

    if (typeof participantSubmission === 'undefined') {
      participantSubmission = {
        submissionDate: '',
        lcSubmissionId: 0,
        lcScorecardId: 0
      };
    } else if (!checkUserSubmission(participantSubmission)) {
      participantSubmission.lcSubmissionId = 0;
      participantSubmission.lcScorecardId = 0;
    }

    return {
      handle: participant.userHandle,
      reliability: 'N/A',
      registrationDate: participant.createdAt,
      submissionDate: participantSubmission.submissionDate,
      rating: 'N/A',
      colorStyle: 'color: #000000',
      lcSubmissionId: participantSubmission.lcSubmissionId, // this controls the link on the registrants table on www
      lcScorecardId: participantSubmission.lcScorecardId // this controls the link on the registrants table on www
    };
  });

  var finalSubmissionGuidelines = "<p>You will submit the following files.  Please see help.topcoder.com for more information on these files.</p>";
  finalSubmissionGuidelines += '<ul><li>Technology Architecture Diagram</li>';
  finalSubmissionGuidelines += '<li>POCDeployment Script</li>';
  finalSubmissionGuidelines += '<li>Domain Logic Diagram</li>';
  finalSubmissionGuidelines += '<li>Approach Doc / Readme</li>';

  challengeRegistrants = _.filter(challengeRegistrants);

  // similar to the non-listings object, but excludes registrants and submissions
  if (isListing) {
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
      finalSubmissionGuidelines: finalSubmissionGuidelines,
      screeningScorecardId: null,
      reviewScorecardId: null,
      cmcTaskId: "",
      numberOfCheckpointsPrizes: 0,
      topCheckPointPrize: "",
      platforms: ChallengeLCFormat.tags,
      technology: ChallengeLCFormat.tags,
      numSubmissions: ChallengeLCFormat.submissions.length,
      numRegistrants: challengeRegistrants.length,
      numberOfSubmissions: ChallengeLCFormat.submissions.length,
      numberOfRegistrants: challengeRegistrants.length,
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
    };
  }

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
    finalSubmissionGuidelines: finalSubmissionGuidelines,
    screeningScorecardId: null,
    reviewScorecardId: null,
    cmcTaskId: "",
    numberOfCheckpointsPrizes: 0,
    topCheckPointPrize: "",
    platforms: ChallengeLCFormat.tags,
    technology: ChallengeLCFormat.tags,
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

      var submissionFileId = scorecard.submission.files[0] ? scorecard.submission.files[0].id : 0;

      return {
        lcScorecardId: scorecard.id,
        lcSubmissionId: scorecard.submission.id,
        lcSubmitterId: scorecard.submission.submitterId,
        lcSubmissionFileId: submissionFileId,
        handle: scorecard.submission.submitterHandle,
        registrationDate: scorecard.submission.createdAt,
        placement: scorecard.place,
        screeningScore: 0,
        initialScore: 0,
        finalScore: scorecard.scorePercent,
        points: 0,
        submissionStatus: submissionStatus,
        submissionDate: new Date(scorecard.submission.createdAt).toISOString(),
        submissionDownloadLink: ''
      };
    } else {
      return false;
    }

  });

  results = _.filter(results);

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
