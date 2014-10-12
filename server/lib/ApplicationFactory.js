var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Baram = require('./Baram')
    , winston = require('winston')
    , assert= require('assert');

exports = module.exports = Application;

function Application() {

    this.trigger = require('./triggerMethod');

};


_.extend(Application.prototype, EventEmitter.prototype, {
    create : function(type) {
        this.type = type ? type : 'all';
        this._controllers = {};
        this.appDir = Baram.getInstance().get('appDir');
        this.addControllers();
    },
    getControllers : function() {
        return this._controllers;
    },
    /**
     * 외부에서 applicaction 컨트롤러를 리턴
     * @param className
     * @returns {*}
     */
    getController : function(className) {
        return this._controllers[className];
    },
    addController: function(application) {
        var controller = application.app;

        this._controllers[application.className] = new controller;
        this._controllers[application.className].create();

    },
    addControllers: function() {
        var self = this;
        if(!fs.existsSync(this.appDir + '/controllers')) {
           Baram.getInstance().log.error('not find appDir');
            return;
        }
        fs.readdirSync(process.cwd()+'/'+ this.appDir + '/controllers').forEach(function (file) {

           var stats = fs.statSync(process.cwd()+'/'+ self.appDir + '/controllers/'+ file);
           if (stats.isFile()) {
               var singletonController = require(process.cwd()+'/'+ self.appDir + '/controllers/'+ file);
               assert(singletonController.className);
               if(!singletonController.className) {
                   Baram.getInstance().log.error('not find className');
                   return;
               }
                  self.addController(singletonController);

           }
        });

    }
});