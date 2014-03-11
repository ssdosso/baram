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

        var classes = require(path);
        for (var m in classes) {

            if (undefined === classes[m]) continue;
            this.addRouter(m, classes[m]);
        }

    }
});