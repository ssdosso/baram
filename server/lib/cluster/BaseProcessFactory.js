var EventEmitter = require('events').EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , request = require('request')
    , winston = require('winston')
    , Garam = require('../Garam')
    , Base = require('../Base')
    , assert= require('assert');




/**
 * �ʼ�   exports, ����� ����
 * @type {Function}
 */
exports = module.exports = ClusterBase;

function ClusterBase () {
    Base.prototype.constructor.apply(this,arguments);
}

_.extend(ClusterBase.prototype,EventEmitter.prototype,{

    getTransaction : function(pid) {
        if(this._transactions[pid]) {
            return this._transactions[pid];
        } else {
            Garam.logger().error('not found transaction',pid)
        }
    },
    addTransaction : function(transaction,user) {
        if (this._transactions[transaction.pid]) {
            Garam.logger().warn('pid 는 항상 존재 해야 합니다 : ' +transaction.pid);
        }
        this._transactions[transaction.pid] =  transaction;
        transaction.create();

    },
    setTransactionEvent : function(cluster) {

        for (let transactionPid in this._transactions) {
            (function(transaction,transactionPid){
                transaction.removeEvent(cluster);
                transaction.addEvent(cluster);
            }).call(this,this._transactions[transactionPid],transactionPid);
        }
    },
    addTransactions : async function(dir,worker) {
        var dir =  Garam.get('appDir') +'/transactions/'+dir,self = this;
        if(!fs.existsSync(dir)) {
            Garam.error('not find transDir' +dir);
            return;
        }
        this._transactions = {};
      //  Garam.getInstance().setTransactions(this._transactions,this.className);
        var list = fs.readdirSync(dir);
        var total =list.length;
        // if (list.length ===0) {
        //     return;
        // }

        for await (let transFile of list) {
            ((file)=>{
                let stats = fs.statSync(dir + '/'+ file);

                if (stats.isFile()) {
                    let Transaction = require(process.cwd()+'/'+dir + '/'+ file);
                    let t = new Transaction;
                    t.create(worker);
                    self.addTransaction(t);
                }
            })(transFile);

        }

        // list.forEach(function (file,i) {
        //     var stats = fs.statSync(dir + '/'+ file);
        //     if (stats.isFile()) {
        //         var Transaction = require(process.cwd()+'/'+dir + '/'+ file);
        //         var t = new Transaction;
        //         t.create(worker);
        //         self.addTransaction(t);
        //     }
        //     if (total === (i+1)) {
        //         callback();
        //     }
        //
        // });
    }

});