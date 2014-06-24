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

               this.conn = Mysql.createConnection({
                   host     : this.get('hostname'),
                   user     : this.get('username'),
                   password : this.get('password'),
                   database : this.get('database')
                });

                this.conn.connect(function(err) {

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
                    }





                    console.log('connected as id ' + self.conn.threadId);
                })

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
                    Mono.getInstance().log.warn(err);
                }
                connection.query(queryString, Queries, function(err, rows) {
                    callback(err,rows);
                    connection.release();
                });
            });
        } else {
            this.conn.getConnection(function(err,connection) {
                if(err)  {
                    Mono.getInstance().log.warn(err);
                }
                connection.query( queryString, function(err, rows) {
                    callback(err,rows);
                    connection.release();
                });
            });
        }



    },
    close : function() {
        this.conn.end();
        // this.conn.destroy();

    }

});
//_.extend(Mysqldb.prototype, EventEmitter.prototype, {
//    conn :null,
//    create : function(dbConfig) {
//        this.config = dbConfig;
//    },
//    log  : function(){
//       return Baram.getInstance().log;
//    },
//    /**
//     * 서버가 실행될때 테스트
//     */
//    connection : function() {
//        var self = this;
//
//        function handleDisconnect() {
//
//            self.conn = Mysql.createPool({
//                host     : this.config.hostname,
//                user     : this.config.username,
//                password : this.config.password,
//                database : this.config.database
//            });
//
////            self.conn.connect(function(err){
////
////                if(err) {
////
////                    Mono.getInstance().log.info('error when connecting to db:', err);
////                    setTimeout(handleDisconnect.call(self), 2000);
////                }
////                Mono.getInstance().log.info('mysql connect success');
////
////            });
//
//            self.conn.on('end', function(err) {
//              console.log('mysql close');
//            });
//
//        }
//
//
//
//        handleDisconnect.call(this);
//
//    },
//    query : function(queryString, callback) {
//        assert(queryString);
//        var Queries;
//        if (callback === undefined) {
//            assert(0);
//        }
//        if(_.isArray(callback)) {
//            Queries = callback;
//            callback = arguments[2];
//            this.conn.getConnection(function(err,connection) {
//                if(err)  {
//                    Mono.getInstance().log.warn(err);
//                }
//                connection.query(queryString, Queries, function(err, rows) {
//                    callback(err,rows);
//                    connection.release();
//                });
//            });
//        } else {
//            this.conn.getConnection(function(err,connection) {
//                if(err)  {
//                    Mono.getInstance().log.warn(err);
//                }
//                connection.query( queryString, function(err, rows) {
//                    callback(err,rows);
//                    connection.release();
//                });
//            });
//        }
//
//
//
//    },
//    close : function() {
//        this.conn.end();
//       // this.conn.destroy();
//
//    }
//
//});

