var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Baram = require('./Baram')
    , AWS = require('aws-sdk')
    , async = require('async')
    , assert= require('assert');

exports = module.exports = Transport;

function Transport (mgr, name) {
    this.trigger = require('./triggerMethod');

};

_.extend(Transport.prototype, EventEmitter.prototype, {
    create : function(options) {

    }
});