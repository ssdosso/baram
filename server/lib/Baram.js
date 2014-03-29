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
             this._instance = new  Baram.Server();
         }
         return this._instance;
     }
}

    exports = module.exports =  BaramService;



    Baram.Server = function(){
        this.trigger = Baram.triggerMethod;

        this.settings = new Baram.config(new Backbone.Model());
        this.storage = new Baram.Storage;
        this.logger =   new Baram.Logger;
        this.transport = new Baram.Transport;
        this._webServices = {};
        this._webIndex = 0;

        var scope = this;
        this.on('ready',function(){
            scope.logger.init();

            var service = scope.get('service');
//            for (var key in service) {
//                scope.listenService(service[key],key);
//            }
            scope.listenService(service);
        });
    };

     Baram.Server.prototype.__defineGetter__('log', function () {
         var logger = this.logger;

         logger.level =  -1;
         return logger;
     });
     /**
      * async 모듈함수들을 현재의 객체에 extend 함.
      */
    _.extend(Baram.Server.prototype,async);
    _.extend(Baram.Server.prototype, EventEmitter.prototype, {
        create: function(options){
            this.settings.start(options.config,this);
        } ,
        start: function() {

            if (this.get('appDir')) {
                this.ApplicationFactory = new Baram.ApplicationFactory;
                this.ApplicationFactory.create();
                //var app = require(process.cwd()+'/'+this.get('appDir'));
            }



        },
        getWebServer: function() {
            return this._webServices[this._webIndex];
        },
        get: function(name) {
           return this.settings.get(name);
        },
        set: function(name,value) {

            return this.settings.set(name,value);
        },
        configure : function(env,fn) {

            var envs,args= [].slice.call(arguments);
            fn = args.pop();
            if (args.length) envs = args;
            fn.call(this);


            return this;
        },


        listenService : function(service) {


//            if (!info.namespace) assert(0,'환경 변수 값에 namespace 값이 존재 해야 함..');

            this._webServices[this._webIndex] =  new Baram.WebServiceManager();
            this._webServices[this._webIndex] .create(service);
            if (Cluster.isWorker || this.get('single')) {
                this._webServices[this._webIndex].listen(function(server){
                    this.transport.create(server);
                });
            }
        }

    });


  Baram.Logger =  require('./Logger');

  Baram.Storage = require('./Storage');
  Baram.WebServiceManager =  require('./WebServiceManager');
  Baram.config =  require('./configure');
  Baram.triggerMethod = require('./triggerMethod');
  Baram.Transport = require('./Transport');
  Baram.ApplicationFactory = require('./ApplicationFactory');