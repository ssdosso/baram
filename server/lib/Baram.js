/**
 * Singleton Class
 * @type {*}
 */
 var Backbone = require('backbone')
     , _ = require('underscore')
     , EventEmitter = process.EventEmitter
     ,  Cluster = require('cluster')
     , Base = require('./Base')
    , assert = require('assert')
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







    Baram.Server = function() {
        Base.prototype.constructor.apply(this,arguments);

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

            scope.listenService(service);
        });

        this.on('initialize:transport',function(socketServer){

            scope.trigger('startSocket',socketServer);

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

     _.extend(Baram.Server.prototype, Base.prototype, {
        create: function(options){

            this.settings.start(options.config,this);
        } ,

        start: function() {

            if (this.get('appDir')) {
                this.ApplicationFactory = new Baram.ApplicationFactory;
                this.ApplicationFactory.create();
            }

        },
        createAppInstance: function(className,APP) {

            return {
                className : className,
                getInstance : function() {
                    if (this._instance === undefined) {
                        this._instance = new APP();
                    }
                    return this._instance;
                },
                get : function() {
                    assert(this._instance);
                    return this._instance;
                }
            }
        },
        getController: function(controllerName) {
            assert(controllerName)
            return  this.ApplicationFactory.getController(controllerName);
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

         /**
          * web port listen
          * @param service
          */
        listenService : function(service) {

             if (this.get('useDB')) {
                 this.db = new  Baram.Db();
                 this.db.create();
             }




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
  Baram.Db = require('./database/Db');




var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
        child = protoProps.constructor;
    } else {
        child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
};

exports.extend = extend;
