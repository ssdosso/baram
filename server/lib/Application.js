var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , request = require('request')
    , winston = require('winston')
    ,Baram = require('./Baram')

    , Base = require('./Base')
    , assert= require('assert');


exports= module.exports = Application;

function Application() {
    Base.prototype.constructor.apply(this,['start']);
 }
_.extend(Application.prototype, Base.prototype, {
    callback : function() {},
    get : function(name) {
        return this.settings.get(name);
    },
    set : function(name,val) {
        this.settings.set(name,val)
    }

});

Application.extend = Baram.extend;

