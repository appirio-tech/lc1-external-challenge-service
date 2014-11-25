/**
 * Copyright (c) 2014 TopCoder, Inc. All rights reserved.
 *
 * This module is the entry-point for serenity-list application.
 * For more information, please check README.md.
 */
'use strict';

// env config
var dotenv = require('dotenv');
dotenv.load();

/**
 * Module Dependencies.
 */
var express = require('express');
var config = require('./config.js');
var routeHelper = require('./lib/routeHelper');
var challenges = require('./controllers/challenges');
var storageProviderFactory = require('./lib/storageProviderFactory');
var cors = require('cors');
var request = require('request');

/**
 * Initialize ExpressJS.
 */
var app = express();

// Add cors support
app.use(cors());
app.options('*', cors());

// Add auth

// Add tc user
// @TODO Move this into it's own module
/* jshint camelcase:false */
function getTcUser(req, res, next) {
  if (req.user) {
    request(config.tcApi + '/user/tcid/' + req.user.sub, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        body = JSON.parse(body);

        req.user.tcUser = {
          id: body.uid,
          name: req.user.name,
          handle: body.handle,
          picture: req.user.picture
        };
        next();
      }
      else {
        //TODO: handle error response from tc api
        res.status(503).send('TC API Unavailable');
      }
    });
  } else {
    next();
  }
}

if (!config.disableAuth) {
  var tcAuth = require('./middleware/tc-auth')(config.auth0);
  app.post('*', tcAuth);
  app.put('*', tcAuth);
  app.delete('*', tcAuth);
  app.use(getTcUser);
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
 * Get Results
 */
app.route('/develop/challenges/result/:challengeId')
    .get(challenges.getResults, routeHelper.renderJson);

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

app.route('/develop/challenges/:challengeId/upload')
  .post(challenges.createSubmission, routeHelper.renderJson);

/**
 * Start listening to a specific port 12345.
 * You can change the port in the config file.
 */
var server = app.listen(config.port, function(){
  console.log('Listening on port %d', server.address().port);
});
