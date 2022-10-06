var EventEmitter = require('events').EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , request = require('request')
    , winston = require('winston')
    ,Garam = require('./Garam')

    , Base = require('./Base')
    , assert= require('assert')
    , domain = require('domain');


exports= module.exports = Application;

function Application() {
    Base.prototype.constructor.apply(this,['start']);
}
_.extend(Application.prototype, Base.prototype, {

    callback : function() {},
    get : function(name) {
        return Garam.get(name);
    },
    set : function(name,val) {
        Garam.set(name,val)
    },
    randomRange : function (n1,n2) {
        return Math.floor( (Math.random() * (n2 - n1 + 1)) + n1 );
    },
    errorResponse : function (errorName) {
        var errorCode;
        var Error =Garam.getErrorCode();
        if (typeof errorName ==='undefined') {
            errorCode = Error.SystemError;
        } else {
            switch (errorName) {
                case 'system':
                    errorCode = Error.SystemError;
                    break;
                case 'database':
                    errorCode = Error.DatabaseError;
                    break;
                case 'auth':
                    errorCode = Error.NotLoginError;
                    break;
                case 'packet':
                    errorCode = Error.PacketDataTypeError;
                    break;
                case 'action':
                    errorCode = Error.InvalidActionReq;
                    break;
                case 'invalid':
                    errorCode = Error.InvalidError;
                    break;
                default:
                    if(Error[errorName]) {
                        errorCode = Error[errorName];
                    } else {
                        errorCode = Error.InvalidError;
                    }
                    break;
            }
        }

        return errorCode;
    },
    createPromise : function (callback) {
        var promise = new Promise(execute);

        function execute(success, fail) {
            callback(promise,success,fail);
        }
    },
    getModel : function (modelName) {
        return Garam.getModel(modelName)
    },
    encrypt : function(message) {
        var self = this;
        var len = message.length,crypto= require('crypto');
        for (var i = 0; i < 16 - len % 16; i++) {  // pad to multiple of block size
            message += '\0';
        }

        var cipher=crypto.createCipheriv('aes-128-cbc',self.secret,self.iv);
        cipher.setAutoPadding(false);
        var crypted = cipher.update(message, 'utf8', 'base64');


        crypted += cipher.final('base64');


        return crypted;
    },
    _create : async function(className,callback) {


        this.className = className;
         await  this.addTransactionDirectory(this.className);
        if(_.isFunction(this.createConnection)) {
            this.createConnection();
        }


        // this.addTransactionDirectory(this.className,function(){
        //
        //     if(_.isFunction(self.createConnection)) {
        //
        //         self.createConnection();
        //         callback();
        //     } else {
        //         callback();
        //     }
        //
        // });
    },
    removeUserTransactions : function (user) {
        let transaction = this._transactions;
        for (let name in transaction) {
            ((trans)=>{
                trans.removeEvent(user);

            })( transaction[name]);
        }
    },
    /**
     *
     * @param user socket.io OR Net

     */
     addClientTransactions : function(user) {
        let transaction_controllers = Garam.getInstance().getTransactions();
        let d = domain.create();
        let args = Array.prototype.slice.call(arguments);
        d.on('error', function(err) {

            Garam.logger().error(err.stack);
        });

        d.run(function() {
            for (var controller_name in transaction_controllers) {

                (function(controller_transactions,controllerName){

                    for (var i in controller_transactions) {
                        (function(transaction){
                            transaction.removeEvent(user);
                            d.add(user);
                            // transaction.addEvent(user);
                            transaction.addEvent.apply(transaction,args);
                            if (typeof user.addTransactionPacket ==='function') {
                                if (typeof transaction._packet === 'undefined') {
                                    assert(transaction._packet,transaction.pid);
                                }
                                user.addTransactionPacket(transaction.pid,transaction._packet);
                            }

                        }).call(this,controller_transactions[i]);
                    }
                }).call(Garam.getInstance().getController(controller_name) , transaction_controllers[controller_name] ,controller_name);

            }
        });


    },
    logs : function () {
      return   Garam.getInstance().logger;
    },
    getTransactions: function() {
        return this._transactions;
    },
    getTransaction: function(tran) {
        return this._transactions[tran];
    },
    addTransaction : function(transaction) {
        this._transactions[transaction.pid] =  transaction;
        if (!transaction._packet) {
            transaction._packet = {};
        }
        transaction._packet.pid = transaction.pid;
        transaction._parentController(this);
        transaction.create();
        return transaction.pid;
        //  Garam.getInstance().setTransactionsList(transaction.pid,transaction);
    },
    /**
     *
     * @param dir  각 controller 의 namespace, transaction 디렉토리명.
     * @param user   socket  instance , default is null
     */
    addTransactionDirectory :  function(dir,callback) {
        let transDir =  Garam.getInstance().get('appDir') +'/transactions/'+dir,self = this;
        this._transactions = {};
        return new Promise(async (resolve, reject) => {


            try {
                if(!fs.existsSync(transDir)) {
                    Garam.getInstance().log.warn('controller 에서 사용하는 트랜잭션 폴더가 존재하지 않습니다 transactions/'+dir);
                    fs.mkdirSync(transDir);
                    //  Garam.getInstance().log.error('not found Transaction Directory' +transDir);
                    resolve();
                    return;
                }

                Garam.getInstance().setTransactions(this._transactions,this.className);
                let list = fs.readdirSync(transDir);
                for await (let file of list) {
                    await (async (transFile)=>{
                        let stats = fs.statSync(transDir + '/'+ transFile);
                        if (stats.isFile()) {
                            let Transaction = require(process.cwd()+'/'+transDir + '/'+ transFile);
                            let pid  =this.addTransaction(new Transaction);

                        } else {

                            await readTransaction.call(this,transFile);

                        }
                    })(file);
                }

                resolve();
            } catch (e) {
                reject('addTransactionDirectory'+e);
            }

        })




        // var list = fs.readdirSync(transDir);
        // var total = list.length;
        // if (list.length > 0) {
        //     list.forEach(function (file,i) {
        //         (function(job) {
        //             var stats = fs.statSync(transDir + '/'+ file);
        //             if (stats.isFile()) {
        //                 var Transaction = require(process.cwd()+'/'+transDir + '/'+ file);
        //                 self.addTransaction(new Transaction);
        //
        //                 if (total === (job+1)) {
        //                     callback();
        //                 }
        //             } else {
        //                 readFolder(file,function () {
        //                     if (total === (job+1)) {
        //                         callback();
        //                     }
        //                 });
        //             }
        //
        //         })(i);
        //
        //     });
        // } else {
        //     callback();
        // }


        async function readTransaction(folderName,callback) {

            return new Promise(async (resolve, reject) => {
                let subDir =  Garam.getInstance().get('appDir') +'/transactions/'+dir+'/'+folderName;
                let list = fs.readdirSync(subDir);
                let total = list.length,Transaction;

                    for await (let file of list) {
                        await (async (transFile)=>{
                            let stats = fs.statSync(subDir + '/'+ file);
                            if (stats.isFile()) {
                                Transaction = require(process.cwd()+'/'+subDir + '/'+ file);
                                let pid  = this.addTransaction(new Transaction);

                            } else {
                                reject('더이상 하위 폴더에서 프탠잭션 파일을 사용할 수 없습니다.')
                            }
                        })(file);
                    }
                resolve();


                // if (list.length > 0) {
                //     list.forEach(function (file,i) {
                //         (function(job) {
                //             var stats = fs.statSync(subDir + '/'+ file);
                //             if (stats.isFile()) {
                //                 Transaction = require(process.cwd()+'/'+subDir + '/'+ file);
                //                 self.addTransaction(new Transaction);
                //
                //             } else {
                //                 assert(0);
                //             }
                //             if (total === (job+1)) {
                //
                //                 callback();
                //
                //             }
                //         })(i);
                //
                //     });
                // } else {
                //     callback();
                // }
            });

        }

    },
    request: async function(method,url,data,headers,dataType) {
        if (!_.isObject(data)) {
            assert(0);
        }
        if (typeof headers === 'undefined') {
            headers ={'content-type':'application/json'};
        }
        if (typeof dataType === 'undefined') {
            dataType ='json';
        }
        let scope = this,qs = require('querystring').stringify(data),options={};
        method = method === undefined ? 'get' : method;
        switch(method) {
            case 'get':
                options.headers = {
                    'content-type' : 'application/x-www-form-urlencoded',
                    'Cache-Control':'no-cache'
                };
                options.url = url + '?' + qs;
                options.gzip = true;
                break;
            default :
                options.headers = {'content-type' : 'application/x-www-form-urlencoded'};
                options.url = url;
                options.body = qs;

                break;
        }

        if (typeof headers !== 'undefined') {
            for (let i in headers) {
                options.headers[i]  = headers[i];
            }
        }
        if (options.headers['content-type'] ==='application/json') {
            options.body = JSON.stringify(data);
        }



        return new Promise((resolve, reject) => {

            try {
                request[method](options, function(error, response, body) {
                    //  console.log(response)
                    if (error) {
                     //   Garam.logger().warn('Error Message:'+error);
                        throw new Error(error);
                    } else {
                        switch (dataType) {
                            case 'json':
                                try {
                                    let data = JSON.parse(body);

                                    resolve(data);
                                } catch (e) {
                                    throw new Error(e);

                                }

                                break;
                            case 'string':
                                resolve(body);
                                break;
                        }

                    }


                });
            } catch (e) {
                reject(e);
            }

        });



    }

});

Application.extend = Garam.extend;

