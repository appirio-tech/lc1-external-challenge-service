/**
 * Copyright (c) 2014 TopCoder, Inc. All rights reserved.
 */
'use strict';

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
  uploadPath: 'uploads'
};
