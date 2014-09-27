
var
    Baram = require('../../server/lib/Baram')
    ,Express = require('express')
    ,Application = require('../../server/lib/Application');

var Backbone = require('backbone')
    , _ = require('underscore');




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
            /*
                socket 이벤트
             */
            Baram.getInstance().on('startSocket',function(socketServer){
                socketServer.sockets.on('connection', function (socket) {
                   // console.log(socket)
                });
            });
        },
        main: function(callback) {


            callback();
        }


});

module.exports = Baram.getInstance().createAppInstance('main',App);
