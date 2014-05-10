var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , Mysql = require('mysql')
    , Baram = require('../../Baram')
    , DB_driver = require('../DB_driver')
    //,MongoClient = require('mongodb').MongoClient
    , format = require('util').format
    , assert= require('assert');




var Mysqldb = DB_driver.extend({
    conn :null,
    connection : function() {
        var self = this;

        function handleDisconnect() {

            self.conn = Mysql.createPool({
                host     : this.get('hostname'),
                user     : this.get('username'),
                password : this.get('password'),
                database : this.get('database')
            });
            this.conn.getConnection(function(err,connection) {
                if(err)  {
                    Baram.getInstance().log.warn(err);
                }

            });

//            self.conn.connect(function(err){
//
//                if(err) {
//
//                    Mono.getInstance().log.info('error when connecting to db:', err);
//                    setTimeout(handleDisconnect.call(self), 2000);
//                }
//                Mono.getInstance().log.info('mysql connect success');
//
//            });

            self.conn.on('end', function(err) {
                console.log('mysql close');
            });

        }



        handleDisconnect.call(this);

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

exports = module.exports = Mysqldb;