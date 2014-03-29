
var App = {}
    ,Baram = require('../../server/lib/Baram')
    ,Application = require('../../server/lib/Application');
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
    Application.prototype.constructor.apply(this,arguments);

}



Baram.extend(App.Controller.prototype, Application.prototype, {
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