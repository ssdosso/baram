var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , Baram = require('../../Baram')
    , DB_driver = require('../DB_driver')
    ,MongoClient = require('mongodb').MongoClient
    , format = require('util').format
    , assert= require('assert');

exports = module.exports = Mongodb;

function Mongodb () {

//27018
};

//mongod.exe D:\work\monogoData
module.exports  = DB_driver.extend({
    create : function(config) {

        this.config = config;

    },
    connection : function() {
        var host = this.config.hostname;
        MongoClient.connect('mongodb://'+this.get('hostname')+':/'+this.get('database'), function(err, db) {

            if (err) {
                throw err;
            }

            Baram.getInstance().log.info('mongodb connect success ');

        });
    }
});