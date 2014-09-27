var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Baram = require('./Baram')
  
    , Base = require('./Base')
    , assert= require('assert');

exports = module.exports = RouterFactory;

function RouterFactory (app,webManager) {

    this.app = app;
    this.webManager = webManager;
    this._routers = {};
};

_.extend(RouterFactory.prototype, Base.prototype, {
    addRouter:function (name, router) {
        this._routers[name] = new router();
        this._routers[name].init(this.app,this.webManager);
    },
    addRouters : function(path) {

        //var classes = require(path);
        var self = this;
        if(!fs.existsSync(path)) {
            path = 'server/'+path;
        }

        fs.readdirSync(path).forEach(function (file) {
            var stats = fs.statSync(process.cwd()+'/'+path + '/' + file);
            if (stats.isFile()) {
                var routerClasses = require(process.cwd()+'/'+path + '/' + file);
                var isClassName = false;
                for (var className in routerClasses) {
                    isClassName = true;
                    self.addRouter(className, routerClasses[className]);
                }
                if (!isClassName) {
                   console.error(file + ' module.exports does not exist.');
                }
            }
        });

    }
});