var EventEmitter = require('events').EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Garam = require('../../Garam')
    , Base = require('../../Base')
    , async = require('async')

    , Net = require('net' )
    , domain = require('domain')
    , User = require('../remote/User')
    , assert= require('assert');

exports = module.exports = Server;

function Server (options) {
    Base.prototype.constructor.apply(this,arguments);
    this.options = options;
    this._Users = {};
    this.open = {};
    this.readyState =false;

}

_.extend(Server.prototype, Base.prototype, {
    create : function(server) {


    },
    isReadyState : function () {
        return this.readyState;
    },
    listen : function(callback) {
        let self = this;
        let controllers =  Garam.getControllers();
        this._server = Net.createServer();
        this._server.listen(this.options.port,function(){
            console.log(' Tcp Client listening on port '+self.options.port);
            self.readyState = true;
            callback();
        });

        self._server.on('connection',function(socket) {
            var id = self.generateId();

            // self._setHandlers();
            socket.setNoDelay(true);

            self.open[id] = true;
            self._Users[id] = new User(id,self);
            self._Users[id].init(socket);
           // self.emit('connection',self._Users[id]);

            for (let i in controllers) {
                  controllers[i].emit('userConnectionTcp',self._Users[id]);
            }

            //self.emit.call(self._client[id],'connection',socket);

        });
    },
    getSever : function() {
        return this._server;
    },
    generateId : function() {
        return Math.abs(Math.random() * Math.random() * Date.now() | 0).toString()
            + Math.abs(Math.random() * Math.random() * Date.now() | 0).toString();
    },



});