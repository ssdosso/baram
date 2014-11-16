var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Baram = require('./../Baram')
    , sanitizer = require('sanitizer')
    , async = require('async')
    , assert= require('assert');

exports = module.exports = DB;

function DB (mgr, name) {
    this.trigger = require('./../triggerMethod');

    if (Baram.getInstance().get('debug')) {
        console.log('debug mode start');
        this.config =Baram.getInstance().get('debug_config').db

    } else {
        this.config = Baram.getInstance().get('db');
    }

};


_.extend(DB.prototype, EventEmitter.prototype, {
    db: null,
    get : function(name) {
        return  this.db.get(name);
    },
    close : function() {
        this.db.close();
    },
    _escapeString  : function  (str) {
        return str ? str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
            switch (char) {
                case "\0":
                    return "\\0";
                case "\x08":
                    return "\\b";
                case "\x09":
                    return "\\t";
                case "\x1a":
                    return "\\z";
                case "\n":
                    return "\\n";
                case "\r":
                    return "\\r";
                case "\"":
                case "'":
                case "\\":
                case "%":
                    return "\\"+char; // prepends a backslash to backslash, percent,

            }
        }):null;
    },

    update : function(tableOptions,callback) {
        var userCallback = function() {},queryString,options,queries;
        var table = tableOptions.table;
        var fields = tableOptions.fields;
        var values = tableOptions.values;
        var where = tableOptions.where;
        assert(table);
        assert(fields);
        assert(values);
        assert(where);


        //UPDATE `db_zaiseoul`.`members` SET `name`='1111 1112' WHERE `id`='15224';
        var query = "UPDATE "+table+' SET',field_str='';
        for(var i = 1;i <= fields.length; i ++) {

            field_str +="`"+fields[i-1]+"`='"+sanitizer.escape(values[i-1])+"'";
            if (i !== fields.length) {
                field_str +=',';
            }
        }
        query += field_str +" WHERE "+where;
        console.log(query)
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
            values_str +="'"+sanitizer.escape(values[i-1])+"'"
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

    },
    create : function() {
        if(!this.config.driver) {
            Baram.getInstance().log.info('db driver not find ')
        }
        //this.settingModel.get('debug')

        this.driverName = this.config.driver;
        var Database = require('./drivers/'+this.driverName);
        this.db = new Database();
        this.db.create(this.config);

        this.db.connection();


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