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



    Baram.Application = function(){
        this.trigger = Baram.triggerMethod;

        this.settings = new Baram.config(new Backbone.Model());
        this.storage = new Baram.Storage;
        this.logger =   new Baram.Logger;
        this.transport = new Baram.Transport;
        this.webServices = {};

        var scope = this;
        this.on('ready',function(){
            scope.logger.init();

            var service = scope.get('service');
            for (var key in service) {
                scope.listenService(service[key],key);
            }
        })
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
        create: function(options){
            this.settings.start(options.config,this);
        } ,
        start: function() {
            console.log(this.get('appDir'))
            if (this.get('appDir')) {

                var app = require(process.cwd()+'/'+this.get('appDir'));
            }
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


        listenService : function(info,index) {


            if (!info.namespace) assert(0,'환경 변수 값에 namespace 값이 존재 해야 함..');

            this.webServices[info.namespace] =  new Baram.WebServiceManager();
            this.webServices[info.namespace].create(info);
            if (Cluster.isWorker || this.get('single')) {
                this.webServices[info.namespace].listen(function(server){
                    this.transport.create(server);
                });
            }
        },

    });


  Baram.Logger =  require('./Logger');
  Baram.Storage = require('./Storage');
  Baram.WebServiceManager =  require('./WebServiceManager');
  Baram.config =  require('./configure');
  Baram.triggerMethod = require('./triggerMethod');
  Baram.Transport = require('./Transport');