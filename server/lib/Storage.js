var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Baram = require('./Baram')
    , AWS = require('aws-sdk')
    , async = require('async')
    , assert= require('assert');

exports = module.exports = S3storage;

function S3storage (mgr, name) {
    this.trigger = require('./triggerMethod');

};

var BlueBucket = function(optoins) {
       this.bucket = optoins.Bucket;

       this.s3 =  new AWS.S3({Bucket:this.bucket});
}
_.extend(BlueBucket.prototype,async);
_.extend(BlueBucket.prototype, EventEmitter.prototype, {
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
        console.log(params)
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
//                var fd = fs.openSync("some_local_binary_file", "w");
//                fs.writeSync(fd, buff, 0, buff.length,0);
            }

        });
//       this.s3.getObject(params).
//            on('httpData', function(chunk) {
//               console.log(chunk)
//            }).
//            on('httpDone', function() {
//                //console.log(buffer)
//            }).
//            send();


    }
});


_.extend(S3storage.prototype, EventEmitter.prototype, {
      create : function() {
//          var config= Baram.getInstance().config.s3;
         // var s3 = new AWS.S3();
         // AWS.config.loadFromPath('./server/conf/s3.json');

      } ,
      addBucket: function(targetBucket) {
            return new BlueBucket({Bucket:targetBucket});
      },
//      put : function(file,next){
//          var s3bucket = new AWS.S3({Bucket:'Baram-test-00'});
//          var self = this;
//
//         fs.readFile(file.path, function (err, data) {
//              if (err) throw err;
//              var params = {Bucket:'Baram-test-00',Body: data,Key:file.name};
//              s3bucket.putObject(params, function() {
//                  next();
//              })
//          });
//      } ,
//      get : function() {
//          s3bucket.getObject({Bucket:'Baram-test-00',Key:file.name}).
//                      on('httpData', function(chunk) {
//                          wfile.write(chunk);
//                      }).
//                      on('httpDone', function() {
//                          wfile.end();
//                      }).
//                      send();
//
//      }
});