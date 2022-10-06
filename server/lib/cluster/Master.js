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
    create : async function(callback) {
        var self = this;
        /**
         * 워커에서 실제 포트가 열려 있으면....
         */
        //Cluster.on('listening', function(worker, address) {
        //
        //    self.workerStatusCheck(worker,address);
        //    //console.log("A worker is now connected to " + address.address + ":" + address.port);
        //});

        Cluster.on('online', function(worker) {


        });
        // this.addTransactions('master',this,function(){
        //     callback();
        // });

        await this.addTransactions('master',this);

    },

    isMaster : function() {
        return true;
    },
    createWorker : function(config) {
       
        let worker = Garam.getCluster().fork();
        let workerId = worker.id;



        this._workers[workerId] = new BaseWorker();

        this._workers[workerId].create(worker,config);
        this.setTransactionEvent(this._workers[workerId]);
        Garam.getInstance().emit('listenWorker',config.port,workerId);
        return  this._workers[workerId];
    },

    getWorker : function(workerId) {
        assert(workerId);
        return  this._workers[workerId];
    },
    send : function (workerId,packet) {
        assert(workerId);
        
        this._workers[workerId].send(packet);
    },



    sendAll: function(packet){


        /*for (var i in this._workers) {
            (function(id){
                var self = this;
                process.nextTick(function(){
                    this._workers[i].send(packet);
                }).bind(this);

            }).call(this,i);

        }*/

        for (var i in this._workers) {
            (function(id){
                var self = this;
                process.nextTick(function(){
                    //this._workers[i].send(packet);
                    this._workers[id].send(packet);
                }.bind(this));

            }).call(this,i);

        }


    }
});