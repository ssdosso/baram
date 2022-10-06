var _ = require('underscore')
    , fs = require('fs')
    , Garam = require('../../Garam')
    , Base = require('../../Base')
    , async = require('async')
    , JsonClientParse = require('../JsonClientParse')
    , Net = require('net' )
    , domain = require('domain')
    , assert= require('assert');

let packetMessage = {"heartbeat timeout" : 60,"heartbeat interval":30};
exports = module.exports = Client;

function Client (options) {
    JsonClientParse.prototype.constructor.apply(this,arguments);
    this.options = options;

    this.disconnected = false;
    this.open = false;
}

_.extend(Client.prototype, JsonClientParse.prototype, {
    init : function(socket) {


        this.open = true;
        this.socket = socket;
        this.setHandlers();
        this.onConnectEvent();
        this.setOpcodeHandlers();

        this.startHeartbeatEvent();
        this.handshake ={};

        this.id = this.generateId();
       // self.removeAllListeners('message');
        this.handshake.address = socket.remoteAddress;
        // self.on('message',function(data){
        //
        //     self.onMessage(data);
        // });
        // this.socket.on('close',function(){
        //
        // });
    },
    startHeartbeatEvent : function() {
        console.log('startHeartbeatEvent !!!')
        this._onHeartbeatClear();
    },
    generateId : function() {
        return Math.abs(Math.random() * Math.random() * Date.now() | 0).toString()
            + Math.abs(Math.random() * Math.random() * Date.now() | 0).toString();
    },
    _onHeartbeatClear: function() {
        // Garam.logger().info('clear heartbeat client');
        this._clearHeartbeatTimeout(); //타이머를 제거한다.
        this._setHeartbeatInterval();
    },
    _clearHeartbeatTimeout: function() {
        if (this._heartbeatTimeout) {

            clearTimeout(this._heartbeatTimeout);
            this._heartbeatTimeout = null;
             Garam.logger().info('cleared heartbeat timeout for client');
        }

        if (this._heartbeatInterval) {

            clearTimeout(this._heartbeatInterval);

            this._heartbeatInterval = null;
             Garam.logger().info('cleared heartbeat timeout for client');
        }
    },
    _heartbeat: function(){
        if (!this.disconnected) {

            this.send({ pid: 'heartbeat' });

            this._setHeartbeatTimeout();
        }

        return this;
    },
    _setHeartbeatTimeout: function() {
        if (!this._heartbeatTimeout) {
            var self = this;

            this._heartbeatTimeout = setTimeout(function () {

                Garam.logger().info('fired heartbeat timeout for client');
                self._heartbeatTimeout = null;
                self.end('fired heartbeat timeout for client, disconnected to',self.options.hostname);



            }, packetMessage["heartbeat timeout"] * 1000);

            //sv.logger.info('set heartbeat timeout for client', this.getServerName());
        }
    },
    _setHeartbeatInterval: function() {
        if (!this._heartbeatInterval) {
            var self = this;

            this._heartbeatInterval = setTimeout(function () {
                self._heartbeat();
                self._heartbeatInterval = null;
            },packetMessage["heartbeat interval"] * 1000);
            // Garam.logger().info('set heartbeat interval for dc', this.options.hostname,this.options.port);
        }
    },
    address : function () {
      return this.socket.remoteAddress;
    },
    setServerName : function(servername) {

        this._serverName = servername;
    },
    getServerName : function(servername) {
        return this._serverName;
    },
    disconnect : function () {
        this.open = false;

        if (this.socket.destroyed ===false) {
            this.socket.destroy();
        }


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

        Garam.logger().packet('response  ' +JSON.stringify(params));
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
        if (this.open !== false) {

            this.doClose();
            this.onClose(reason);

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