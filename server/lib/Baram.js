/**
 * Singleton Class
 * @type {*}
 */
 var Backbone = require('backbone')
     , _ = require('underscore')
     , EventEmitter = process.EventEmitter
     ,  Cluster = require('cluster')
     , async = require('async');

 var Baram = {};

 /**
  * singleton Object
  * @type {{getInstance: Function}}
  */
var BaramService  = {
     getInstance: function () {
         if (this._instance === undefined) {
             this._instance = new  Baram.Application();
         }
         return this._instance;
     }
}

    exports = module.exports =  BaramService;



    Baram.Application = function(options){
        this.trigger = Baram.triggerMethod;
        this.config = new Baram.config;
        this.storage = new Baram.Storage;
        this.logger =   new Baram.Logger;
        this.webServices = {};
    };

     Baram.Application.prototype.__defineGetter__('log', function () {
         var logger = this.logger;

         logger.level =  -1;
         return logger;
     });
     /**
      * async 모듈함수들을 현재의 객체에 extend 함.
      */
    _.extend(Baram.Application.prototype,async);
    _.extend(Baram.Application.prototype, EventEmitter.prototype, {
        start: function(options){
             var fs = require('fs');
             var path = './async.txt';

            var scope = this;
            this.trigger("initialize:before", options);
            this.trigger("initialize:after", options);

            this.config.start(options.config,this);

            this.on('ready',function(){
               for (var key in scope.config.service) {
                   scope.listenService(scope.config.service[key],key);
               }
            })
        } ,
        get: function(name) {
           return this.config[name] ? this.config[name] : this.config

        },
        set : function(name,value) {
            this.config[name] = value;
        },
        setTest: function(val){
             this.test = val;
        },
        listenService : function(listenInfo,index) {

            if (index ==0 && this.config.port) {
                listenInfo.port =  this.config.port;
            }
            if (!listenInfo.namespace) assert(0,'환경 변수 값에 namespace 값이 존재 해야 함..');

            this.webServices[listenInfo.namespace] =  new Baram.WebServiceManager();
            this.webServices[listenInfo.namespace].create(listenInfo);
            if (Cluster.isWorker || this.config.debug) this.webServices[listenInfo.namespace].listen();
        }
    });


  Baram.Logger =  require('./Logger');
  Baram.Storage = require('./Storage');
  Baram.WebServiceManager =  require('./WebServiceManager');
  Baram.config =  require('./configure');
  Baram.triggerMethod = require('./triggerMethod');
  Baram.Transport = require('./Transport');