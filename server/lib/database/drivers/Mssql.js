var _ = require('underscore')
    , Mssql = sql = require('mssql')
    , Garam = require('../../Garam')
    , DB_driver = require('../DB_driver')

    , format = require('util').format
    , assert= require('assert');



//1
module.exports  = DB_driver.extend({
    conn :null,
    close : function() {
        var conn = this.conn.isConn();
        if (conn) {
            this.conn.close();
        }
    },
    connection : function(spo_callback) {

        var self = this,conn,config;
        var _dataType = {
            'bit':sql.Bit,
            'int':sql.Int,
            'bigint':sql.BigInt,
            'money':sql.Money,
            'numeric':sql.Numeric,
            'smallint':sql.SmallInt,
            'smallmoney':sql.SmallMoney,
            'real':sql.Real,
            'tinyint':sql.TinyInt,
            'char':sql.Char,
            'nchar':sql.NChar,
            'text':sql.Text,
            'varchar':sql.VarChar,
            'nvarchar':sql.NVarChar,
            'xml':sql.Xml,
            'time':sql.Time,
            'date':sql.Date,
            'dateTime':sql.DateTime,
            'dateTime2':sql.DateTime2,
            'dateTimeOffset':sql.DateTimeOffset,
            'smallDateTime':sql.SmallDateTime,
            'uniqueIdentifier':sql.UniqueIdentifier,
            'binary':sql.Binary,
            'varBinary':sql.VarBinary,
            'image':sql.Image,
            'UDT':sql.UDT,
            'geography':sql.Geography,
            'geometry':sql.Geometry
        }


        return  (function() {

                this.conn = (function() {
                    var conn = null,config,maxConnection =30,targetCon=0;
                    config = {
                        server: self.get('hostname'),
                        user: self.get('username'),
                        password: self.get('password'),
                        database: self.get('database')

                    };

                    if(self.get('Azure')) {
                        config.options = {
                            encrypt: true
                        };
                    } else {
                        config.port = self.get('port');
                        config.options = {
                            useUTC: false
                        };
                    }

                    if (self.get('pool')) {
                        config.pool = self.get('pool');
                    }

                    var types = {
                        'int': Mssql.Int
                    };

                    function _connection(callback) {

                            if (!conn) {
                                conn = new Mssql.Connection(config, function (err) {
                                    if (err) {
                                        Garam.logger().warn(self.get('namespace'),err);
                                    }
                                    conn.on('close',function (err) {
                                        Garam.logger().error('close mssql database',self.get('hostname'));
                                    });
                                    if (typeof callback === 'function') {
                                        callback();
                                    }

                                });
                            }
                    }

                    _connection(spo_callback);

                    function getConn() {
                        targetCon++;

                        if (targetCon < maxConnection  ) {
                            return  conn[targetCon];
                        } else {
                            targetCon = 0;
                            return  conn[targetCon];
                        }
                    }
                    return {
                        getDataType : function() {
                          return   _dataType;
                        },
                        request : function(procedure,InputParams,outputParams,callback) {

                            process.nextTick(_execute);
                            function _execute() {
                             //   var connection = getConn();
                                var request = new Mssql.Request(getConn());
                                // request.stream  =true;
                                for (var i in InputParams) {
                                    var inputData = InputParams[i];
                                    assert(inputData.name);
                                    request.input(inputData.name,typeof(inputData.length === 'undefined') ? _dataType[inputData.type] :_dataType[inputData.type](inputData.length) );
                                    // request.input(inputData.name,sql.VarChar(20) );
                                }
                                for (var i in outputParams) {
                                    var outputData = outputParams[i];
                                    request.output(outputData.name, typeof(outputData.length === 'undefined') ? _dataType[outputData.type] :_dataType[outputData.type](outputData.length) );
                                }
                                //
                                request.execute(procedure, function(err, recordsets, returnValue) {

                                    if (err) {
                                        Garam.Logger().warn(err);
                                        return;
                                    }
                                    callback(recordsets,returnValue);

                                });
                            }





                        },
                        isConn : function() {
                            return conn ? true : false;
                        },
                        close : function() {
                            conn.close();
                            delete conn;
                            conn = null;
                        },
                        getConnection : function(callback) {
                            if (!conn) {
                                _connection(function(){

                                    callback(false,conn);
                                });
                            } else {
                                if (self.get('connLimit')) {
                                    var target = Math.floor(Math.random() * self.get('connLimit'));
                                    callback(false,conn[target]);
                                } else {
                                    callback(false,conn);
                                }

                            }

                        }
                    }
                })();





        }).call(this);


    },
    /**
     * ���߿� conn �� ������ �� �� �ִ�.
     * @param procedure
     * @param InputParams
     * @param callback
     */
    execute1 : function(procedure,InputParams,outputParams,callback) {

            this.conn.request(procedure,InputParams,outputParams,callback);
    },
    execute : function(procedure,InputParams) {
        var args = Array.prototype.slice.call(arguments),callback,outputParams=[],params;

        if (!procedure) {
            callback('This procedure is required ');
        }
        if (_.isEmpty(InputParams)) {
            params = [];
        }
        if (!_.isArray(InputParams)) {
            callback('procedure :' +procedure +': array format only');
            return;
        }

        if (args[2] && _.isFunction(args[2])) {
            callback = args[2];
        } else {
            outputParams =  args[2];
            if (!_.isArray(outputParams)) {
                callback('procedure :' +procedure +':outParams , array format only');
                return;
            }
            if ( _.isFunction(args[3])) {
                callback = args[3];
            }

        }



        this.conn.request(procedure,InputParams,outputParams,function(err,rs){
            callback(err,rs);
        });
    },
    query : function(queryString, callback) {
        assert(queryString);
        var Queries;
        if (callback === undefined) {
            assert(0);
        }
        if(_.isArray(callback)) {
            Queries = callback;
            callback = arguments[2];
            this.conn.getConnection(function(err,connection) {
                if(err)  {
                    Garam.getInstance().log.warn(err);
                }
                connection.query(queryString, Queries, function(err, rows) {
                    callback(err,rows);
                    if (typeof connection.release === 'function' ) {
                        connection.release();
                    }
                });
            });
        } else {
            this.conn.getConnection(function(err,connection) {
                if(err)  {
                    Garam.getInstance().log.warn(err);
                }

                connection.query( queryString, function(err, rows) {
                    callback(err,rows);
                    if (typeof connection.release === 'function' ) {
                        connection.release();
                    }

                });
            });
        }



    }


});

