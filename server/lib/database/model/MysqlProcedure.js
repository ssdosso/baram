var EventEmitter = require('events').EventEmitter
    ,_ = require('underscore')
    , Garam = require('../../Garam')
    , Backbone = require('backbone')
    , Mssql  = require('mssql')
    , format = require('util').format
    , assert= require('assert');

exports = module.exports = DB_SQL;




function DB_SQL () {
    this._query = '';
    this._ready = false;
    this._stream = false;
    this._connectError = false;
    this._input = {};
    this._output = {};
    this._model =  new Backbone.Collection();
    this._dataType = {
        'int':0,
        'bigint':null,
        'money':null,
        'numeric':null,
        'smallint':null,
        'smallmoney':null,
        'real':null,
        'tinyint':null,
        'char':null,
        'nchar':null,
        'text':null,
        'varchar':null,
        'nvarchar':null,
        'xml':null,
        'time':null,
        'date':null,
        'dateTime':null,
        'dateTime2':null,
        'dateTimeOffset':null,
        'smallDateTime':null,
        'uniqueIdentifier':null,
        'binary':null,
        'varBinary':null,
        'image':null,
        'UDT':null,
        'geography':null,
        'geometry':null,
    }

    this._job =[];
    this._currentDebug =0;
}


_.extend(DB_SQL.prototype, EventEmitter.prototype, {
    create : async function() {},
    run : function() {

    },
    set : function(key,name){
        this[key] = name;
    } ,
    isReady: function() {
        return this._ready;
    },
    setReady : function() {
        this._ready = true;
    },
    isConnectError : function () {
        return this._connectError;
    },
    unsetConnectError : function () {
        this._connectError = false;
    },
    setConnectError : function () {
        this._connectError = true;
    },
    setStream : function(stream) {
        this._stream = true;
    },
    isStream : function() {
        return this._stream;
    },
    addField : function(field) {
        assert(field.name);
        assert(field.type);
        assert(typeof field.defaultVal  ==='undefined' ? 0 : true);
        this._input[field.name] = field;
    },
    addOutput : function(output) {

        assert(output.name);
        assert(output.type);

        this._output[output.name] = output;
    },
    setDP : function(dp) {
        this._dp = dp;
    },
    /**
     * 기본 테이블을 저장한다.
     */
    setTableName : function (table) {
        this._table = table;
    },
    setQuery : function(query) {
        this._query = query;
    },
    getQuery : function() {
        return this._query;
    },
    getProcedure : function() {
        return this._dp;
    },
    setParameter : function(data) {
        this.setData = false;
    },
    getDefaultParam : function () {

    },
    addParam : function (data) {
        if (typeof data === 'undefined') {
            data = {};
        }
        var packet = this.getPacket();

        for(var i in packet) {

            if (data[i] || data[i] === false) {
                packet[i] = data[i];
            }

        }
        if (typeof packet.pid ==='undefined') {
            packet.pid = this.pid;
        }
        return packet;
    },
    addData : function(data) {
        // console.log(data)
        var self = this;
        if (_.isArray(data)) {
            _.each(data,function(row){

                self._model.add(row);
            });
        }
        // this._model.add({});
    },
    getModel : function() {
        return this._model;
    },
    getTransactionConnection :  function () {
        let self = this,write=true;
        return new Promise(function(resolved,rejected){


            Garam.getDB(self.namespace).connection().getWriteConnection(function(err,conn) {
                if (err) {

                    return rejected(err);

                }


                if (self.isConnectError() || err == null) {

                    self.unsetConnectError();
                }

                return resolved(conn);

            },write);
        });

    },
    getConnection :  function (mode) {
        let self = this;
        return new Promise(function(resolved,rejected){


            Garam.getDB(self.namespace).connection().getConnection(function(err,conn) {
                if (err) {
                    return rejected(err);
                }


                if (self.isConnectError() || err == null) {
                    self.unsetConnectError();
                }

                return resolved(conn);

            },mode);
        });

    },
    commit : async function (connection) {
        return new Promise((resolved,rejected)=>{


            connection.commit(function(err) {
                if (err) {
                    connection.rollback(function() {
                        rejected(err);
                    });
                } else {
                  //  console.log('# connection.__currentJob', connection.__currentJob)
                  //  delete connection.__currentJob;

                    if (typeof connection._job !== "undefined" && typeof connection._job[connection.threadId] !== "undefined") {

                        delete connection._job[connection.threadId];
                    }


                    connection.release();
                    // connection.release();
                    resolved();
                }

            });
        });

    },
    beginTransaction : async function() {
        let transMode = 2;

        function makeid() {
            var text = "";
            var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

            for (var i = 0; i < 8; i++) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            //  text = '_'+text;

            return text;
        }

        return new Promise(async (resolved,rejected)=> {
            this.getTransactionConnection(transMode)
                .then((connection) => {
                    if (Garam.getDB(this.namespace).connection().isDebug() ===true) {

                        let currentJob = makeid();
                        if (typeof connection._job === 'undefined') {

                            connection._job = {};
                            connection._jobquery ={};
                        }
                        connection._job[connection.threadId]= currentJob;
                        connection._jobquery[connection.threadId] =[];
                        // let jobIndex =  connection._job.length-1;
                       //

                    }
                    setTimeout(()=>{

                        if (typeof connection._job !== "undefined" && typeof connection._job[connection.threadId]  !== 'undefined') {
                            Garam.logger().error(connection._jobquery[connection.threadId])
                            assert(0,'Error Mysql Transaction');
                        }
                    },1000*5);

                    connection.beginTransaction(async (error) => {
                        if (error) {
                            return connection.rollback(function() {
                                throw error;
                            });
                        } else {


                            resolved(connection);

                        }
                    });
                })
                .catch((err)=>{

                    rejected(err);
                });

        });
    },
    rollback : async function (connection) {
        return new Promise((resolved,rejected)=>{

            if (typeof connection._job !== "undefined" && typeof connection._job[connection.threadId] !== "undefined") {

                delete connection._job[connection.threadId];
            }

            connection.rollback(function(err) {

                connection.release();
                if (err) {
                    rejected(err);
                } else {
                    resolved();
                }



            });
        });

    },

    /**
     *   connection.release(); 를 반드시 별도로 해줘야 한다.
     * @param connection
     * @param query
     * @param params
     * @returns {Promise<unknown>}
     */
    queryAsync : async function (connection,query,params,mode,debug) {
        let self = this;


        return new Promise((resolved,rejected)=>{

            let q;

            if (Garam.getDB(this.namespace).connection().isDebug() ===true) {
                connection._jobquery[connection.threadId].push(query);
            }
             q =  connection.query(query, params, function (error, results, fields) {
                //

                if (debug) {
                    Garam.logger().info(q.sql)
                }

                if (error) {
                    Garam.logger().error('mysql errorNo:',error.errno);
                    Garam.logger().error('mysql code:',error.code);
                    Garam.logger().error('mysql syscall:',error.code);
                    Garam.logger().error(q.sql)
                    Garam.logger().error(self.namespace,self.dpname,'mysql sqlMessage:',error.sqlMessage);
                    rejected(error);
                } else {
                    resolved(results);
                }



            });
        });


    } ,
    executeAsync : async function(query,params,mode,debug) {
        let self = this;
        if (typeof mode ==='undefined') mode = 1;
        return new Promise((resolved,rejected)=>{

            if (!_.isArray(params)) {
                rejected('invalid array type');
            } else {

                self.getConnection(mode)
                    .then(function(connection){


                        let q = connection.query(query, params, function (error, results, fields) {
                            connection.release();
                            if(error) {
                                Garam.logger().error('mysql errorNo:',error.errno);
                                Garam.logger().error('mysql code:',error.code);
                                Garam.logger().error('mysql syscall:',error.code);
                                Garam.logger().error(q.sql)
                                Garam.logger().error(self.dpname,'mysql sqlMessage:',error.sqlMessage);
                                return rejected('mysqlError code:'+error.code);
                            } else {
                                resolved(results)
                            }

                        });

                        if(debug) console.log(q.sql);
                    })
                    .catch(function(err){

                        if (err.errno ===-4078) {

                            Garam.logger().error('mysql connect error');
                            self.setConnectError();
                        }
                        Garam.logger().error('mysql errorNo',err.errno);
                        Garam.logger().error('mysql code',err.code);
                        Garam.logger().error('mysql syscall',err.code);
                        rejected('mysqlError code',err.code,query);
                    })
            }


        });
    },
    execute :  function(query,parmas,mode,debug) {

        let self = this;
        return new Promise(function(resolved,rejected){
            if (!_.isArray(parmas)) {
                return rejected('invalid array type');
            }
            self.getConnection(mode)
                .then(function(connection){

                    let q = connection.query(query, parmas, function (error, results, fields) {
                        connection.release();
                        if(error) {
                            Garam.logger().error(query);
                            Garam.logger().error(q.sql);
                            Garam.logger().error('db ',self.namespace,'error:',query);
                            return rejected(error);
                        }

                        resolved(results)

                    });

                    if(debug) console.log(q.sql);
                })
                .catch(function(err){
                    Garam.logger().error('db error',self.namespace,query);
                    rejected(err);
                })

        });



    }


});

DB_SQL.extend = Garam.extend;