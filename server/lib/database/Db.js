var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Baram = require('./../Baram')

    , async = require('async')
    , assert= require('assert');

exports = module.exports = DB;

function DB (mgr, name) {
    this.trigger = require('./../triggerMethod');

    this.config = Baram.getInstance().get('db');
};


_.extend(DB.prototype, EventEmitter.prototype, {
    db: null,
    get : function(name) {
        return  this.db.get(name);
    },
    close : function() {
        this.db.close();
    },
    create : function() {
        if(!this.config.driver) {
            Baram.getInstance().log.info('db driver not find ')
        }

        this.driverName = this.config.driver;
        var Database = require('./drivers/'+this.driverName);
        this.db = new Database();
        this.db.create(this.config);

        this.db.connection();


    },
    insert : function(tableOptions,callback) {

        var userCallback = function() {},queryString,options,queries;
        var table = tableOptions.table;
        var fields = tableOptions.fields;
        var values = tableOptions.values;
        assert(table);
        assert(fields);
        assert(values)





        var query = "insert into "+table,field_str='(',values_str='VALUES(';

        for(var i = 1;i <= fields.length; i ++) {

            field_str +="`"+fields[i-1]+"`"
            if (i !== fields.length) {
                field_str +=',';
            } else {
                field_str +=')';
            }
        }



        for(var i = 1;i <= values.length; i ++) {
            values_str +="'"+values[i-1]+"'"
            if (i !== values.length) {
                values_str +=',';
            } else {
                values_str +=')';
            }
        }
        query += field_str +" "+values_str;
        this.query(query,function(err,rs){
            userCallback(err,rs);
        });

        return {
            done : function(callback) {
                if(typeof callback === 'function') {
                    userCallback = callback;
                } else {
                    assert(0);
                }
            }
        }

    }
    ,

    select: function(queryString) {
        var userCallback = function() {},queryString,options,queries;
        var args = Array.prototype.slice.apply(arguments);
        if (args.length > 1) {
            queryString = args[0];
            options = args[1];
            this.query(queryString,options,function(err,rows){
                userCallback(err,rows);
            });
        } else {
            queryString = args[0];
            this.query(queryString,function(err,rows){
                userCallback(err,rows);
            });
        }

        return {
            done : function(callback) {
                if(typeof callback === 'function') {
                    userCallback = callback;
                } else {
                    assert(0);
                }
            }
        }
    },
    query: function(queryString,callback){
        var Queries;
        assert(queryString);
        if (callback === undefined) {
            assert(0);
        }

        if(_.isArray(callback)) {
            Queries = callback;
            callback = arguments[2];
            this.db.query(queryString,Queries,callback);
        } else {
            this.db.query(queryString,callback);
        }
    }
});