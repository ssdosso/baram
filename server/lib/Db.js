var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Baram = require('./Baram')

    , async = require('async')
    , assert= require('assert');

exports = module.exports = DB;

function DB (mgr, name) {
    this.trigger = require('./triggerMethod');

    this.config = Baram.getInstance().get('db');
};


_.extend(DB.prototype, EventEmitter.prototype, {
    db: null,
    create : function() {
        if(!this.config.dbdriver) {
            Mono.getInstance().log.info('db driver not find ')
        }

        this.driverName = this.config.dbdriver;
        var Database = require('./drivers/'+this.driverName);
        this.db = new Database();
        this.db.create(this.config);

        this.db.connection();


    }
    ,
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