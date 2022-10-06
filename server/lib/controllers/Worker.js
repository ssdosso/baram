

var
    Garam = require('..//Garam')
    ,moment = require('moment')
    ,Application = require('../Application');

var App = Application.extend({

    /**
     * host 가 listen 하면 발생하는 이벤트
     */
    createConnection : function() {
        var self = this;

        this.secret ="eyc#ypt%onFe75dy";
        this.iv  = Buffer.from('gJFRCVd0hzRCXcn5CEBSfQ==', 'base64');

        var servercode = this.encrypt('wlxmflrtm!@' );

        /**
         * remote 서버에 접속 완료후 이벤트
         */
        Garam.getTransport().on('connect:dc_worker',function(dc){


            self._dcServer = dc;
            self.addClientTransactions(self._dcServer);
            var packet = self.getTransaction('loginReqWorker').addPacket({
                ip : dc.remoteIP,
                serverType : dc.serverType,
                serverName : self.getServerName(),
                masterServerName :self.getMasterServerName(),
                port : self.getClientPort(),
                workerId : Garam.getWorkerID(),
                servercode : servercode
            });
            dc.send(packet);

        });
        /**
         * remote 서버에 재접속 후 이벤트
         */
        Garam.getTransport().on('reconnect:dc_worker',function(dc){
            self._dcServer = dc;
            self.addClientTransactions(self._dcServer);
            servercode = self.encrypt('wlxmflrtm!@' );
            var packet = self.getTransaction('reLoginWorkerServer').addPacket({
                ip : dc.remoteIP,
                serverType : dc.serverType,
                serverName : self.getServerName(),
                masterServerName :self.getMasterServerName(),
                port : self.getClientPort(),
                workerId : Garam.getWorkerID(),
                servercode : servercode
            });
            dc.send(packet);

        });
    },
    /**
     * worker 가 DC 에 로그인 성공 함..
     * @param state
     */
    setConnectionStatus : function (state) {
        this.state = state;
        let aliasDomain = Garam.get('aliasDomain'),serverSSL=Garam.get('serverSSL');
        let assert = require('assert');
        let controllers = Garam.getControllers();
        for ( let i in Garam.getControllers()){
            controllers[i].emit('connect:connected');
        }
        if (Garam.get('net').hostWorker ) {

            let hostInfo = Garam.get('net').hostWorker;
            /**
             * "hostWorker" : [{
              "hostname":"GHost",
              "ip" :"127.0.0.1",
              "port":5000,
              "ctl" : "host"
            } ]
             */
            for (let h of hostInfo) {
                (function (host){
                    assert(host.ctl);
                    Garam.getCtl(host.ctl).listenServer(host);
                })(h);
            }
         //   Garam.getCtl(hostInfo.ctl).listenServer();
        }
    },
    isConnectionDc : function () {
      return this.state;
    },
    getMasterServerName : function () {
        return this._dcServer.serverName;
    },
    getServerName : function () {
        if ( this._dcServer == null) {
                return 'slot:8888';

        }

        if (Garam.get('portInfo').portType ===0 && !Garam.isMaster()) {
            let worker = Garam.getWorkerID();

            return this._dcServer.serverName +':'+worker+':'+this.getClientPort();
        } else {
            return this._dcServer.serverName +':'+this.getClientPort();
        }

    },
    getClientPort : function () {
        return Garam.get('port');
    },
    connectionToDc : function (serverIp,port) {
        var hostOptions= {
            'hostname' : 'dc_worker',
            'ip' : serverIp,
            'port' : port,
        }
        Garam.getTransport().createRemote(hostOptions,function (dc) {

        });
    },
    getHostPort : function () {
        return this.getDC().getHostPort();
    },
    getHostIP : function () {
        return this.getDC().getHostIP();
    },
    getDC : function () {
        return this._dcServer;
    },
    init : function() {
        var self = this;
        this._dcServer  =null;
        this._listenPortList = {};
        this._roomInfo = {};
        this._portList = [];
        /**
         * 서버가 DC에 로그인 한후 실제 비지니스 로직이 시작됨.
         */
        this.on('server:ready',function(){
            Garam.logger().info('DC Worker server Login success');
            self.serverReady = true;
        });
    },
    /**
     * 서버의 port 가 열리면 DC 에 열린 port 정보를 알림.
     * @param port
     */
    listenToDC : function(port,process_id) { },

    send : function(packet) {
        this._dcServer.send(packet);
    }
});


exports = module.exports = App;
App.extend = Garam.extend;