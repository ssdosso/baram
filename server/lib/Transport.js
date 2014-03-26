var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Baram = require('./Baram')
    , AWS = require('aws-sdk')
    , async = require('async')
    , io = require('socket.io')
    , domain = require('domain')
    , redis = require('redis')
    , assert= require('assert');

exports = module.exports = Transport;

function Transport (mgr, name) {
    this.trigger = require('./triggerMethod');

};

_.extend(Transport.prototype, EventEmitter.prototype, {
    create : function(server) {
        var self = this;
        var options = function() {
            return server.options;
        }
        this.server =  io.listen(server);
        this.server.enable('browser client minification');  // send minified client
        this.server.enable('browser client etag');          // apply etag caching logic based on version number
        this.server.enable('browser client gzip');          // gzi
        this.server.configure(function () {
            self.server.enable('browser client etag');


            if (!Baram.getInstance().get('single')) {
                Baram.getInstance().log.info('Redis connect to: '+options().redis.host+':'+options().redis.port);
                var RedisStore = io.RedisStore,opts = { host: options().redis.host, port: options().redis.port };
                self.server.set('store', new RedisStore( { redisPub: opts, redisSub: opts, redisClient: opts } ));
            }


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
           self.connectionEvent();

        });
    },
    connectionEvent : function() {
        var serverDomain = domain.create();
        var self = this;
        serverDomain.on('error', function(err) {
            if (err) {
                Baram.getInstance().log.error(err.stack);
            }
        });
        serverDomain.run(function(){
            self.server.sockets.on('connection', function (socket) {

            });
        });

        Baram.getInstance().trigger("initialize:transport", self.server);
    }
});