var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , Mono = require('../Mono')
    ,MongoClient = require('mongodb').MongoClient
    , format = require('util').format
    , assert= require('assert');

exports = module.exports = Mongodb;

function Mongodb () {

//27018
};


_.extend(Mongodb.prototype, EventEmitter.prototype, {
    create : function(config) {

        this.config = config;

    },
    connection : function() {
        var host = this.config.hostname;
        MongoClient.connect('mongodb://'+host+':27018/test', function(err, db) {
//            console.log(err)
//            console.log(db)
        });
    }
});