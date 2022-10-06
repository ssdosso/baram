var EventEmitter = require('events').EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Garam = require('./../Garam')
    , sanitizer = require('sanitizer')
    , async = require('async')

    , assert= require('assert');

exports = module.exports = DB_Store;

function DB_Store (namespace) {
    this._sql_list = {};
    this.namespace = namespace;
}


_.extend(DB_Store.prototype, EventEmitter.prototype, {
  create : function() {

  },
  add : function(dpname,sql) {
      sql.set('namespace',this.namespace);
    this._sql_list[dpname] = sql;
  },
  get : function(dpname) {
      assert(dpname);
      return   this._sql_list[dpname];
  }
});