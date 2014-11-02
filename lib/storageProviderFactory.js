'use strict';

/**
 * Storage provider factory
 * Factory pattern added for storage providers.
 * Any module that wants to use storage providers can call the factory method 'getProvider(name)'
 */
var config = require('../config');

var factory = {};

/**
 * Factory method to get the provider
 * The providerName should be configured in configuration
 * 
 * @param  {String}   providerName        The name of the provider to get. For current application can be local or amazonS3
 * @return {Object}                       The provider object
 * @throws {Error}                        If providerName is not configured in storage providers
 */
factory.getProvider = function(providerName) {
  // if provider is initialized return that
  if(this.provider) {
    return this.provider;
  } else {
    // initialize the provider and return that
    var storageProviders = config.storageProviders;
    if(storageProviders.hasOwnProperty(providerName)) {
      var providerConfig = storageProviders[providerName];
      this.provider = require(config.root + '/' + providerConfig.path)(providerConfig.options, config);
      return this.provider;
    } else {
      throw new Error(providerName + 'is not configured in Storage Providers');
    }
  }
};