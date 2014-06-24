var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Baram = require('../../server/lib/Baram')
    , request = require('request')
    , winston = require('winston')
    , assert= require('assert');

var Router = require('../../server/lib/Router');


var ViewRouter = Router.extend(
    {
        start : function() {
            var controller = Baram.getInstance().getController('main');

            this.get('/', function(req,res){
                this.end({layout:'index',init_js:controller.get('init_js')});
            });

            this.get('/regist',function(req,res){

                this.getController('main').test();
                this.end(200);
            });
            this.get('/gcm-demo',function(req,res){


                this.end(200);

            });

        }
    })

/**
 * 필수   exports, 라우터 네임
 * @type {Function}
 */
exports.MainRouter  = ViewRouter;