var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Baram = require('../../server/lib/Baram')


    , AWS = require('aws-sdk')
    , async = require('async')

    , assert= require('assert');

exports = module.exports = S3storage;

function S3storage (mgr, name) {



};



_.extend(S3storage.prototype, EventEmitter.prototype, {
    create : function(config) {

        var s3 = new AWS.S3();
        AWS.config.loadFromPath('./application/config/s3.json');

    } ,
    addBucket: function(targetBucket) {
        return new BlueBucket({Bucket:targetBucket});
    },
    put : function(file,next){
        var s3bucket = new AWS.S3({Bucket:'Baram-test-00'});
        var self = this;

        fs.readFile(file.path, function (err, data) {
            if (err) throw err;
            var params = {Bucket:'Baram-test-00',Body: data,Key:file.name};
            s3bucket.putObject(params, function() {
                next();
            })
        });
    } ,
    get : function() {
        s3bucket.getObject({Bucket:'Baram-test-00',Key:file.name}).
            on('httpData', function(chunk) {
                wfile.write(chunk);
            }).
            on('httpDone', function() {
                wfile.end();
            }).
            send();

    }
});




var BlueBucket = function(optoins) {
    this.bucket = optoins.Bucket;

    this.s3 =  new AWS.S3({Bucket:this.bucket});
}

_.extend(BlueBucket.prototype,  {
    getProfile: function() {
        var self = this;
        var param = {
            view_uid : req.session.uid,
            uid :  req.session.uid,
            session_id : req.session.session_id
        }

        this.request('post','profile/view',param,function(response,data){
            _.extend(data,data.profile);
            self.renderToJson(res,data);
        })
    },
    create : function(file,callback) {
        var self = this;

        fs.readFile(file.path, function(err, data) {
            if (err) throw err;
            var params = {Bucket:self.bucket,Body: data,Key:file.username+'.jpg'};
            self.s3.putObject(params, function() {

                callback();
            })
        });


    },
    put : function(fileinfo,next){
        var self = this;
        var file = fileinfo.file;
        var extension = file.name.split('.')[1];


        fs.readFile(file.path, function(err, data) {
            if (err) throw err;
            var params = {Bucket:self.bucket,Body: data,Key:fileinfo.username+'.'+ extension};
            self.s3.putObject(params, function() {

                next();
            })
        });



    } ,
    get : function(file,callback) {

        var params = {Bucket:this.bucket,Key:file.name};
        var buffer ;

        this.s3.client.getObject(params, function(err, data)
        {


            if (data === null) {
                callback(data);
            }
            if(err == null)
            {

                var buff = new Buffer(data.Body, "binary"); //i've tried everything.
                callback(buff);

            }

        });


    }
});