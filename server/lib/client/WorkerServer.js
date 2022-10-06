var EventEmitter = require('events').EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    ,Base =require('../Base')
    , Garam = require('../Garam')
    , request = require('request')
    , winston = require('winston')
    , assert= require('assert');


exports = module.exports = ServiceClientServer;

function ServiceClientServer () {
    Base.prototype.constructor.apply(this,arguments);

}

_.extend(ServiceClientServer.prototype,{
    init : function () {
        
    },
    create : function (client,reconnection) {
        var dcCtl = Garam.getCtl('dc');
        this._client = client;
        this._client.clearLoginTimer();
        this._options = {};
    
        if (!reconnection) {
            var ServerLoginWorkerStatusRes = dcCtl.getTransaction('ServerLoginWorkerStatusRes');
            this.send( ServerLoginWorkerStatusRes.addPacket({state:true}));
        } else {
            var ReConnectionWorkerRes = dcCtl.getTransaction('ServerReConnectionWorkerRes');
            this.send( ReConnectionWorkerRes.addPacket({state:true}));
        }
    
    },
    getMasterServer : function () {

          return Garam.getCtl('dc').getMasterServer(this.getMasterSeverName());
    },
    setModel : function (model) {
        this._model = model;

    },
    getModel : function () {
        return this._model;
    },
    signin : function () {
        var workerServer = Garam.getModel('workerServer'),self = this;
        workerServer.serverLogin(this,function (err,model) {
            if (err) {
                Garam.logger().error('worker server login error: ' ,err);
                return;
            }
            Garam.logger().info('worker server login success',this.getServerName());
            self.setModel(model);
            var masterServer = this.getMasterServer();

            masterServer.link(this);

        }.bind(this));
    },
    signout : function (callback) {
        var workerServer = Garam.getModel('workerServer'),self = this;
        workerServer.serverLogout(this,function (err) {
            Garam.logger().info('server logout',self.getServerName());
            var masterServer = this.getMasterServer();

            masterServer.unlink(this);
            callback();
        }.bind(this))
    },
    end : function (message) {
        if (!this._client.disconnected) {
            this._client.end(function () {
                Garam.logger().warn('disconnected',this.getServerName(),message);
            })
        }
    },
    setInfo : function (info) {
        this._options = info;
    },
    getPort : function () {
        return this._options.port;
    },
    getMasterSeverName : function () {
        return this._options.masterServerName;
    },

    getServerStatus : function () {
        if (this._client.disconnected) {
            return false;
        } else {
            return true;
        }
    },
    getServerIP : function () {
        return this._options.ip;
    },
    getServerType : function () {
        return this._options.serverType;
    },
    getServerName : function () {
        return this._options.serverName;
    },
    send : function (packet) {
        if (this._client && !this._client.disconnected) {
            this._client.send(packet);
        } else {
            Garam.logger().warn('master client not connected',this.getServerName());
        }

    },
    /**
     *  서버가 떨어 졌을 경우
     */
    setDisconnected : function () {
        Garam.logger().warn(this.getServerName() ,'disconnected error');
        this.signout(function () {
            var dcCtl = Garam.getCtl('dc');
            dcCtl.removeEvent(this._client);
            delete this._client;
        }.bind(this));
    },

    changeClient : function (client) {
        var dcCtl = Garam.getCtl('dc');
        this._client = client;
        this._client.clearLoginTimer();
        var ServerLoginWorkerStatusRes = dcCtl.getTransaction('ServerLoginWorkerStatusRes');


        this.send( ServerLoginWorkerStatusRes.addPacket({state:true}));
    }
});
ServiceClientServer.extend = Garam.extend;