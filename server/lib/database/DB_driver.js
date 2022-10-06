var EventEmitter = require('events').EventEmitter
    ,_ = require('underscore')
    , Garam = require('../Garam')

    , format = require('util').format
    , assert= require('assert');

exports = module.exports = DB_driver;

function DB_driver () {

}


_.extend(DB_driver.prototype, EventEmitter.prototype, {
    conn :null,
    create : function(dbConfig) {
        this.config = dbConfig;
    },
    get : function(name) {
        return this.config[name];
    },
    set : function(setting,val) {
        if (1 == arguments.length) {
            return this.config[setting];
        } else {
            this.config[setting] = val;
            return this;
        }
    },
    log  : function(){
        return Garam.getInstance().log;
    },

    connection : function() {
        return this;
    },
    query : function(queryString, callback) {
        assert(queryString);

        if (callback === undefined) {
            assert(0);
        }
    },
    close : function() {
        this.conn.end();
        // this.conn.destroy();

    }

});

DB_driver.extend = Garam.extend;