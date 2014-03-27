var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , request = require('request')
    , winston = require('winston')
    , assert= require('assert');

var Router = require('../../server/lib/Router');


/**
 * 필수   exports, 라우터 네임
 * @type {Function}
 */
exports.subRouter  = MainRouter;

function MainRouter () {

};

_.extend(MainRouter.prototype, Router.prototype, {
    start : function() {

        this.get('/test', function(req,res){
            this.end({layout:'index'});
        });
    }
});