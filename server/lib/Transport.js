var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Baram = require('./Baram')

    , Base = require('./Base')
    , AWS = require('aws-sdk')
    , async = require('async')
    , io = require('socket.io')
    , domain = require('domain')
    , redis = require('redis')
    , assert= require('assert');

exports = module.exports = Transport;

function Transport (mgr, name) {
    Base.prototype.constructor.apply(this,arguments);

};

_.extend(Transport.prototype, Base.prototype, {
    create : function(server) {
        var self = this;
        var options = function() {
            return server.options;
        }
        //0.9.16

        this._socketServer =  io.listen(server);

        if (!Baram.getInstance().get('single')) {
            Baram.getInstance().log.info('Redis connect to: '+options().redis.host+':'+options().redis.port);
            var RedisStore = io.RedisStore,opts = { host: options().redis.host, port: options().redis.port };
            self._socketServer.set('store', new RedisStore( { redisPub: opts, redisSub: opts, redisClient: opts } ));
        }

        if (server.options.transportOptions != null ) {
                for (var opt in server.options.transportOptions) {
                    self._socketServer.set(opt, server.options.transportOptions[opt]);
                }
         }
        this.connectionEvent();
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

        });

        Baram.getInstance().trigger("initialize:transport", self._socketServer);
    }
});