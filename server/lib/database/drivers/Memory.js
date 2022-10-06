var _ = require('underscore')
    , Redis = sql = require('redis')
    , Backbone = require('backbone')
    , Garam = require('../../Garam')
    , DB_driver = require('../DB_driver')

    , format = require('util').format
    , assert= require('assert');




//1

var Memory = function() {

}
_.extend(Memory.prototype,{
    db : null,
    create : function (config,callback) {
        this.db =  new Backbone.Model();
        this.config  = config;
        this._data = {};
        this.db.set('_data',this._data);
        callback();
    },
    getNamespace :  function () {

    },

    get : function (key) {
        return this.db.get(key);
    },
    set : function (key,val) {
        return this.db.set(key,val);
    }

});


module.exports  = DB_driver.extend({
    conn :null,
    close : function() {

    },
    connection : function(spo_callback) {
        var self = this,conn,config;

        return  (function() {

            this.conn = (function() {

                var conn = null,config,readConn=null;


                config = {
                    database : self.get('database')
                };


                function _connection(callback) {
                    if (!conn) {
                        setTimeout(function () {
                            conn = new Memory();

                            conn.create(config,function () {

                                callback();
                            });
                        },200);

                    }


                }
                _connection(spo_callback);

                return {

                    isConn : function() {
                        return conn ? true : false;
                    },
                    close : function() {


                        conn = null;
                    },
                    query : function(query) {

                        var row = conn.get(query);
                        if (typeof row ==='undefined') {
                            return [];
                        } else {
                            if (_.isArray(row)) {
                                return row;
                            }
                            return [row];
                        }
                    },
                    getData : function(id) {
                        var _data = conn.get('_data');
                        return _data[id] ? _data[id] : null;
                    },
                    deleteData : function(id) {
                        if (typeof id=== 'undefined') {
                            assert(0);
                        }
                        var _data = conn.get('_data');
                        delete _data[id];

                    },
                    addData : function(row) {
                        if (!row._id) {
                            assert(0, 'read data._id')
                        }
                        var _data = conn.get('_data');
                        _data[row._id] = row;

                        return _data[row._id];
                    },
                    addQuery : function(query,id) {
                        if (!conn.get(query)) {
                            conn.set(query,id);
                        }

                    },
                    getConnection : function(callback) {
                        if (!conn) {
                            _connection(function(){

                                callback(false,conn,readConn);
                            });
                        } else {
                            callback(false,conn,readConn);
                        }

                    },
                    getReadConnection : function(callback) {
                        if (!readConn) {
                            callback('read connect fail');
                        } else {
                            callback(null,readConn);
                        }
                    },
                    getNamespace : function() {
                        return self.get('namespace');
                    },
                    set : function (key,value) {
                        conn.set(key,value);
                    }


                }
            })();





        }).call(this);


    },
    getAllOptions : function() {
        return    {
            server     : this.get('hostname'),
            user     : this.get('username'),
            password : this.get('password'),
            database : this.get('database'),
            port : this.get('port')
        };
    },
    /**
     * ���߿� conn �� ������ �� �� �ִ�.
     * @param procedure
     * @param InputParams
     * @param callback
     */
    execute1 : function(procedure,InputParams,outputParams,callback) {

       // this.conn.request(procedure,InputParams,outputParams,callback);
    },
    execute : function(procedure,InputParams) {
        callback('execute is not supported ');
    },

    query : function() {
        var args= [].slice.call(arguments);
        var userCallback = args.pop();
        if (typeof userCallback !== 'function') {
            assert(0);
        }
        var func = args.shift();
        var callback = function(err,res) {
            userCallback(err,res);
        }
        args.push(callback);
        this[func].apply(this,args);
    }



});

