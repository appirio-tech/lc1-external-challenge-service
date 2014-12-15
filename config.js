/**
 * Copyright (c) 2014 TopCoder, Inc. All rights reserved.
 */
'use strict';

var path = require('path'),
  // The path should not end in forward slash
  rootPath = path.normalize(__dirname);

module.exports = {
  root: rootPath,
  /**
   * Application Details
   */
  app: {
    name: '[Topcoder Serenity List]'
  },
  /**
   * Which port will this application listen to
   */
  //port: 12345,
  port: process.env.PORT || 3000,

  disableAuth: process.env.TC_SKIP_AUTH || false,

  auth0: {
    client: process.env.TC_AUTH0_CLIENT || 'foo',
    secret: process.env.TC_AUTH0_SECRET || 'bar'
  },

  tcApi: process.env.TC_API_URL || 'https://api.topcoder.com/v2',

  /**
   * challenge and term ids
   */
  tcTermChallengeId: process.env.TC_TERM_CHALLENGE_ID || 0,
  tcTermId: process.env.TC_TERM_ID || 0,

  /**
   * URL of lc1-challenge-service where Swagger client sends requests.
   */
  // challengeApiUrl: 'http://localhost:10010',   // for local challenge service
  challengeApiUrl: process.env.CHALLENGE_LC_URL || 'http://dev-lc1-challenge-service.herokuapp.com',
  /**
   * URL Prefix that is used for Challenge URL sent to the client
   * Please refer to below link for more information
   *   https://github.com/topcoderinc/serenity-core/issues/46
   */
  urlPrefix: process.env.URL_PREFIX || 'http://staging.lc.topcoder.com/#!/challenges/',
  uploads : {
    /**
     * Should be configured in storageProviders
     * @type {String}
     */
    storageProvider : process.env.STORAGE_PROVIDER || 'local'
  },
  /**
   * Storage providers configuration
   * A storage provider should support two operations
   * store and delete
   * @type {Object}
   */
  storageProviders : {
    local: {
      /**
       * This path is needed to load the provider during application load
       * NOTE: The path is relative to root of application and should not end in a forward slash
       * @type {String}
       */
      path: './middleware/LocalUploadMiddleware',
      options: {
        /**
         * Unique Id for this storage provider
         * NOTE: Every storage provider should have a unique id
         * @type {Number}
         */
        id: 'local',
        /**
         * These are upload directories for local storage provider
         * NOTE: The local middleware is modified, if the uploads and temp directory is not present it will create the directory
         * @type {String}
         */
        uploadsDirectory: './uploads',
        tempDir: './temp'
      }
    },
    amazonS3: {
      // NOTE: The path is relative to root of application and should not end in a forward slash
      path: './middleware/S3UploadMiddleware',
      options: {
        /**
         * This path is needed to load the provider during application load
         * @type {String}
         */
        id: 'S3',
        /**
         * AWS configuration for s3 upload service
         * @type {Object}
         */
        aws: {
          secure: true,
          key: process.env.AWS_KEY || 'foo',
          secret: process.env.AWS_SECRET || 'bar',
          bucket: process.env.AWS_BUCKET || 'bucket',
          region: process.env.AWS_REGION || 'region'
        }
      }
    }
  }
};
