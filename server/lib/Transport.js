var _ = require('underscore')
    , fs = require('fs')
    , Garam = require('./Garam')

    , Base = require('./Base')
    , HostServer = require('./rpc/host/HostServer')
    , TcpClientServer = require('./rpc/host/TcpClientServer') //user  와의  접속
    , ClientServer = require('./rpc/remote/ClientServer')
    , async = require('async')
    , io = require('socket.io')
    , domain = require('domain')
    , adapter = require('socket.io-redis')
    , assert= require('assert');

exports = module.exports = Transport;

function Transport (mgr, name) {
    Base.prototype.constructor.apply(this,arguments);
    this.openPort = [];
    this._hostServer = {};
    this._remoteServer = {};
    this.dcServerCheckInterval = {};
    this._tcpServer = null;
}

_.extend(Transport.prototype, Base.prototype, {
    addTcpSocket : async function (server) {
        return new Promise((resolve, reject)=>{
            if (!Garam.getInstance().get('service')) {
                return;
            }
            let self = this,port;
            if (!Garam.get('tcpPort')) {
                let defaultPort=Garam.get('portInfo').tcpPort,port = defaultPort + Garam.getWorkerID();
            } else {
                port = Garam.get('tcpPort');
            }


            this._tcpServer = new TcpClientServer({port:port});

            this._tcpServer.listen(function(){
                //   console.log(options.hostname);
               console.log('tcp litesn')
                resolve();
            });
        });

    },
    createTcpSocket : function (server,callback) {
        if (!Garam.getInstance().get('service')) {
            return;
        }


        let self = this,port;
        let options = function() {
            return server.options;
        }


        if (!Garam.get('tcpPort')) {
            let defaultPort=Garam.get('portInfo').tcpPort,port = defaultPort + Garam.getWorkerID();
        } else {
            port = Garam.get('tcpPort');
        }

        Garam.logger().info('set tcp socket',port)
        this._tcpServer = new TcpClientServer({port:port});


        Garam.set('port',port);




        this._tcpServer.listen(function(){
            //   console.log(options.hostname);
            let controllers =  Garam.getControllers();


            callback();

        });


    },
    createWebSocket : function(server,callback) {
        var self = this;

        if (!Garam.getInstance().get('service')) {
            return;
        }

        var self = this;
        var options = function() {
            return server.options;
        }


        this._socketServer =  io.listen(server);
        if (Garam.getInstance().get('clusterMode') && server.options.redisConn) {
            var redis = require('redis').createClient;
            if (typeof options().redis.auth !=='undefined') {
                var pub = redis(options().redis.port, options().redis.host, { auth_pass: options().redis.auth  });
                var sub = redis(options().redis.port, options().redis.host, { return_buffers: true, auth_pass:options().redis.auth  });
            } else {
                var pub = redis(options().redis.port, options().redis.host);
                var sub = redis(options().redis.port, options().redis.host, { return_buffers: true});
            }


            this._socketServer.adapter(adapter({ pubClient: pub, subClient: sub }));
            // this._socketServer.adapter(redis({ host: options().redis.host, port: options().redis.port,auth_pass:options().redis.auth  }));
        }

        if (server.options.transportOptions != null ) {
            for (var opt in server.options.transportOptions) {
                self._socketServer.set(opt, server.options.transportOptions[opt]);
            }
        }
        var controllers =  Garam.getControllers();
        Garam.getInstance().log.info('Socket.io listen ');


        self._socketServer.sockets.on('connection', function (socket) {

            for (var i in controllers) {
                controllers[i].emit('userConnection',socket);
            }
        });




        callback();

    },
    getRemoteServer : function (hostname) {
      return this._remoteServer[hostname];
    },
    createRemote :async function(options,callback) {
        let self = this;
        let remoteOptions = options;

        return new Promise((resolve, reject) => {
            assert(remoteOptions.hostname);
            Garam.logger().info('RPC login to ',remoteOptions)
            try {
                this._remoteServer[remoteOptions.hostname] = new ClientServer();
                this._remoteServer[remoteOptions.hostname].startConnect(remoteOptions,(server)=> {

                    self.emit('connect:'+remoteOptions.hostname,server);
                    resolve(server);
                });
                if (typeof remoteOptions.reconnectOptions !== 'undefined' && remoteOptions.reconnectOptions === false) {
                    console.log('reconnec t를 사용안함')
                    return;
                }

                this.reconnectEvent(remoteOptions.hostname);
            } catch (e) {
                reject(e);
            }


        });




    },
    createHost : async function(options,callback) {

        assert(options.hostname);
        let self = this;
        return new Promise((resolve, reject) => {

            try {
                let hostServer = this._hostServer[options.hostname] = new HostServer(options);
                this._hostServer[options.hostname].listen(()=>{
                    this.emit('listen:'+options.hostname,self._hostServer[options.hostname]);
                    resolve(hostServer);
                });
            } catch (e) {
                reject(e);
            }



        });


    },
    getHost : function(hostname) {
        assert(hostname);
        return this._hostServer[hostname];
    },
    connectServer : function(options) {

        let  Net = require('net');
        let self = this;
        let checkconnect =  setInterval(function() {
            assert(options.hostname);
            let socket =  Net.connect(options.port,options.ip);
            socket.removeAllListeners('connect');
            socket.on('connect',function() {
                clearInterval(checkconnect);
                Garam.logger().info('reconnect success to',options.hostname);
                socket.end();
                delete self._remoteServer[options.hostname].socket;
                delete self._remoteServer[options.hostname];
                self._remoteServer[options.hostname] = null;
                self._remoteServer[options.hostname] = new ClientServer(options);
                self._remoteServer[options.hostname].startConnect(options,function(server){
                    self.emit('reconnect:'+options.hostname,server);
                });
                self.reconnectEvent(options.hostname);
            });
            socket.removeAllListeners('close');
            socket.on('close',function(){
                delete socket;

                socket.removeAllListeners('close');
                socket.removeAllListeners('connect');
                socket = null;

            });

        },5*1000);

    },
    removeReconnectEvent : function (hostname) {
        clearInterval(this.dcServerCheckInterval[hostname]);
        delete this.dcServerCheckInterval[hostname];
    },
    reconnectEvent : function(hostname) {
        var self = this;
        this.dcServerCheckInterval[hostname] =  setInterval(function(){
            if(self._remoteServer[hostname].disconnected) {
                clearInterval(self.dcServerCheckInterval[hostname]);
                self.connectServer(self._remoteServer[hostname].options);
            }
        },10*1000);
    },
    getHostServer : function(namespace) {
        return this.getHost(namespace);
    },
    getSocketIO : function() {
        return this._socketServer;
    },
    listenWebService : function(server) {


    }

});