
var
    Baram = require('../../server/lib/Baram')
    , Express = require('express')
    , gcm = require('node-gcm')
    ,Application = require('../../server/lib/Application');

var Backbone = require('backbone')
    , _ = require('underscore');


//var MainController = Baram.getInstance().createAppInstance('main');



var App = Application.extend({
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

            /*
                socket 이벤트
             */
            Baram.getInstance().on('startSocket',function(socketServer){
                socketServer.sockets.on('connection', function (socket) {
                   // console.log(socket)
                });
            });
        },
        get : function(name) {
            return this.settings.get(name);
        },
        set : function(name,val) {
            this.settings.set(name,val)
        },
        test : function() {
            console.log('call Main method');
        }
});

module.exports = Baram.getInstance().createAppInstance('main',App);
