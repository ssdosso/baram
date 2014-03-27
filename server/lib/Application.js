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
    create : function() {
        this._controllers = {};
        this.appDir = Baram.getInstance().get('appDir');
        this.addControllers();
    },
    addController: function(name, controller) {
         //   this._controllers[name] = controller.getInstance();
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
               var Classes = require(process.cwd()+'/'+ self.appDir + '/controllers/'+ file);
               var isClassName = false;
               for (var className in Classes) {
                   isClassName = true;
                  // self.addController(className, Classes[className]);
               }
           }
        });

    }
});