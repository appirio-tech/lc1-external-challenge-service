/**
 * Copyright (c) 2014 TopCoder, Inc. All rights reserved.
 *
 * This module is the entry-point for serenity-list application.
 * For more information, please check README.md.
 */
'use strict';

/**
 * Module Dependencies.
 */
var express = require('express');
var config = require('./config.js');
var routeHelper = require('./lib/routeHelper');
var datasource = require('./datasource').init(config);
var challenges = require('./controllers/challenges');
var cors = require('cors');

/**
 * File controller
 * @type {Object}
 */
var files = require('./controllers/files');

/**
 * Initialize ExpressJS.
 */
var app = express();

// Add cors support
app.use(cors());
app.options('*', cors());

/**
 * Initializing storage provider
 */
var storageProviders = config.storageProviders,
  providerName = config.uploads.storageProvider;

var provider;
if(storageProviders.hasOwnProperty(providerName)) {
  var providerConfig = storageProviders[providerName];
  provider = require(config.root + '/' + providerConfig.path)(providerConfig.options, config);
} else {
  throw new Error(providerName + 'is not configured in Storage Providers');
}

/**
 * Define route /getActiveChallenges using GET method.
 * Use allActiveChallenges function of challenges controller to handle the request.
 */
app.route('/getActiveChallenges')
  .get(challenges.allActiveChallenges, routeHelper.renderJson);

/**
 * Define route /challenges/:challengeId using GET method.
 * Use challenge function of challenges controller to handle the request.
 */
app.route('/develop/challenges/:challengeId')
  .get(challenges.challenge, routeHelper.renderJson);

/**
 * Fake route for checkpoints
 */
app.route('/develop/challenges/checkpoint/:challengeId')
  .get(challenges.getCheckpoints, routeHelper.renderJson);

/**
 * Register to a challenge
 */
app.route('/challenges/:challengeId/register')
  .post(challenges.register, routeHelper.renderJson);

/**
 * Get Documents
 */
app.route('/challenges/:challengeId/documents')
  .get(challenges.getDocuments, routeHelper.renderJson);

app.route('/develop/challenges/:challengeId/submit')
  .post(challenges.submit, routeHelper.renderJson);

/**
 * Upload files
 */
app.route('/develop/challenges/:challengeId/upload')
  .all(provider.store)
  .post(files.uploadHandler, routeHelper.renderJson);

/**
 * Start listening to a specific port 12345.
 * You can change the port in the config file.
 */
var server = app.listen(config.port, function(){
  console.log('Listening on port %d', server.address().port);
});
