var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Baram = require('./Baram')
    , AWS = require('aws-sdk')
    , async = require('async')
    , io = require('socket.io')
    , domain = require('domain')
    , assert= require('assert');

exports = module.exports = Transport;

function Transport (mgr, name) {
    this.trigger = require('./triggerMethod');

};

_.extend(Transport.prototype, EventEmitter.prototype, {
    create : function(server) {
        var self = this;

        this.server =  io.listen(server);
        this.server.enable('browser client minification');  // send minified client
        this.server.enable('browser client etag');          // apply etag caching logic based on version number
        this.server.enable('browser client gzip');          // gzi
        this.server.configure(function () {
            self.server.enable('browser client etag');

            if (server.options.transportOptions != null ) {
                for (var opt in server.options.transportOptions) {
                    self.server.set(opt, server.options.transportOptions[opt]);
                }
            }
//
//            var transportsOpt = null;
//
//            if (options.transport && options.transport.length > 0) {
//                transportsOpt = options.transport;
//            } else {
//                transportsOpt = ['websocket', 'xhr-polling', 'htmlfile', 'jsonp-polling'];
//
//            }
//
//            console.log('Transports:', transportsOpt);
//
           // socketServer.set('transports', transportsOpt);
           self.events();

        });
    },
    events : function() {
        var serverDomain = domain.create();
        var self = this;
        serverDomain.on('error', function(err) {
            console.log("Server Domain Error: " + err);
        });
        serverDomain.run(function(){
            self.server.sockets.on('connection', function (socket) {

            });
        });

        Baram.getInstance().trigger("initialize:transport", self.server);
    }
});