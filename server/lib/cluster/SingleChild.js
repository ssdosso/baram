var _ = require('underscore')
    , fs = require('fs')
    , request = require('request')
    , winston = require('winston')
    , BaseProcessFactory = require('./BaseProcessFactory')
    , Garam = require('../Garam')
    , assert= require('assert');




/**
 * 필수   exports, 라우터 네임
 * @type {Function}
 */
exports = module.exports = ChildServer;

function ChildServer () {

    BaseProcessFactory.prototype.constructor.apply(this,arguments);
}

_.extend(ChildServer.prototype,BaseProcessFactory.prototype,{
    create : async function(callback) {
        var self = this;
        var worker = Garam.getCluster().getWorker();
        this.worker = worker.child;
        this.master = worker.master;
        worker.child.on('message',function(message){

            self.onMessage(message);
        });

        await this.addTransactions('worker',this);
        this.setTransactionEvent(this.worker);
        // this.addTransactions('worker',this,function(){
        //     self.setTransactionEvent(self.worker);
        //     callback();
        // });
        // this.send('startChildServer');
    },
    isMaster : function() {
        return false;
    },
    onActive: function() {
        // this.sendToMaster({ev:'onWorks'});
    },
    sendToMaster: function(data){
        var packet = {
            ev :data.ev,
            args: data.args ? data.args : data
        }
        process.nextTick(function(){
            process.send(packet);
        });
    },
    send: function(packet){
     // this.onMessage(packet);

        this.master.emit('message',packet);
    },
    toArrayByArg : function(enu) {
        var arr = [];
        for (var i in enu )
            arr.push(enu[i]);

        return arr;
    },
    onMessage: function(data) {

        var pid = data.pid;
        delete data.pid;
        var args = this.toArrayByArg(data);
        var packet = {
            name : pid,
            args:args
        }
        var params = [packet.name].concat(packet.args);
        if (Garam.get('ispacket')) {
            console.log('##res cluster:child ' ,packet.name,packet.args);
        }
        this.worker.emit.apply( this.worker,params);


    }
});