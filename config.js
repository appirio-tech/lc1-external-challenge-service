/**
 * Copyright (c) 2014 TopCoder, Inc. All rights reserved.
 */
'use strict';

var path = require('path'),
  rootPath = path.normalize(__dirname);

module.exports = {

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
  root: rootPath,
  storageProviders : {
    local: {
      /**
       * This path is needed to load the provider during application load
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
         * @type {String}
         */
        uploadsDirectory: './uploads',
        tempDir: './temp'
      }
    }
  },
  uploads : {
    /**
     * Should be configured in storageProviders
     * @type {String}
     */
    storageProvider : 'local'
  }
};
