var _ = require('underscore')
    , fs = require('fs')
    , Garam = require('./Garam')
    , Cluster = require('cluster')
    , winston = require('winston')
    , Base = require('./Base')
    , moment = require('moment')
    , assert= require('assert');



exports = module.exports = Web;


function Web(mgr, name){
    Base.prototype.constructor.apply(this, arguments);
}

_.extend(Web.prototype, Base.prototype, {
   init : function () {
       
   },
    configure : function (callback) {
        if (typeof callback ==='function') {
            callback();
        }
    },
    use : function () {
        
    },
    set : function () {
        
    },
    get : function () {

        (function () {
            var path = arguments[0],callback=arguments[1];

            this.on('GET:'+path,callback);

        }).apply(this,arguments);
    },
    post : function () {
        
        (function () {
            var path = arguments[0],callback=arguments[1];
            
            this.on('POST:'+path,callback);

        }).apply(this,arguments);
    }
});