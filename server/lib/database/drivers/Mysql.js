var _ = require('underscore')
    , Mysql = require('mysql')
    , Garam = require('../../Garam')
    , DB_driver = require('../DB_driver')
//,MongoClient = require('mongodb').MongoClient
    , format = require('util').format
    , assert= require('assert');

const ConnectionLimit = 10;

//1

module.exports  = DB_driver.extend({
    conn :null,
    close : function() {
        let conn = this.conn.isConn();
        if (conn) {
            this.conn.close();
        }
    },

    connectionAsync :async  function () {
        let self = this,conn,config;
        return new Promise((resolved,rejected)=>{
            resolved(0);
        });
    },
    connection : function(callback) {

        let self = this,conn,write_conn,read_conn,replica=false,debug=false;

        return  (function() {
            this.conn = (function() {

                 conn = null;
                 let cluster=false,clusterInfo,connectList=[];
                debug =self.get('debug')
                function _connection() {
                    if (!conn) {

                        if (self.get('replica')) {
                            replica = true;
                            let wOptions = self.get('replica').write;
                            let rOptions = self.get('replica').read;

                            conn =  true;

                              (function (){
                                write_conn =  Mysql.createPool({
                                    connectionLimit : wOptions.poolLimit,
                                    host     : wOptions.hostname,
                                    port     : wOptions.port,
                                    user     : wOptions.username,
                                    password : wOptions.password,
                                    database : wOptions.database,
                                    supportBigNumbers :true
                                    // bigNumberStrings : true
                                });

                                  write_conn.getConnection(function(err, connection) {
                                      // connected! (unless `err` is set)
                                      if (err) {
                                          Garam.logger().error('Mysql Connect Error : ',err);
                                      }
                                      Garam.logger().info('mysql write conn',wOptions.hostname,'replica',replica);

                                      connectList.push(1);
                                      _next(err,'write',connection);
                                  });
                            })();


                            (function (){
                                read_conn =  Mysql.createPool({
                                    connectionLimit :  rOptions.poolLimit,
                                    host     : rOptions.hostname,
                                    port     : rOptions.port,
                                    user     : rOptions.username,
                                    password : rOptions.password,
                                    database : rOptions.database,
                                    supportBigNumbers :true
                                    // bigNumberStrings : true
                                });


                                read_conn.getConnection(function(err, connection) {
                                    // connected! (unless `err` is set)
                                    if (err) {
                                        Garam.logger().error('Mysql Connect Error : ',err);
                                    }
                                    Garam.logger().info('mysql read conn',rOptions.hostname,'replica',replica);

                                    connectList.push(1);
                                    _next(err,'read',connection);
                                });
                            })();



                            function _next(err,type,connection) {

                                    if (connectList.length ===2) {
                                        callback(err);
                                    }

                            }

                        } else {
                            conn =   Mysql.createPool({
                                connectionLimit : ConnectionLimit,
                                host     : self.get('hostname'),
                                port      : self.get('port'),
                                user     : self.get('username'),
                                password : self.get('password'),
                                database : self.get('database'),
                                supportBigNumbers :true
                                // bigNumberStrings : true
                            });
                            conn.getConnection(function(err, connection) {
                                // connected! (unless `err` is set)
                                if (err) {
                                    Garam.logger().error('Mysql Connect Error : ',err);
                                }

                                if (typeof callback !== 'undefined') {
                                    callback(err, connection);
                                }
                            });
                        }


                    }
                }

                _connection.call(this);


                return {

                    isDebug : function () {
                        return debug;
                    },
                    isConn : function() {
                        return conn ? true : false;
                    },
                    close : function() {
                        conn.close();
                        delete conn;
                        conn = null;
                    },
                    getConnection : function(callback,mode) {
                        if (!replica) {
                            if (!conn) {
                                _connection(function(){
                                    callback(false,conn);
                                });
                            } else {
                                conn.getConnection(function(err, connection) {
                                    callback(err, connection);
                                });
                            }
                        } else {
                            if (!conn) {
                                _connection(function(){
                                    if (mode ===1 || mode ===false) {
                                        read_conn.getConnection(function(err, connection) {
                                            callback(err, connection);
                                        });
                                    } else {
                                        write_conn.getConnection(function(err, connection) {
                                            callback(err, connection);
                                        });
                                    }
                                });
                            } else {
                                if (mode ===1 || mode ===false) {
                                    read_conn.getConnection(function(err, connection) {
                                        callback(err, connection);
                                    });
                                } else {
                                    write_conn.getConnection(function(err, connection) {
                                        callback(err, connection);
                                    });
                                }

                            }
                        }


                    },
                    getWriteConnection : function(callback,mode) {
                        if (!conn) {
                            _connection(function(){
                                write_conn.getConnection(function(err, connection) {
                                    callback(err, connection);
                                });
                            });
                        } else {
                            if (!replica) {
                                conn.getConnection(function(err, connection) {
                                    callback(err, connection);
                                });
                            } else {
                                write_conn.getConnection(function(err, connection) {
                                    callback(err, connection);
                                });
                            }

                        }

                    }
                }
            })();

        }).call(this);


    }


});

