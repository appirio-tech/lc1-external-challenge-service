'use strict';

/**
 * File upload controller
 */

/**
 * Module dependencies.
 */
// var datasource = require('./../datasource').getDataSource();
// var Challenge = datasource.Challenge;
var config = require('../config');
var routeHelper = require('../lib/routeHelper');
var Challenge = require('./challenge-consumer').Challenge;

var HTTP_BAD_REQUEST = 400;

var client = new Challenge(config.challengeApiUrl);


/**
 * upload file handler
 */
exports.uploadHandler = function(req, res, next) {
  
  // checking upload error
  var err = req.fileUploadStatus.error;
  if(err) {
    // topcoder client needs the error.message as error.details
    routeHelper.addError(req,'UploadError', {details: err.message, code: err.code},req.fileUploadStatus.statusCode);
    return next();
  }

  /**
   * Added challenge exists or not validation
   */
  client.getChallengesByChallengeId(req.params)
    .then(function(result) {
      var challenge = result.body.content;
      if(challenge) {
        // challenge exists, proceed with file uplaod logic
        var title;
        var isTitle = req.body && req.body.title;
        if(!isTitle) {
          // If title is empty add dummy title
          // can return error to client
          title = 'File Title';
        }
        var fileEntity = req.fileUploadStatus.file;
        if(fileEntity) {
          fileEntity.title = title;
          // can save the fileEntity to database
        } else {
          routeHelper.addErrorMessage(req,'UploadError', 'Unexpected error. Try again after some time', req.fileUploadStatus.statusCode);
        }
      } else {
        // challenge doesn't exist return BadRequest error to client
        routeHelper.addErrorMessage(req, 'BadRequest', 'Challenge doesn\'t exist for challenge id ' + req.params.challengeId, HTTP_BAD_REQUEST);
      }
    })
    .fail(function (err) {
      routeHelper.addError(req, err);
    })
    .fin(function () {
      next();
    })
    .done();  // end promise

};
