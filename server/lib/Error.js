var _ = require('underscore')
    , fs = require('fs')
    , Garam = require('./Garam')

    , Base = require('./Base')
    , HostServer = require('./rpc/host/HostServer')
    , ClientServer = require('./rpc/remote/ClientServer')
    , async = require('async')
    , io = require('socket.io')
    , domain = require('domain')
    , redis = require('socket.io-redis')
    , assert= require('assert');

exports = module.exports = Error;

function Error (mgr, name) {
    Base.prototype.constructor.apply(this,arguments);
    this.errorList = {
        SystemError:1,
        GameTypeError:2,
        ClientVersionError:3
    };
}

_.extend(Error.prototype, Base.prototype, {

    addErrorCode : function (errorName,code,msg) {

        this.errorList[errorName]= {
            code :code,
            msg :msg
        };
    },
    getErrorList : function () {
      return this.errorList;
    },
    getError : function (errorName) {
        return this.errorList[errorName] ? this.errorList[errorName] : this.errorList.SystemError;
    }


});