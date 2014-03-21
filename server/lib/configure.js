 var EventEmitter = process.EventEmitter
     ,_ = require('underscore')
     , Optparse = require('./optparse')
     , fs = require('fs')
     , Baram = require('./Baram')
     , assert= require('assert');

 exports =  module.exports  = BlueConfigure;
 function BlueConfigure(settingModel) {
        this.settingModel = settingModel;
 }

 _.extend(BlueConfigure.prototype, EventEmitter.prototype, {
         start : function(options) {
             var scope = this;
             this.jsonReadSettings( 'conf', function () {
                 this.merge(options);
                 Baram.getInstance().trigger('ready');
             });


         },
     get: function(key) {
        return this.settingModel.get(key);
     },
     set: function(key,val) {
         return this.settingModel.set(key,val);
     },
     /**
      * 외부 command 옵션을 읽어 들인다.
      * @param options
      */
     merge :function(options) {
         var scope = this;


         options =  Optparse.parse(options, true);
         for (var key in options) {
             if (key.length < 2) {
                 delete options[key]
             }
         }

         for (var key in options) {
             switch(key) {
                 case 'port':

                     var service = this.settingModel.get('service');

                     for(var i =0; i < service.length; i ++) {
                         if(service[i].default) {
                             service[i].port = options[key];
                         } else {
                             continue;
                         }
                     }
                     break;
                 default :
                     this.settingModel.set(key,options[key]);
                     break;
             }
         }




     },
     jsonFileRead:function (root, callback) {
         this.setSettings(root, 'root', false, function () {
             callback();
         });
     },
     jsonReadSettings : function() {
         var args = [].slice.call(arguments);
         var fn = args.pop();
         var total = args.length,len=0;
         _.each(args,function(confDir){
             var path = __dirname +'/../'+confDir;
             var jsonFiles = fs.readdirSync(path);
             var subTotal = jsonFiles.length,subLen=0;
            _.each(jsonFiles,function(jsonfile) {
                var extension = jsonfile.split('.')[1];
                if (extension === 'json') {
                    var targetFile = path + '/' + jsonfile;
                    var setting = JSON.parse(fs.readFileSync(targetFile));

                    for (var key in setting ) {
                        this.settingModel.set(key,setting[key]);
                    }
                }
                subLen++;
                if (subLen ===subTotal) {
                    len++;
                    if (len === total) {

                    fn.call(this);
                    }
                }
            },this);


         },this);
     }
 });