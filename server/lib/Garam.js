
"use strict";
/**
 * Singleton Class
 * @type {*}
 */
var Backbone = require('backbone')
    , _ = require('underscore')

    , Cluster = require('cluster')
    , Base = require('./Base')
    , assert = require('assert')
    , async = require('async');
const DNS = require("dns");

var Garam = {};
var applicationDir = 'application';



/**
 * Runs over the cache to search for all the cached
 * files
 */
require.searchCache = function (moduleName, callback) {
    // Resolve the module identified by the specified name
    var mod = require.resolve(moduleName);

    // Check if the module has been resolved and found within
    // the cache
    if (mod && ((mod = require.cache[mod]) !== undefined)) {
        // Recursively go over the results
        (function run(mod) {
            // Go over each of the module's children and
            // run over it
            mod.children.forEach(function (child) {
                run(child);
            });

            // Call the specified callback providing the
            // found module
            callback(mod);
        })(mod);
    }
};

/**
 * Removes a module from the cache
 */
require.uncache = function (moduleName) {
    // Run over the cache looking for the files
    // loaded by the specified module name
    require.searchCache(moduleName, function (mod) {
        delete require.cache[mod.id];
    });

    // Remove cached paths to the module.
    // Thanks to @bentael for pointing this out.
    Object.keys(module.constructor._pathCache).forEach(function(cacheKey) {
        if (cacheKey.indexOf(moduleName)>0) {
            delete module.constructor._pathCache[cacheKey];
        }
    });
};
/**
 * singleton Object
 * @type {{getInstance: Function}}
 */

exports = module.exports =  {
    extend :   function(protoProps, staticProps) {
        var parent = this;
        var child;

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.
        if (protoProps && _.has(protoProps, 'constructor')) {
            child = protoProps.constructor;
        } else {
            child = function(){ return parent.apply(this, arguments); };
        }

        // Add static properties to the constructor function, if supplied.
        _.extend(child, parent, staticProps);

        // Set the prototype chain to inherit from `parent`, without calling
        // `parent`'s constructor function.
        var Surrogate = function(){ this.constructor = child; };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate;

        // Add prototype properties (instance properties) to the subclass,
        // if supplied.
        if (protoProps) _.extend(child.prototype, protoProps);

        // Set a convenience property in case the parent's prototype is needed
        // later.
        child.__super__ = parent.prototype;

        return child;
    },
    addErrorCode : function (errorName,code) {
        this.getInstance().error.addErrorCode(errorName,code);
    },
    getError : function () {
        return this.getInstance().error;
    },
    getInstance: function () {
        if (this._instance === undefined) {
            this._instance = new Garam.Server();
        }
        return this._instance;
    },

    getBufferMng : function() {
        return this.getInstance().bufferMng;
    },
    getControllers : function () {
        return  this.getInstance().ApplicationFactory.getControllers();
    },

    getWorkerID : function() {
        return this.getInstance().cluster.getId();
    },
    getCpuData : function () {
        return this.getInstance()._system.getLastLoadData();
    },

    /**
     * 마스터에서 워커에게 port 오픈 요청을 받았을때 처리
     * @param config
     * @returns {*}
     * @private
     */
    startWeb : function(config) {
        for (var i in config) {
            this.set(i,config[i]);
        }

        return this.getInstance().listenService();
    },
    getCtl : function(controllerName) {
        assert(controllerName);
        return this.getInstance().getController(controllerName);
    },
    getSocketIO : function() {
        return this.getInstance().transport.getSocketIO();
    },
    get : function(name) {
        return this.getInstance().get(name);
    },
    set : function (name,value) {
        this.getInstance().set(name,value);
    },
    getCtr : function(controllerName) {
        assert(controllerName);
        return this.getInstance().getController(controllerName);
    },
    addCommand: function(cmd,func) {
        this.getInstance().command.addCommand(cmd,func);
    },
    getTransport : function() {
        return this.getInstance().transport;
    },
    /**
     *

     * @param transaction
     * @returns {*}
     */
    getTransaction : function(transaction) {
        if(this.getInstance().getTransaction(transaction)) {
            return this.getInstance().getTransaction(transaction);
        }
    },
    getWorkerTransaction : function(transaction) {
        return this.getInstance().getWorker().getTransaction(transaction);
    },
    sendWorker : function(packet) {

        this.getInstance().getWorker().send(packet);
    },
    getService : function () {
        return this.getInstance().getService();
    },
    error : function() {
        return this.getInstance().error;
    },
    getHostServer  : function() {
        return this.getInstance().transport.getHostServer();

    },
    setModel : function(name,model) {
        this.getInstance().modelManager.set(name,model);
    },
    getModel : function(name,type) {
        return this.getInstance().modelManager.get(name,type);
    },

    getDB : function(namespace) {
        return this.getInstance().getDB(namespace);
    },


    isMaster : function() {
        return this.getInstance().cluster.isMaster();
    },
    logger : function() {
        return this.getInstance().logger;
    },
    /**
     * cluster  와 worker 의 차이점은 cluster 는 node.js cluster 의 상속이고,
     * worker 는 cluster 의 instance 이다.
     * @returns {ClusterMng|exports|module.exports|*}
     */
    getCluster : function() {
        return this.getInstance().cluster;
    },
    getMaster : function() {
        return this.getInstance().getMaster();
    },
    getWorker : function(id) {
        //if (id) {
        //   return  this._instance._workers[id];
        //}
        return     this.getInstance().getWorker();
    }
};






