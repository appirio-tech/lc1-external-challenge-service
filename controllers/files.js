'use strict';

/**
 * File upload controller
 */

/**
 * Module dependencies.
 */

/**
 * Loading storage provider
 */
var config = require('../config'),
  storageProviders = config.storageProviders,
  providerName = config.uploads.storageProvider;
var providerConfig = storageProviders[providerName];

var provider = require(config.root + '/' + providerConfig.path)(providerConfig.options, config);

/**
 * upload file handler
 */
exports.uploadHandler = function(req, res, next) {
  console.log('Upload handler. Upload status ' + JSON.stringify(req.fileUploadStatus));
  var challengeId = req.params.challengeId;
  var title;
  if (req.body) {
    title = req.body.title;
  }
  if(!title) {
    // If title is empty add dummy title
    // can return error to client
    title = 'File Title';
  }

  // checking upload error
  var err = req.fileUploadStatus.err;
  if (err) {
    req.data = {
      error: {
        details: 'Error while trying to read uploaded file: ' + err
      }
    };
  }
  var fileEntity = req.fileUploadStatus.file;
  if(fileEntity) {
    fileEntity.title = title;
  }
  next();
};
