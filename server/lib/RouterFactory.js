var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , winston = require('winston')
    , assert= require('assert');

exports = module.exports = RouterFactory;

function RouterFactory (app) {

    this.app = app;
    this._routers = {};
};

_.extend(RouterFactory.prototype, EventEmitter.prototype, {
    addRouter:function (name, router) {
        this._routers[name] = new router();
        this._routers[name].init(this.app);
    },
    addRouters : function(path) {

        //var classes = require(path);
        var self = this;
        if(!fs.existsSync(path)) {
            path = 'server/'+path;
        }
        console.log( fs.readdirSync(path));
       // console.log(process.cwd());
//        require(process.cwd()+'/'+path + '/about');
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