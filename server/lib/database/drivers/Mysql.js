var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , Mysql = require('mysql')
    , Baram = require('../../Baram')
    , DB_driver = require('../DB_driver')
//,MongoClient = require('mongodb').MongoClient
    , format = require('util').format
    , assert= require('assert');




module.exports  = DB_driver.extend({
    conn :null,
    close : function() {
        var conn = this.conn.isConn();
        if (conn) {
            this.conn.close();
        }
    },
    connection : function() {
        var self = this;

        return  (function() {

            if (this.get('pool') === true) {
                self.conn = Mysql.createPool({
                    host     : this.get('hostname'),
                    user     : this.get('username'),
                    password : this.get('password'),
                    database : this.get('database')
                });

                self.conn.on('end', function(err) {
                    console.log('mysql close');
                });
            } else {

                this.conn = (function(){
                    var conn = null;
                    return {
                        isConn : function() {
                            return conn ? true : false;
                        },
                        close : function() {
                            conn.end();
                            delete conn;
                            conn = null;
                        },
                        getConnection : function(callback) {
                            if (!conn) {
                                console.log('없음');
                                conn = Mysql.createConnection({
                                    host     : self.get('hostname'),
                                    user     : self.get('username'),
                                    password : self.get('password'),
                                    database : self.get('database')
                                });

                                conn.connect(function(err) {
                                    if (err) {
                                        switch(err.code) {
                                            case 'ER_BAD_DB_ERROR':
                                                console.log('ER_BAD_DB_ERROR: Unknown database')
                                                break;
                                            case 'ER_ACCESS_DENIED_ERROR':
                                                console.log(' ER_ACCESS_DENIED_ERROR: Access denied for user ')
                                                break;
                                            default :
                                                console.error('error connecting: ' + err.stack);
                                                break;
                                        }
                                        callback(err);

                                        return;
                                    }
                                    callback(false,conn);
                                    console.log('connected as id ' + conn.threadId);
                                });
                            } else {
                                callback(false,conn);
                            }

                        }
                    }
                })();


            }


        }).call(this);


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
                    Baram.getInstance().log.warn(err);
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
                    Baram.getInstance().log.warn(err);
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

