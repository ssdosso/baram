var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , request = require('request')
    , winston = require('winston')
    , assert= require('assert');

var Router = require('../lib/Router');


/**
 * 필수   exports, 라우터 네임
 * @type {Function}
 */
exports.AboutRouter  = AboutRouter;

function AboutRouter () {
    this.routerName = 'About';
};

_.extend(AboutRouter.prototype, Router.prototype, {
    start : function() {
        var app = this.app,scope=this;
        app.get('/about', function(req,res){
            scope.render(res,'index');
        });
    }
});