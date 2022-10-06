var Backbone = require('backbone')
    , _ = require('underscore')
   
    , Garam = require('./Garam')

    , Base = require('./Base')
    , assert = require('assert')

    , async = require('async');


var BaseTransaction = function() {
    this._error = {
        SystemError : 1, //정상적인 시스템 이라면 나올 수 없는 경우
        DatabaseError:2,
        NotLoginError : 6,//: Login 하지 않은 유저
        PacketDataTypeError : 5,
        InvalidActionReq : 7,
        NotFoundRoom:8,
        InvalidError:9
    }
}
module.exports =  BaseTransaction;
_.extend(BaseTransaction.prototype, Base.prototype, {

    _parentController : function(ctl) {
        this._controller = ctl;
    },
    getCtl : function() {
        return this._controller;
    },
    create : function() {


    },
    send : function() {

    },
    removeEvent : function(user) {
        if (typeof user !== 'undefined') {
            user.removeAllListeners([this.pid]);
        }
    },

    createPacket : function (data,targetPid) {

        if (typeof data === 'undefined') {
            data = {};
        }
        let packet = this.getPacket();

        for(let i in packet) {

            if (data[i] || data[i] === false) {
                packet[i] = data[i];
            }

        }
        if (typeof packet.pid ==='undefined') {
            packet.pid = this.pid;
        }
        if (typeof targetPid !== 'undefined') {
            packet.pid = targetPid;
        }


        return packet;
    },
    getPacket : function() {
        if (!this._packet) {
            assert(0);
        }
        return _.clone(this._packet);
    },
    getPacketClient : function (data,pid) {
        if (typeof data === 'undefined') {
            data = {};
        }
        var targetPid =  this.pid;
        if (typeof pid !== 'undefined') {
            targetPid = pid;
        }
        var packet = this.getPacket();

        for(var i in packet) {

            if (data[i] || data[i] === false) {
                packet[i] = data[i];
            }

        }


        delete packet.pid;
        return {
            pid : targetPid,
            data : packet
        };
    },
    isInvalidPacket:function(data,ignorParam) {

        if (typeof data ==='undefined') {
            return true;
        }
        var fotmat = this._packet.data;

        for (var m in fotmat) {

            if (typeof data[m] === 'undefined' && ignorParam != m) {
                return true;
            }
        }
        return false;
    },
    isTypeEquals:function (lhs, rhs) {


        if (_.isArray(lhs)) {
            return _.isArray(rhs);
        }
        if (_.isBoolean(lhs)) {
            return _.isBoolean(rhs);
        }
        if (_.isDate(lhs)) {
            return _.isDate(rhs);
        }
        if (_.isNumber(lhs)) {
            return _.isNumber(rhs);
        }
        if (_.isString(lhs)) {
            return _.isString(rhs);
        }
        if (_.isObject(lhs)) {
            return _.isObject(rhs);
        }
        if (_.isFunction(lhs)) {
            return _.isFunction(rhs);
        }
        return false;
    },

    /**
     * 현재 설정된 packet 값의 필드 에 값이 있으면  merge
     * @param data
     * @returns Object
     */
    addPacket : function(data) {
        if (typeof data === 'undefined') {
            data = {};
        }
        var packet = this.getPacket();

        for(var i in packet) {

            if (data[i] || data[i] === false) {
                packet[i] = data[i];
            }

        }
        if (typeof packet.pid ==='undefined') {
            packet.pid = this.pid;
        }
        return packet;
    },
    sendError : function (message,code,data) {
        
        if (typeof code ==='undefined') {
            code = this._error.SystemError;
        }
        return  {
            pid :'error',
            message :message,
            code:code,
            msgData : JSON.stringify(data)
        }
    }
});


BaseTransaction.extend = Garam.extend;