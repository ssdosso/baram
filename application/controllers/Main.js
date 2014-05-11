
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
            this.settings = new Backbone.Model();
            webServer.addRouters('application/routers');
            /**
             * 클라이언트에서 사용하게될 기본 스크립트
             */
            this.set('init_js',{
                "dev-js": { "data-main": "/js/app/config/config.js", "src": "/js/libs/require.js" },
                "init": "/js/app/DesktopInit.js"
            });


        },
        get : function(name) {
            return this.settings.get(name);
        },
        set : function(name,val) {
            this.settings.set(name,val)
        }
})
