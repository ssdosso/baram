var _ = require('underscore')
    , fs = require('fs')
    , Garam = require('../../Garam')
    , Base = require('../../Base')
    , async = require('async')
    , JsonParse = require('../JsonParse')
    , Net = require('net' )
    , domain = require('domain')
    , assert= require('assert');

exports = module.exports = Client;

function Client (options) {
    JsonParse.prototype.constructor.apply(this,arguments);
    this.options = options;

    this.disconnected = false;
    this.open = false;
}

_.extend(Client.prototype, JsonParse.prototype, {
    init : function(socket) {

        var self = this;
        self.open = true;
        self.socket = socket;
        self.setHandlers();
        self.onConnectEvent();
        self.setOpcodeHandlers();

        self.removeAllListeners('message');
        self.on('message',function(data){

            self.onMessage(data);
        });
        this.socket.on('close',function(){

        });
    },
    setServerName : function(servername) {

        this._serverName = servername;
    },
    getServerName : function(servername) {
        return this._serverName;
    },
    onMessage: function(data) {


        var pid = data.pid;
        delete data.pid;
        function toArrayByArg(enu) {
            var arr = [];
            for (var i in enu )
                arr.push(enu[i]);

            return arr;
        }
        var args = toArrayByArg(data);

        var packet = {
            name : pid,
            args:args
        }

        var params = [packet.name].concat(packet.args);
        if (Garam.get('ispacket')) {

            Garam.logger().packet('response  ' +JSON.stringify(params));
        }
        this.emit.apply(this,params);
    },
    onSocketEnd: function() {

        this.end('socket end');
    },
    onSocketClose: function(error) {
        this.end(error ? 'socket error' : 'socket close');
    },
    onSocketError: function(err) {

        if (this.open) {
            this.socket.destroy();
            this.onClose();
        }

        Garam.logger().error('socket error '  + err.stack);
        // this.reconnectreconnect();
    },


    /**
     * Cleans up the connection, considers the client disconnected.
     *
     * @api private
     */

    end: function (reason) {
        var self = this;

        if (!this.disconnected) {


            this.close(reason);

            this.disconnected = true;



        }
    },
    close: function (reason) {
        if (this.open) {

            this.doClose();
            this.onClose(reason);
            this.emit('disconnect');
        }
    },
    onClose: function(reason) {

        if (this.open) {

            // this.setCloseTimeout();
            //   this.clearHandlers();
            this.open = false;

            this.emit('disconnect',reason);
            //    this.store.publish('close', this.id);
        }
    },
    doClose: function(){
        this.socket.end();
    }








});