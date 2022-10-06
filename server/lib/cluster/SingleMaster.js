var _ = require('underscore')
    , fs = require('fs')
    , request = require('request')
    , winston = require('winston')
    , Cluster = require('cluster')
    , BaseProcessFactory = require('./BaseProcessFactory')
    , Garam = require('../Garam')
    , BaseWorker = require('./BaseWorker')
    , assert= require('assert');



/**
 * 필수   exports, 라우터 네임
 * @type {Function}
 */
exports = module.exports = MasterServer;

function MasterServer () {
    BaseProcessFactory.prototype.constructor.apply(this,arguments);
    this._workers ={};

}

_.extend(MasterServer.prototype,BaseProcessFactory.prototype,{
    create :async function(callback) {
        var self = this;
        /**
         * 워커에서 실제 포트가 열려 있으면....
         */

        await this.addTransactions('master',this);


    },

    isMaster : function() {
        return true;
    },
    createWorker : function(config) {
        var self = this;
        var worker = Garam.getCluster().fork();
        var workerId = worker.child.id;
        

        this._workers[workerId] = new BaseWorker();
        this._workers[workerId].create(worker,config,'single');
        //worker.child.on('message',function(message){
        //  console.log(message)
        //});
        this.setTransactionEvent(this._workers[workerId]);
        //가상의 워커를 만든후에 이벤트를 마스터에게 보낸다.
        Garam.getInstance().createSingleWorker(function(){
            var workerOnReady = Garam.getWorker().getTransaction('workerOnReady').addPacket();
            Garam.getWorker().send(workerOnReady);
        });

    },

    getWorker : function(workerId) {
        assert(workerId);
        return  this._workers[workerId];
    },
    onMessage: function(packet,id) {

    },
    sendAll: function(packet){


        for (var i in this._workers) {
            (function(id){
                var self = this;
                this._workers[i].send(packet);

            }).call(this,i);

        }


    }
});