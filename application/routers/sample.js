var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , request = require('request')
    , winston = require('winston')
    , assert= require('assert');

var Router = require('../../server/lib/Router');


var MainRouter = Router.extend(
    {
        start : function() {

            this.get('/test', function(req,res){
                this.end({layout:'sample'});
            });
        }
    })

/**
 * 필수   exports, 라우터 네임
 * @type {Function}
 */
exports.subRouter  = MainRouter;