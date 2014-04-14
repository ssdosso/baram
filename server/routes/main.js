var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , request = require('request')
    , winston = require('winston')
    , Baram = require('../lib/Baram')
    , assert= require('assert');

var Router = require('../lib/Router');


/**
 * 필수   exports, 라우터 네임
 * @type {Function}
 */
exports.MainRouter  = MainRouter;

function MainRouter () {

    this.base();

};

_.extend(MainRouter.prototype, Router.prototype, {

    start : function() {

        this.get('/', function(req,res){
           this.end({layout:'index'});
        });
    }
});