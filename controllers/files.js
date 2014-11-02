'use strict';

/**
 * File upload controller
 */

/**
 * Module dependencies.
 */
var datasource = require('./../datasource').getDataSource();
var Challenge = datasource.Challenge;
var config = require('../config');
var routeHelper = require('../lib/routeHelper');

var HTTP_BAD_REQUEST = 400;

/**
 * upload file handler
 */
exports.uploadHandler = function(req, res, next) {
  var challengeId = req.params.challengeId;
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
  Challenge.find(challengeId).success(function(challenge) {
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
        next();
      } else {
        routeHelper.addError(req,'UploadError', {details: 'Unexpected error. Try again after some time'},req.fileUploadStatus.statusCode);
        next();
      }
    } else {
      // challenge doesn't exist return BadRequest error to client
      routeHelper.addError(req, 'BadRequest', {details: 'Challenge doesn\'t exist for challenge id ' + challengeId}, HTTP_BAD_REQUEST);
      next();
    }
  }).error(function(err) {
    routeHelper.addError(req, err);
    next();
  });
};