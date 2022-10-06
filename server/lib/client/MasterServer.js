 var _ = require('underscore')
    , fs = require('fs')
    ,Base =require('../Base')
    , Garam = require('../Garam')
    , request = require('request')
    , winston = require('winston')
    , assert= require('assert');


exports = module.exports = MasterServer;

function MasterServer () {
    Base.prototype.constructor.apply(this,arguments);
   
    this._childServerList =[];
}

_.extend(MasterServer.prototype,{
    create : function (client,reconnection) {
        var dcCtl = Garam.getCtl('dc');
        this._client = client;
        this._client.clearLoginTimer();
        this._workers = {};
        this._options = {};

      
        if (!reconnection) {
            var ServerLoginMasterStatusRes = dcCtl.getTransaction('ServerLoginMasterStatusRes');
            this.send( ServerLoginMasterStatusRes.addPacket({state:true}));
        } else {
           
            var ServerReConnectionStatusRes = dcCtl.getTransaction('ServerReConnectionStatusRes');
             this.send( ServerReConnectionStatusRes.addPacket({state:true}));
        }




    },
    setModel : function (model) {
      this._model = model;
    },
    getModel : function () {
      return this._model;
    },
    unlink : function (worker) {
        Garam.logger().info('worker unlink');
        var masterServer = Garam.getModel('masterServer'),self = this;
        this._workers[worker.getServerName()] = worker;
        masterServer.updateWorker(this.getModel(),worker);
    },
    link : function (worker) {
        Garam.logger().info('worker link');
        var masterServer = Garam.getModel('masterServer'),self = this;
        this._workers[worker.getServerName()] = worker;
        masterServer.updateWorker(this.getModel(),worker);
    },
    signin : function (callback) {
        var masterServer = Garam.getModel('masterServer'),self = this;
        masterServer.serverLogin(this,function (err,model) {
            if (err) {
                Garam.logger().error('master server login error: ' ,err);
                return;
            }
            Garam.logger().info('master server login success',this.getServerName());

            self.setModel(model);
            callback();


        }.bind(this));
    },
    end : function (message) {
        if (!this._client.disconnected) {
            this._client.end(function () {
                Garam.logger().warn('disconnected',this.getServerName(),message);
            })
        }
    },
    getServerStatus : function () {
        if (this._client.disconnected) {
            return false;
        } else {
            return true;
        }
    },
    setInfo : function (info) {
        this._options = info;
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
    addServer : function (worker,serverName) {

        if (this._workers[serverName]) {
            delete this._workers[serverName];
        }
        this._workers[serverName] = worker;
    },
    send : function (packet) {
        if (this._client && !this._client.disconnected) {
            this._client.send(packet);
        } else {
            Garam.logger().warn('master client not connected',this.getServerName());
        }

    },
    setDisconnected : function () {
        Garam.logger().warn(this.getServerName() ,'disconnected error');
        this.signout(function () {
            var dcCtl = Garam.getCtl('dc');
            dcCtl.removeEvent(this._client);
            delete this._client;
        }.bind(this));
      
    },
    signout : function (callback) {
        var masterServer = Garam.getModel('masterServer'),self = this;
        masterServer.serverLogout(this,function (err) {
            Garam.logger().info('server logout',self.getServerName());
            callback();
        })
    },
    changeClient : function (client) {
        var dcCtl = Garam.getCtl('dc');
        this._client = client;
        this._client.clearLoginTimer();
        var ServerLoginMasterStatusRes = dcCtl.getTransaction('ServerLoginMasterStatusRes');


        this.send( ServerLoginMasterStatusRes.addPacket({state:true}));
    }
});
MasterServer.extend = Garam.extend;