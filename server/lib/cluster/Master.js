var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , request = require('request')
    , winston = require('winston')
    , Cluster = require('cluster')
    , Baram = require('../Baram')
    , assert= require('assert');



/**
 * 필수   exports, 라우터 네임
 * @type {Function}
 */
exports = module.exports = MasterServer;

function MasterServer () {}

_.extend(MasterServer.prototype,EventEmitter.prototype,{
    addMessageEvent : function(id) {
        var self = this;
        Cluster.workers[id].on('message', function(data){
            self.onMessage(data,id);
        });
    },
    isMaster : function() {
        return true;
    },
    create : function() {
        var self = this;
        this._workers = {};
        Object.keys(Cluster.workers).forEach(function(id) {
            self.addMessageEvent(id);

        });
        Cluster.on('exit', function(worker, code, signal) {
            var now = new Date;
            var exitCode = worker.process.exitCode;
            Baram.getInstance().log.warn('web process died code:'+exitCode);
            delete self._workers[worker.id];
            Cluster.fork();
            Object.keys(Cluster.workers).forEach(function(id) {
                if (!self._workers[id]) {
                    self._workers[id] = {};
                    self._workers[id].process = true;
                    self.addMessageEvent(id);
                }
            });
        });

        this.on('onWorks', function (data, id) {
            Baram.getInstance().log.info('worker ID : ' + id);
            self._workers[id]  = {};
            self._workers[id].process = true;

        });
    }  ,
    onMessage: function(packet,id) {
        packet.id = id;
        var name = (packet.pid)? packet.pid : 'message';
        var params = [name].concat(packet.args),self=this;

        var controllers = Baram.getInstance().getControllers();


        for (var i in controllers) {
            console.log(i)
            console.log(controllers[i])
            process.nextTick(function(){
                controllers[i].emit.apply( controllers[i],params);
            });
        }


    },
    send: function(data){
        var packet = {
            ev :'message',
            type:'sendMessage',
            pid : 'message',
            args: data
        }
        Object.keys(Cluster.workers).forEach(function(id) {
            Cluster.workers[id].send(packet);
        });
    }
});