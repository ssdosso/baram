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
                var self = this;

               var worker = self.getWorker();
                worker.send('workerEventTest','sendToWorkerMessage',1,2,3);
                controller.main(function(){
                    self.end(req,res,{layout:'index',init_js:controller.get('init_js')});
                });



            });



        }
    })

/**
 * 필수   exports, 라우터 네임
 * @type {Function}
 */
exports.MainRouter  = ViewRouter;