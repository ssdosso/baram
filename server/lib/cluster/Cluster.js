var _ = require('underscore')
    , fs = require('fs')
    , Garam = require('../Garam')
    , Base = require('../Base')
    , Cluster = require('cluster')
    , assert= require('assert');

exports = module.exports = ClusterMng;

var Worker = function() {

}





_.extend(Worker.prototype, Base.prototype, {
    setId : function(id) {
        this._id= id;
    },
    getId : function() {
        return this._id;
    },
    send : function(message) {
        console.log(message)
    }
});

Worker.prototype.__defineGetter__('id', function() {

    return this.getId();
});

function ClusterMng (mgr, name) {
    Base.prototype.constructor.apply(this,arguments);
    this.workerList = {};
}

_.extend(ClusterMng.prototype, Base.prototype, {
    create : function() {},
    getWorkers : function() {
        if (Garam.get('clusterMode')) {
            return Cluster.workers;
        } else {
            return [this.worker]
        }
    },
    getWorker : function(id) {
        if (Garam.get('clusterMode')) {
            return Cluster.workers[id];
        } else {
            return this.worker;
        }

    },
    isWorker : function() {

        return Cluster.isWorker;
    },
    isMaster : function() {
        return Cluster.isMaster;
    },
    isSingle : function() {
        if (!Garam.get('clusterMode')) {
            return true;
        }

        return false;
    },
    Cluster : function() {
        return Cluster;
    },
    getId : function() {
        if (Garam.get('clusterMode')) {
            return Cluster.worker.id;
        } else {
            return this.worker['child'].getId();
        }

    },
    fork : function() {
        if (Garam.get('clusterMode')) {

            return Cluster.fork();
        } else {
            this.worker = {};
            this.worker['child'] = new Worker();
            this.worker['child'].setId(1);
            this.worker['master'] = new Worker();

            return this.worker;
        }

    }


});
