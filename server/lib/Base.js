var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Baram = require('./Baram')
    , async = require('async')
    , Event = require('./Event')
    , assert= require('assert');

exports = module.exports = Base;


function Base() {

    this.trigger = require('./triggerMethod');

}
_.extend(Base.prototype,async);
_.extend(Base.prototype, EventEmitter.prototype, {

    callParent : function(method) {
       // this.$owner[method].apply(this,arguments.callee.caller.arguments)
    },

    super : function() {

    },
    base : function() {



        //this.$owner.constructor.apply(this,arguments)
    }

});


