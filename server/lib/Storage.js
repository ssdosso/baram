var EventEmitter = require('events').EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , async = require('async')
    , assert= require('assert')
    , AWS = require('aws-sdk')

    , Garam = require('./Garam')
    , Base = require('./Base');




exports = module.exports = Storage;

function Storage (mgr, name) {
    Base.prototype.constructor.apply(this,arguments);
    this._BucketList = {};
}


_.extend(Storage.prototype, Base.prototype, {
    createBucket : function(bucketName,options) {
        //this._bukcket =  new AWS.S3({Bucket:bucketName});
        if (typeof options === 'undefined') {
            assert(0);
        }
        this._BucketList[bucketName] = new Bucket(options);

    },
    uploadFile : function(AWSConfig, bucketName, saveFolder, saveVersion, fileDir, fileName, callback) {
        AWS.config.update(AWSConfig);
        var s3 = new AWS.S3();
        var saveData = null;
        var file = fs.createReadStream(fileDir + '/' + fileName, {flags: 'r', autoClose: true, encoding: 'utf-8'} );
        file.on('data', function(data) {
            if(!saveData) {
                saveData = data;
            } else {
                saveData += data;
            }
        });
        file.on('end', function() {
            console.log(saveData);
            if(saveData) {
                process.nextTick(function () {
                    var params = {Bucket: bucketName, Key: saveFolder + saveVersion + '/' + fileName, Body: saveData};
                    s3.putObject(params, function (err) {
                        if (err) {
                            Garam.logger().error(err);
                            callback(err);
                            return;
                        }
                        Garam.logger().info('Uploading to S3 is success');
                        callback(null);
                    })
                });
            }else {
                callback(null);
            }
        });
        file.on('error', function(e) {
            Garam.logger().error(e);
            callback(e);
        });

        /*fs.readFile(fileDir + '/' + fileName, 'utf-8', function(err, data) {
         setTimeout(function() {
         console.log(data);
         callback();
         }, 1000)

         /!* var params = {Bucket: bucketName, Key: saveFolder + saveVersion + '/' + fileName, Body: data};
         s3.putObject(params, function (err) {
         if (err) {
         Garam.logger().error(err);
         callback();
         } else {
         Garam.logger().info('Uploading to S3 is success');
         callback();
         }
         });*!/
         });*/
    }
});

function Bucket() {

}

/*
 { "accessKeyId": "AKIAO6SKBQUKPMTR24ZQ",
 "secretAccessKey": "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",
 "region": "cn-north-1" }
 */
_.extend(Bucket.prototype, Base.prototype, {
    create : function(options) {
        if (_.isEmpty(options.accessKeyId)) {
            Garam.logger().error('accessKeyId is required');
            return;
        }
        if (_.isEmpty(options.secretAccessKey)) {
            Garam.logger().error('secretAccessKey is required');
            return;
        }
        if (_.isEmpty(options.region)) {
            Garam.logger().error('region is required');
            return;
        }

        var S3 = new AWS.S3();


        AWS.config.update({accessKeyId: 'akid', secretAccessKey: 'secret'});
        AWS.config.update({region: 'us-west-1'});
    }

});