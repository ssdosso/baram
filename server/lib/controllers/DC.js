

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
         * host 이벤트
         */
        Garam.getTransport().on('listen:dc',function(host){
            host.on('connection',function(client){
                Garam.logger().info('client connected');
                self.addClientTransactions(client);
            });
        });
        /**
         * remote 서버에 접속 완료후 이벤트
         */
        Garam.getTransport().on('connect:dc',function(dc){
            self._dcServer = dc;
            self.addClientTransactions(self._dcServer);
            var packet = self.getTransaction('LoginReqMaster').addPacket({
                ip : dc.remoteIP,
                serverType : dc.serverType,
                serverName : dc.serverName,
                servercode : servercode

            });
            dc.send(packet);
        });
        /**
         * remote 서버에 재접속 후 이벤트
         */
        Garam.getTransport().on('reconnect:dc',function(dc){
            self._dcServer = dc;
            servercode = self.encrypt('wlxmflrtm!@');
            self.addClientTransactions(self._dcServer);
            var packet = self.getTransaction('reLoginMasterServer').addPacket({
                ip : dc.remoteIP,
                serverType : dc.serverType,
                serverName : dc.serverName,
                servercode : servercode
            });
            dc.send(packet);

        });
    },
    setConnectionStatus : function (reconnect) {

        var aliasDomain = Garam.get('aliasDomain'),self=this;
        if(typeof aliasDomain !== 'undefined') {
            //self.send(self.getTransaction('aliasUrlInfo').addPacket({aliasDomain:aliasDomain}));
        }
    },
    connectionToDc : function (serverIp,port) {
        var hostOptions= {
            'hostname' : 'dcWorker',
            'ip' : serverIp,
            'port' : port
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
            Garam.logger().info('DC server Login success');
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