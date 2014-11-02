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
   * Database Details
   */
  pg: {
    database: 'dc6c3p1lnfqrvo',
    username: 'idgimrogqewzfg',
    password: '-C6oh1ld9u_pm4201sctLVqPwX',
    host: 'ec2-54-197-250-52.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    native: true
  },
  /**
   * Which port will this application listen to
   */
  //port: 12345,
  port: process.env.PORT || 3000,
  /**
   * URL Prefix that is used for Challenge URL sent to the client
   * Please refer to below link for more information
   *   https://github.com/topcoderinc/serenity-core/issues/46
   */
  urlPrefix: 'http://serenity-core1.herokuapp.com/#!/challenges/',
  uploads : {
    /**
     * Should be configured in storageProviders
     * @type {String}
     */
    storageProvider : 'local'
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
        id: 1,
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
        id: 2,
        /**
         * AWS configuration for s3 upload service
         * @type {Object}
         */
        aws: {
          secure: false,
          key: 'KEY',
          secret: 'SECRET_KEY',
          bucket: 'bucket',
          region: 'region'
        }
      }
    }
  }
};
