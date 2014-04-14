
var App = {}
    ,Baram = require('../../server/lib/Baram')
    , Express = require('express')
    ,Application = require('../../server/lib/Application');

var Backbone = require('backbone')
    , _ = require('underscore');

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


 App.Controller = Application.extend({
        create : function() {

            var webServer = Baram.getInstance().getWebServer();
            webServer.addConfigure(
                function(app) {
                    app.configure(function () {

                        app.use(Express.static(process.cwd() + '/application/public', { maxAge: 31557600000 }));
                        app.set('views', process.cwd() + '/application/views');
                    });
                }
            );
            webServer.addRouters('application/routers');
        }
})