Garam.Server = function() {
    Base.prototype.constructor.apply(this,arguments);
    var v8 = require('v8');
    v8.setFlagsFromString('--expose_gc');


    this.config = new Garam.config(new Backbone.Model());

    this.logger =   new Garam.Logger;
    this.transport = new Garam.Transport;
    this.modelManager = new Garam.ModelManager;
    this.command = new Garam.Command;
    this.error = new Garam.Error;
    this.cluster = new Garam.Cluster;
    this._master = new Garam.Master;
    this._worker = new Garam.Worker;
    this.bufferMng = new Garam.BufferManager;



    this._singleWorker = new Garam.SingleChildServer;
    this._singleMaster = new Garam.SingleMasterServer;
    this._storage = new Garam.Storage();
    this._system = new Garam.System();
    this._system.start();

    this.cluster.create();
    this.command.create();
    this._service = false;
    this.db = {};
    this._listenStatus = false;


};

Garam.Server.prototype.__defineGetter__('log', function () {
    var logger = this.logger;

    logger.level =  -1;
    return logger;
});



/**
 * async 모듈함수들을 현재의 객체에 extend 함.
 */

_.extend(Garam.Server.prototype, Base.prototype, {
    create:async function(options){
        var self = this;


        this._transactions = {};
        this._transactionList ={};
        this._workers = {};


        /**
         * server/conf/,환경 설정을 읽는다.
         */
        await this.config.loadJson(options.config,applicationDir,this);

        this.logger.init();
        await this.execute(self.get('service'));


    } ,

    getServerIP : function (callback) {
        var ipAddress = require('ip');
        if (!this.get('serverIP') && typeof callback ==='undefined') {
            return false;
        } else if(typeof callback ==='function'){
            require('dns').lookup(require('os').hostname(), function (err, ip, fam) {
                // if(typeof ip === 'undefined' || ip == '127.0.0.1') {
                //     ip =  this.get('localServerIP') ?  this.get('localServerIP') :'localhost';
                // }

                this.set('serverIP',ipAddress.address());
                callback(ip);
            }.bind(this))
        } else {
            return this.get('serverIP');
        }
    },
    startService : function(state) {
        this.setServerStatus(state);
        // Garam.getCtl('DC').listen();
        if (!this.get('portInfo')) {
            assert(0,'클러스터를 사용하기 위해서는 portInfo 가 필요합니다.');
            return;
        }
        assert(this.get('portInfo').defaultPort);
        if (_.isNaN(this.get('portInfo').defaultPort)) {
            assert(0,'defaultPort , Data Type error');
        }


        let startPort = this.get('portInfo').defaultPort,
            portType =this.get('portInfo').portType,
            mode =this.get('portInfo').mode,tcpPort=0;

        if (typeof this.get('portInfo').tcpPort !== 'undefined') {
            tcpPort = this.get('portInfo').tcpPort;
        }

        if (this.get('clusterMode')) {

            var controllers = this.ApplicationFactory.getControllers();
            var config = {},self=this;
            var total = 0,end=0;
            for (var i in controllers) {
                if (_.isFunction(controllers[i].getWorkerConfigure)) {
                    total++;
                }
            }

            for (var i in controllers) {
                if (_.isFunction(controllers[i].getWorkerConfigure)) {
                    controllers[i].getWorkerConfigure(function(cfg){
                        _.extend(config,cfg);
                        end++;
                        if (total === end) {
                            __startCluster.call(self,startPort,config);
                        }
                    });

                }
            }




            /**
             *
             * @param startPort 시작 포트 번호
             * @param config
             * @private
             */
            function __startCluster(startPort,config) {
                let port = startPort,tcpUse=false;
                if (tcpPort !==0) {
                    tcpUse = true;
                }

                if (mode === 'cpu') {
                    var cpus = require('os').cpus().length;
                    for (let i = 0; i < cpus; i++) {
                        this.createWorker(port,config,tcpPort);
                        if (portType === 1) {
                            port++;
                        }

                        if (tcpUse) {
                            tcpPort++;
                        }
                    }
                } else if (mode ==='one') {
                    this.createWorker(startPort,config,tcpPort);
                } else if ( mode =='number') {

                    var maxCount = this.get('portInfo').maxCount;

                    for (let i = 0; i < maxCount; i++) {
                        this.createWorker(port,config,tcpPort);
                        if (portType === 1) {
                            port++;
                        }
                        if (tcpUse) {
                            tcpPort++;
                        }
                    }
                }

            }

        }else {

            var controllers = this.ApplicationFactory.getControllers();
            var config = {},self=this;
            var total = 0,end=0;
            for (var i in controllers) {
                if (_.isFunction(controllers[i].getWorkerConfigure)) {
                    total++;
                    controllers[i].getWorkerConfigure(function(cfg){
                        _.extend(config,cfg);
                        end++;

                        if (total === end) {

                            __start.call(self,startPort,config);
                        }
                    });
                }
            }

            function __start(startPort,config) {
                var port = startPort;
                this.createWorker(port,config);

            }
        }

    },
    /**
     * worker 를 생성한다.
     * @param port
     */
    createWorker : function(port,cfg,tcpPort) {
        let config = {};

        if(!cfg) {
            cfg = {};
        }
        _.extend(config,cfg);
        config.port = port;
        config.tcpPort =cfg.tcpPort > 0 ? cfg.tcpPort : tcpPort;

        this.logger.warn('create worker',port);
        // this._master.setWorkerEvent(worker.id,config);
        return  this._master.createWorker(config);


    },
    createBucket : function(bucketName) {

        assert(bucketName);
        this._storage.createBucket(bucketName);
    },
    start: function(mod,callback) {
        var self = this;

        //this.logger.init();
        //var service = this.get('service');
        //this.execute(service);
    },
    /**
     * DC .에 로그인 후 다음 동작을 가능 하게 해주는 동작
     */
    setServerStatus : function(state) {
        var controllers = this.ApplicationFactory.getControllers();
        for (var i in controllers) {
            controllers[i].emit('server:ready');
        }
    },
    setIp : function() {

        var os = require('os');

        var interfaces = os.networkInterfaces();
        var addresses = [];
        for (var k in interfaces) {
            for (var k2 in interfaces[k]) {
                var address = interfaces[k][k2];
                if (address.family === 'IPv4' && !address.internal) {
                    addresses.push(address.address);
                }
            }
        }

        //console.log(addresses);

    },

    setWorker : function(worker,type) {
        this._worker   = worker;
        this._worker_type   = type;

    },
    createAppInstance: function(className,APP) {

    },
    reConnectDB : function(dbType,namespace) {
        // var dbReconnect = new DBreConnect();
    },
    getController: function(controllerName) {
        assert(controllerName);
        controllerName = controllerName.toLowerCase();
        if (typeof this.ApplicationFactory !=='undefined') {
            return  this.ApplicationFactory.getController(controllerName);
        } else {

            return false;
        }

    },
    setTransactionsList: function(name,transaction) {
        if (this._transactionList[name]) {

            this.logger.warn('이미 지정된 트랜잭션 : ' +name);
            //  return;
        }
        this._transactionList[name] = transaction;
    },
    getTransaction : function(name) {
        this.logger.warn('Garam.getTransaction()  함수는 더이상 사용되지 않습니다. ');

        // return    this._transactionList[name];
    },
    getTransactions : function() {
        return this._transactions;
    },
    setTransactions : function(transactions,module) {
        this._transactions[module] = transactions;
    },
    getService: function() {

        return this._service;
    },
    get: function(name) {
        return this.config.get(name);
    },
    set: function(name,value) {

        return this.config.set(name,value);
    },
    configure : function(env,fn) {
        var envs,args= [].slice.call(arguments);
        fn = args.pop();
        if (args.length) envs = args;
        fn.call(this);
        return this;
    },
    addRPC : function (workerID,type) {
        this.logger.info('add RPC',type);
        var AddRcpConnectionReq = this.getMaster().getTransaction('AddRcpConnectionReq');

        switch (type) {
            case 'dc':
                var dc =  this.getController('dc');
                this.getMaster().send(workerID,AddRcpConnectionReq.addPacket({'serverIp':dc.getHostIP(),'serverType':'dc','port':dc.getHostPort()}));
                break;
        }
        //  var AddRcpConnectionReq = Garam.get

    },
    /**
     * 웹서비스를 오픈한다.
     * @param port
     */
    listenService : function() {
        var self = this;

        if (this.get('service')) {

            var options = this.get('service'),workerPortOpenSuccessReq,packet;
            options.port = this.get('port');

            this._service =  new Garam.ServiceManager();
            this._service.create(options);

            if (this.cluster.isWorker() ) {

                this._service.listen( function(server,port){
                    self.emit('listenService',options.port );

                    if (this.get('service').transport) {
                        if (this.get('service').transportType ==='socket.io') {

                            this.transport.createWebSocket(server,async function(){
                                //클러스터가 마스터에게 알림 메세지.
                                workerPortOpenSuccessReq = self.getWorker().getTransaction('workerPortOpenSuccessReq');
                                packet = workerPortOpenSuccessReq.addPacket({'status':1});
                                self.getWorker().send(packet);


                                if (typeof self.get('portInfo').tcpPort !== 'undefined') {
                                    await self.transport.addTcpSocket(server);
                                }
                                //
                                // self.transport.createTcpSocket(server,function(){
                                //     //클러스터가 마스터에게 알림 메세지.
                                //
                                // });
                            });
                        } else if(this.get('service').transportType ==='tcp') {

                            this.transport.createTcpSocket(server,function(){
                                //클러스터가 마스터에게 알림 메세지.
                                workerPortOpenSuccessReq = self.getWorker().getTransaction('workerPortOpenSuccessReq');
                                packet = workerPortOpenSuccessReq.addPacket({'status':1});
                                self.getWorker().send(packet);
                            });
                        }

                    } else {
                        workerPortOpenSuccessReq = self.getWorker().getTransaction('workerPortOpenSuccessReq');
                        packet = workerPortOpenSuccessReq.addPacket({'status':1});
                        self.getWorker().send(packet);
                    }
                });
            } else if (!this.get('clusterMode')) {
                //클러스터 모드가 아닐경우.

                this._service.listen(function(server,port) {
                    self.emit('listenService',options.port );
                    if (this.get('service').transport) {
                        this.transport.createWebSocket(server,function(){
                            workerPortOpenSuccessReq = self.getWorker().getTransaction('workerPortOpenSuccessReq');
                            packet = workerPortOpenSuccessReq.addPacket({'status':1});
                            self.getWorker().send(packet);
                        });
                    } else {
                        workerPortOpenSuccessReq = self.getWorker().getTransaction('workerPortOpenSuccessReq');
                        packet = workerPortOpenSuccessReq.addPacket({'status':1});
                        self.getWorker().send(packet);
                    }
                });
            }
        }
    },

    restartWorker : function(config,workerInstacne) {

        this.logger.info('restart worker ',config);
        this.createWorker(config.port,config);
      //  delete workerInstacne;
    },
    _master : null,
    _workers : null,


    getWorker : function() {

        if (this.get('clusterMode')) {
            if (!this.cluster.isMaster()) {
                return this._worker;
            }
            this.logger.error('is not worker');
        } else {
            return this._worker;
        }

    },
    getMaster : function() {
        if (this.cluster.isMaster()) {
            return this._master;
        }
        this.logger.error('is not master');
    },
    /**
     * step 1
     * 서버의 최초 기동.
     * @param service
     */
    execute : async function(service) {

        let clusterMode = this.get('clusterMode'),self=this
            , SingleChild = require('./cluster/SingleChild')
            , DNS =require('dns')
            , SingleMaster = require('./cluster/SingleMaster');
        this.set('application',true);
        this.set('appDir',applicationDir);
        this.setIp();

        // DNS.lookup(require('os').hostname(), (err, ip, fam)=>{
        //
        // });

        DNS.lookup(require('os').hostname(), async (err, ip, fam)=>{

            this.set('serverIP',ip);
            this.logger.info('server IP ',self.get('serverIP'));
            if (clusterMode) {
                this.logger.info('use clusterMode');
                if (this.cluster.isMaster()) {
                    if(this.get('masterDB')) {
                        await this._master.create();
                        await this.executeDb();
                        // this._master.create(function(){
                        //     self.executeDb();
                        // });

                    } else {

                        await this._master.create();
                        this.executeApp();
                        // this._master.create(function(){
                        //     self.executeApp();
                        // });

                    }

                } else if(self.cluster.isWorker()) {
                    await this._worker.create();
                    await this.executeDb();
                    // this._worker.create(function(){
                    //     self.executeDb();
                    // });
                }
            } else {
                delete this._master;
                delete this._worker;
                this._worker =this._singleWorker;
                this._master = this._singleMaster;

                await this._master.create();
                await this.executeDb();
                // this._master.create(function(){
                //     self.executeDb();
                //
                // });
            }


        });


    },
    dnsLookup : function () {
        var dns = require('dns');
        var self = this;
        setTimeout(function () {
            self.dnsLookup();
        },10000);


        var dns = require('dns'),
            dnscache = require('dnscache')({
                "enable" : true,
                "ttl" : 300,
                "cachesize" : 1000
            });

        //to use the cached dns either of dnscache or dns can be called.
        //all the methods of dns are wrapped, this one just shows lookup on an example

        //will call the wrapped dns
        dnscache.lookup('fs.sports.naver.com', function(err, result) {

            //do something with result
        });

        //
        // dns.lookup('fs.sports.naver.com',function (err, ip, fam) {
        //      //   console.log(err);
        //    // console.log(ip);
        //    // console.log(fam);
        // });
        //
        //
        // dns.resolve4('fs.sports.naver.com', function (err, addresses) {
        //     if (err) throw err;
        //    // console.log('addresses: ' + JSON.stringify(addresses));
        //
        //     addresses.forEach(function (a) {
        //         console.log(a)
        //         dns.reverse(a, function (err, domains) {
        //             if (err) {
        //                 console.log(err)
        //             }
        //
        //             console.log('reverse for ' + a + ': ' + JSON.stringify(domains));
        //         });
        //     });
        //
        //
        // });


    },
    /**
     * 싱글 모드에서 가상의 클러스터를 만든다.
     */
    createSingleWorker : function(callback) {
        var self = this;
        this._worker.create(function(){
            callback();
        });
    },
    /**
     * step 2
     * database connection
     * 데이터 베이스 접속은 순차적으로 일어 난다.
     * 절대, 동시에 connection 이 일어 나지 않는다.
     *
     * ####
     * event databaseOnReady 가 제일 중요하다.
     * 데이터베이스 모델이 두가지 유형이 있는데 하나는 mssql 프로시져를 이용한 방법이고
     * 나머지 하나는 redis 의 nohm 을 이용한 방법인데 두가지 모두 팩토리 형식을 사용하고 있다.
     * 각각의 특정 디렉토리의 js 파일들을 모두 읽어 들여 초기화가 모두 완료 되면.
     * databaseOnReady 이벤트가 발생하여 다음 동작을 진행 하게 된다.
     */
    executeDb : async function() {

        let self = this;
        this.dbWorkState = {};
        if (this.get('useDB')) {
            let db_config = this.get('db'),self=this;

            if (_.isArray(this.get('db'))) {
                for (var i in db_config) {
                    this.dbWorkState[db_config[i].namespace] = false;
                }
                await db_create.call(this,db_config);
            }

           async function db_create(config) {
                require.uncache('nohm');
                let cfg = config.pop();
                let db  = this.db[cfg.namespace] = new Garam.Db();
                db.connectTimeout =setTimeout(function () {
                    self.logger.error('Database Connection Timeout' ,cfg.namespace );
                },3000);

                try {
                    await db.createConnect(cfg);

                    clearTimeout(db.connectTimeout);
                    await db.initModel();


                    if (db_config.length > 0) {

                       await db_create.call(self,db_config);
                    } else {
                        await self.executeApp();
                    }
                } catch (e) {
                    console.error('데이터 베이스 접속중에러 발생',e)
                }


                //
                // db.createConnect(cfg,function() {
                //
                //     clearTimeout(db.connectTimeout);
                //     db.initModel();
                //     if (db_config.length > 0) {
                //         db_create.call(self,db_config);
                //     }
                //
                // });
            }
        } else {

            await this.executeApp();
        }
        /**
         * 데이터 베이스 모델, 프로시져가 모두 준비가 완료 상태에 오면 다음 작업을 준비 시킨다.
         *
         */
        // this.on('databaseOnReady',function(namespace) {
        //     var state = true;
        //     console.log('on message !!!',namespace)
        //     if (this.isDataBaseReady(namespace)) {
        //         return;
        //     }
        //     self.dbWorkState[namespace] = true;
        //
        //     for (var i in self.dbWorkState) {
        //         if (self.dbWorkState[i] === false) {
        //             state = false;
        //         }
        //     }
        //     if (state) {
        //         self.executeApp();
        //     }
        //
        //
        // });
    },
    isDataBaseReady :  function(namespace) {
        return this.dbWorkState[namespace];
    },
    /**
     * step 3
     * application 팩토리
     * 중간에 executeNet() 부분이 있는데.
     * application 이 모두 준비 되면 net 처리를 하게 된다ㅣ.
     *
     */
    executeApp : async function() {
        var self = this,single = this.get('clusterMode');
        this.executeNet(); // tcp net 모듈 활성화

        try {
            this.ApplicationFactory = new Garam.ApplicationFactory();
            await this.ApplicationFactory.appCreate();
        } catch (e) {
            this.logger.error('ApplicationFactory Error',e)
        }


        if (this.get('testMode')) {
            var dir = process.cwd()+'/'+ this.get('appDir') + '/test';
            var list = require('fs').readdirSync(dir);
            var testapp = [];
            list.forEach(function (file,i) {
                var stats = require('fs').statSync(process.cwd()+'/'+self.get('appDir')+ '/test/'+ file);
                if (stats.isFile()) {
                    var TestApp = require(process.cwd()+'/'+ self.get('appDir') + '/test/'+ file);

                    var test = new TestApp;
                    test.create();
                    testapp.push(test);
                }
            });
        }

    },
    createHostServer : function (createHost,callback) {
        this.transport.createHost(createHost,function(client){
            callback(client);
        });
    },
    createRemoteServer : function (config,callback) {
        this.transport.createRemote(config,function(server){
            callback(server);
        });
    },
    /**
     * application 이 모두 ready 상태라면 이벤트 발생.
     */
    executeNet : function() {
        var self = this,clusterMode = this.get('clusterMode');


        this.on('applicationReady',function(){
            console.log('call')
            createNet.call(self);
        });
//        this.emit('completeWork','end');
        function createNet() {
            /**
             * 마스터 일경우 원격 RPC 를 사용
             */
            if (this.cluster.isMaster()  || !clusterMode) {

                if (this.get('net')) {
                    if (this.get('net').host) {
                        for (var i in this.get('net').host) {

                            (async (hostConfig)=>{
                                await this.transport.createHost(hostConfig);
                            })(self,this.get('net').host[i]);
                            // (function(hostConfig){
                            //
                            //     this.transport.createHost(hostConfig,function(client){
                            //
                            //     });
                            // }).call(self,this.get('net').host[i]);
                        }

                    }
                    if (this.get('net').remote) {

                        for (var i in this.get('net').remote) {


                            (async (remoteConfig)=>{
                                await this.transport.createRemote(remoteConfig);
                            })(this.get('net').remote[i]);
                            // (function(remoteConfig){
                            //
                            //     this.transport.createRemote(remoteConfig,function(client){
                            //
                            //     });
                            // }).call(self,this.get('net').remote[i]);
                        }

                    }


                } else {
                    /**
                     * RPC 서버를 사용하지 않고, 클러스터 모드도 아닐때
                     */

                    this.startService();
                }
            } else {

                self.setWorkerReady();
                // if (this.get('net').hostWorker) {
                //    console.log(this.get('net').hostWorker)
                // }

            }
        }
    },
    setWorkerReady : function() {
        var workerOnReady = this.getWorker().getTransaction('workerOnReady').addPacket();

        this.getWorker().send(workerOnReady);
    },
    getDB : function(namespace) {
        if(!namespace) namespace = this.db_namespace;

        return this.db[namespace];
    }

});



Garam.Logger =  require('./Logger');

//Garam.Storage = require('./Storage');
Garam.ServiceManager =  require('./ServiceManager');
Garam.config =  require('./configure');
//Garam.triggerMethod = require('./triggerMethod');
Garam.Transport = require('./Transport');
Garam.ApplicationFactory = require('./ApplicationFactory');
Garam.Db = require('./database/Db');
Garam.ModelManager = require('./ModelManager');
Garam.Command = require('./Command');
Garam.Error = require('./Error');
Garam.Cluster = require('./cluster/Cluster');
Garam.Storage = require('./Storage');
Garam.System = require('./System');
Garam.BufferManager = require('./BufferManager');


Garam.Worker = require('./cluster/Worker');
Garam.Master = require('./cluster/Master');
//
Garam.SingleChildServer = require('./cluster/SingleChild');
Garam.SingleMasterServer = require('./cluster/SingleMaster');
