var _ = require('underscore')
    , fs = require('fs')
    , request = require('request')
    , winston = require('winston')
    ,Garam = require('./Garam')

    , Base = require('./Base')
    , assert= require('assert')
    , domain = require('domain')


exports= module.exports = Test;

function Test() {
    Base.prototype.constructor.apply(this,['start']);
}
_.extend(Test.prototype, Base.prototype, {



});

Test.extend = Garam.extend;

