var Backbone = require('backbone')
    , _ = require('underscore')
    , Garam = require('../Garam')

    , Base = require('../Base')
    , assert = require('assert')

    , async = require('async');


var Worker = function() {
        this._listen = false;
}
module.exports =  Worker;
_.extend(Worker.prototype, Base.prototype, {


    create : function(worker,config) {

        var self = this;
        if (!Garam.get('clusterMode')) {
            this._worker = worker.master;
            this._child = worker.child;
        } else {
            this._worker = worker;
        }

        this.config = config;
        function toArrayByArg(enu) {
            var arr = [];
            for (var i in enu )
                arr.push(enu[i]);

            return arr;
        }
        this._worker.on('message',function(data){

            var pid = data.pid;
            delete data.pid;

            var args = toArrayByArg(data);
            var packet = {
                name : pid,
                args:args
            }
            var params = [packet.name].concat(packet.args);

            if (Garam.get('ispacket')) {
                Garam.logger().cluster('response master  '+JSON.stringify(packet));
               //console.log('##res master ' ,packet.name,packet.args);
            }
            self.emit.apply(self,params);
        });

        this._worker.on('exit', function( code, signal) {

            if (signal) {
                Garam.logger().error(`worker was killed by signal: ${signal}`);
            } else if (code !== 0) {

                Garam.logger().error(`worker exited with error code: ${code}`);
            } else {
                console.log('worker success!');
            }


            Garam.logger().error('worker exit','port:'+self.config.port,'worker id:'+worker.id);

            setTimeout(()=>{
                Garam.getInstance().restartWorker(self.config,self);
            },1000*10)

        });

    },
    getID : function () {
        return this._worker.id;
    },
    send : function(message) {
        if (!Garam.get('clusterMode')) {
            this._child.emit('message',message);
            return;
        }
      this._worker.send(message);
    },
    getWorkerID : function() {
        return this._worker.id;
    },
    listen : function() {
        if (typeof this.config.port ==='undefined') {
            Garam.logger().error('not find config.port');
            return;
        }

        var listenStartReq = Garam.getMaster().getTransaction('listenStartReq');


        console.log('#this.config',this.config)
        this.send(listenStartReq.addPacket({config:this.config}));

    },
    setListen : function () {
        this._listen = true;
        Garam.logger().info('listen port ',this.config);
    },
    unListen : function () {
        this._listen = false;
    }

});


Worker.extend = Garam.extend;