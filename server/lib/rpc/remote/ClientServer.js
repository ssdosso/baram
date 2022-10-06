var _ = require('underscore')
    , fs = require('fs')
    , Garam = require('../../Garam')
    , Base = require('../../Base')
    , async = require('async')
    , JsonParse = require('../JsonParse')
    , Net = require('net' )
    , domain = require('domain')
//, HostServer = require('./server')
    , assert= require('assert');
let packetMessage = {"heartbeat timeout" : 140,"heartbeat interval":120};
exports = module.exports = Server;

function Server () {
    JsonParse.prototype.constructor.apply(this,arguments);
    this.options = {};
    this._client = false;
    this.disconnected = false;

    this.listenPort = [];
    this.remoteIP = '';
    this.setOpcodeHandlers();
    this.id = this.generateId();


}

_.extend(Server.prototype, JsonParse.prototype, {
    startConnect : function(options,callback) {
        var self = this;
        this._client = true;

        for (var i in options) {
            this.options[i] = options[i];
        }

        var serverDomain = domain.create();
        serverDomain.on('error', function(err) {
            if (err) {
                Garam.getInstance().log.error(err.stack);


            }
        });

        serverDomain.run(function() {
            assert(self.options.ip);

            self.socket =  Net.connect(self.options.port,self.options.ip);
            self.socket.on('connect',function(){
                Garam.logger().info('connect to server '+self.options.ip+':'+self.options.port);
                //self._decodeBreak = false;

                self._connectError = false;
                self.setHandlers();
                // self._onHeartbeatClear();
                self.onConnectEvent();
                self.disconnected = false;
                // self._setHeartbeatInterval();
                self.reconnectMaxCount = 20; //접속이 끊키면 최대 20 번까지 재 접속 시도를 한다.
                Garam.getInstance().getServerIP(function () {
                    self.remoteIP = Garam.get('serverIP');

                    Garam.logger().info('#server ip',self.remoteIP)
                    self.serverType = Garam.getInstance().get('serverType') ? Garam.getInstance().get('serverType') :assert(0);
                    self.serverName = self.remoteIP +':'+self.serverType;

                    self.portlist = Garam.getInstance().get('portlist') ? Garam.getInstance().get('portlist') : [];

                    if (typeof callback !== 'undefined') {
                        callback(self);
                    }

                    if(self.options.scope) {
                        self.options.scope.emit('onServerConnect',self);
                    } else {
                        Garam.getInstance().transport.emit('onServerConnect',self);
                    }
                });
            });
            self.socket.removeAllListeners('close');
            self.socket.on('close',function(){
                self.disconnected = true;
                self.socket.emit('serverClose')
                //서버 접속 종료를 탐지 했을때의 처리
                if (typeof self.socket !== 'undefined') {

                    Garam.logger().warn('disconnected to',self.options.hostname);
                    self._clearHeartbeatTimeout();
                    self.socket.end();
                }
            });
            self.removeAllListeners('message');
            self.on('message',function(data){

                self.onMessage(data);
            });

        });

        //self.on('message',function(data){
        //
        //    self.send({a:22})
        //});


    },
    generateId : function() {
        return Math.abs(Math.random() * Math.random() * Date.now() | 0).toString()
            + Math.abs(Math.random() * Math.random() * Date.now() | 0).toString();
    },
    getHostname : function () {
        return this.options.hostname;
    },
    getHostIP : function () {
        return this.options.ip;
    },
    getHostPort : function () {
        return this.options.port;
    },
    reconnectToServer : function() {
        this.socket.removeAllListeners('connect');
        this.socket.removeAllListeners('close');
        this.socket.removeAllListeners('message');
        this.socket =  Net.connect(this.options.port,this.options.ip);
    },
    connectError : function() {
        this._connectError = true;
    },

    _onHeartbeatClear: function() {
        Garam.logger().info('clear heartbeat client');
        this._clearHeartbeatTimeout(); //타이머를 제거한다.
        this._setHeartbeatInterval();
    },
    /**
     * heartbeat 를 생성한다
     * @private
     */
    _setHeartbeatInterval: function() {



        this._heartbeat();

    },
    _clearHeartbeatTimeout: function() {
        if (this._heartbeatTimeout) {

            clearTimeout(this._heartbeatTimeout);
            this._heartbeatTimeout = null;
            //  Garam.logger().info('cleared heartbeat timeout for client');
        }

        if (this._heartbeatInterval) {

            clearTimeout(this._heartbeatInterval);

            this._heartbeatInterval = null;
            // Garam.logger().info('cleared heartbeat timeout for client');
        }
    },
    /**
     * 지정된 시간안에 heartbeat 메세지가 도착하지 않으면 에러 처리
     * @private
     */
    _setHeartbeatTimeout: function() {

        let heartbeatTimeout = Garam.get('heartbeat').heartbeatTimeout;
        if (!this._heartbeatTimeout) {

            var self = this;

            this._heartbeatTimeout = setTimeout(function () {
                Garam.logger().info('fired heartbeat timeout for client');
                self._heartbeatTimeout = null;
                self.end('fired heartbeat timeout for client, disconnected to',self.options.hostname);



            }, heartbeatTimeout * 1000);

            //sv.logger.info('set heartbeat timeout for client', this.getServerName());
        }
    },
    getServerName : function () {

    },
    _heartbeat: function(){
        if (!this.disconnected) {

            this.send({ pid: 'heartbeat' });
            this._setHeartbeatTimeout();
        }

        return this;
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
        // if (packet.name ==='heartbeat') {
        //     this._onHeartbeatClear();
        //     return;
        // }

        var params = [packet.name].concat(packet.args);

        if (Garam.get('ispacket')) {

            Garam.logger().packet('response  ' +JSON.stringify(params));
        }
        this.emit.apply(this,params);
    },
    addPort : function(openPort) {
        this.listenPort = openPort;
        this.send({pid:'listenPort',openPort:this.listenPort});
    },

    // reconnect : function() {
    //     var self = this;
    //     setTimeout(function(){
    //         self.connect();
    //     },1000);
    // },


    end: function (reason,callback) {
        var self = this;

        if (!this.disconnected) {
            // this.close(reason,callback);
            this.disconnected = true;
            this.socket.destroy();
            this.doClose();
        }
    },
    /**
     *
     * @param reason
     * @param callback
     */
    close: function (reason,callback) {
        if (!this.disconnected) {

            this.doClose(callback);
            this.onClose(reason);
        }
    },
    /**
     * 실제 소켓은 끊어 졌찌만 이벤트가 왔을때
     * @param reason
     */
    onClose: function(reason) {
        if (!this.disconnected) {
            this.disconnected = true;
            this.emit('disconnect',reason);
        }
    },
    doClose: function(callback){
        if (typeof this.socket !== 'undefined') {
            this.socket.end();
        }
        if (typeof callback === 'function') {
            callback();
        }
    }




});




var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
        child = protoProps.constructor;
    } else {
        child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
};

Server.extend = extend;