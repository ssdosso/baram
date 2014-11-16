
var
    Baram = require('../../server/lib/Baram')
    ,Express = require('express')
    ,Application = require('../../server/lib/Application');

var Backbone = require('backbone')
    , _ = require('underscore');




var App = Application.extend({
    type :'web',
    create : function() {

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

exports.app  =App;
exports.className  = 'test';
