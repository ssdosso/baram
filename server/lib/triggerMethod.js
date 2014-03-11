var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , assert= require('assert');

exports =  module.exports  = triggerMethod;

 function triggerMethod(){
    var args = Array.prototype.slice.apply(arguments);
    var eventName = args[0];
    var segments = eventName.split(":");
    var segment, capLetter, methodName = "on";

    for (var i = 0; i < segments.length; i++){
        segment = segments[i];
        capLetter = segment.charAt(0).toUpperCase();
        methodName += capLetter + segment.slice(1);
    }

    this.emit.apply(this, args);

    if (_.isFunction(this[methodName])){
        args.shift();
        return this[methodName].apply(this, args);
    }
};
