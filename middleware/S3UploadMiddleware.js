'use strict';

/**
 * Amazon s3 storage provider.
 * A storage provider should implement atleast following two methods
 *
 * /**
 *  * handleUpload method. It will store the file based on the service provided by this provided
 *  * This method will set the request body property
 *  * body : {
 *  *   id: // by default challenge id
 *  *   filePath : ''
 *  *   tempPath : ''
 *  *   fileName : ''
 *  *   size : ''
 *  *   storageType : ''
 *  * }
 *  * If error occurred. req.error will be set to error object
 *  *
 * function store(req,res,next) {
 *   // do something store the file and set the request object
 * }
 *
 * /**
 * * Delete handleer. This method delete the specified file from resource
 * * @param  {File}           file              The file object to delete
 * * @param  {Function}       callback          Callback function
 * *
 * * The signature of callback function
 * *
 * * function callback(err) {
 * *   if(err) {
 * *      // error occured during delete
 * *   } else {
 * *     // deleted successfully. Proceed
 * *   }
 * * }
 *
 * function delete(file, callback) {
 *   // do something. Delete file from resource
 * }
 *
 *
 *
 */

/**
 * Module dependencies
 */
var multiparty = require('multiparty'),
  routeHelper = require('../lib/routeHelper'),
  knox = require('knox'),
  Batch = require('batch'),
  /**
   * HTTP OK STATUS CODE
   * @type {Number}
   */
  HTTP_OK = 200,

  /**
   * HTTP NO CONTENT STATUS CODE
   */
  HTTP_NO_CONTENT = 204;

var headers = {
  'x-amz-acl': 'public-read'
};

var checkOptions = function(options) {
  // check options for AMAZON S3 upload service
  if(!options.aws.key || !options.aws.secret || !options.aws.bucket || !options.aws.region) {
    return new Error('Access Key, Access Secret, bucket and region configuration are mandatory for AWS upload service');
  }
};

function onEnd() {
  console.log('Multi part form parsed successfully');
}

module.exports = function(options, config) {
  var err = checkOptions(options);
  if(err) {
    throw err;
  }

  /**
   * Creating knox s3 client
   */
  var s3Client = knox.createClient({
    secure: false,
    key: options.aws.key,
    secret: options.aws.secret,
    bucket: options.aws.bucket,
    region: options.aws.region
  });

  var provider = {};

  /**
   * Handles file upload
   * @param  {Object}       req       Request object
   * @param  {Object}       res       Response object
   * @param  {Function}     next      Next function
   */
  provider.store = function(req, res, next) {
    var form = new multiparty.Form(),
      batch = new Batch();

    var fileUplaodStatus = {};

    var uploadFile = function(file) {
      console.log('upload');
      var fileName = file.originalFilename;
      headers['Content-Length'] = file.byteCount;
      var targetPath = '/challenges' + '/' + req.params.challengeId + '/' + fileName;

      var fileData = {
        // filePath : targetPath,
        //fileName : fileName,
        fileUrl : targetPath,
        size : file.byteCount,
        // storageLocation configured in config. same as name of storage provider
        // challenge service is using storageLocation so chaned storageType to storage location
        storageLocation : config.uploads.storageProvider
      };

      fileUplaodStatus.file = fileData;
      s3Client.put(file, targetPath, headers, function(err, s3Response) {
        if (err) {
          routeHelper.addError(req, err, s3Response.statusCode);
          fileUplaodStatus.err = err;
        } else {
          console.log('s3 response code' + s3Response.statusCode);
          if(s3Response.statusCode === HTTP_OK) {
          } else {
            // S3 response code is not HTTP OK error occured during upload
            routeHelper.addError(req, new Error('upload failed'), s3Response.statusCode);
            fileUplaodStatus.err = err;
          }
        }
        req.fileUplaodStatus = fileUplaodStatus;
        next();
      });
    };

    batch.push(function(cb) {
      // add field parameters
      form.on('field', function(name, value) {
        file[name] = value;
        cb(null, '');
      });
    });


    batch.push(function(cb) {
      form.on('file', function(name, file) {
        console.log('submissionFile');
        uploadFile(file);

        cb(null, '');
      })
    });

    batch.end(function(err, results) {
      console.log('end');
      if(err) {
        routeHelper.addError(req, err);
        return next();
      }
      form.removeListener('close', onEnd);
      var part = results[1];
      uploadFile(part);
    });
    form.on('close', onEnd);
    form.parse(req);
  };

  /**
   * Delete handleer. This method delete the specified file from resource
   * @param  {File}           file              The file object to delete
   * @param  {Function}       callback          Callback function
   *
   * The signature of callback function
   *
   * function callback(err) {
   *   if(err) {
   *      // error occured during delete
   *   } else {
   *     // deleted successfully. Proceed
   *   }
   * }
   */
  provider.delete = function(file, callback) {
    if(!file.filePath) {
      callback(new Error('Invalid file'));
      return;
    }
    // s3 storage delete s3 object
    s3Client.del(file.filePath).on('response', function(res) {
      if(res.statusCode === HTTP_OK || res.statusCode === HTTP_NO_CONTENT) {
        // File deleted from s3
        callback(null);
      } else {
        callback(new Error('Failed to delete s3 file'));
      }
    }).end();

  };
  return provider;
};
