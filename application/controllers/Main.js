
var App = {},Baram = require('../../server/lib/Baram');
var Backbone = require('backbone')
    , _ = require('underscore')
    , EventEmitter = process.EventEmitter
    ,  Cluster = require('cluster')
    , async = require('async');

var MainController =  {
    className: 'main',
    getInstance : function() {
        if (this._instance === undefined) {
            this._instance = new App.Controller();
        }
        return this._instance;
    }
}
 module.exports = MainController;


App.Controller = function(){
    Baram.getInstance().log.info('MainController Start');


}


_.extend(App.Controller.prototype,async);
_.extend(App.Controller.prototype, EventEmitter.prototype, {
    create : function() {
       var webServer = Baram.getInstance().getWebServer();
        webServer.addConfigure(
            function(app) {
                app.configure(function () {

                });
            }
        );
        webServer.addRouters('application/routers');
    }
});