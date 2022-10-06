var _ = require('underscore')
    , fs = require('fs')
    , Garam = require('./Garam')
    , Base = require('./Base')
    , domain = require('domain')
    , redis = require('socket.io-redis')
    , assert= require('assert');

exports = module.exports = SessionManager;

var size = function(obj) {
    var count = 0;
    for (var i in obj) {
        if (obj.hasOwnProperty(i) && typeof obj[i] !== 'function') {
            count++;
        }
    }
    return count;
};

function SessionManager (mgr, name) {
    Base.prototype.constructor.apply(this,arguments);
    this.sessions = {};     // sid -> session
    this.uidMap = {};       // uid -> sessions
}

_.extend(SessionManager.prototype, Base.prototype, {
    create : function(sid,  socket) {
        var session = new Session(sid, socket, this);
        this.sessions[session.id] = session;
        return session;
    },
    bind : function() {

    },
    unbind : function() {

    },
    remove : function() {

    },
    getSessionsCount : function() {
        return size(this.sessions);
    },
    get : function(id) {
        return this.sessions[id]
    },
    kick : function() {

    }

});


function Session(sid, socket,manager) {
    this.id = sid;          // r
    this.uid = null;        // r
    this.settings = {};


    this.__socket__ = socket;
    this.__sessionService__ = manager;
}

_.extend(Session.prototype,Base.prototype,{
    set : function(key,value) {
        if (_.isObject(key)) {
            for (var i in key) {
                this.settings[i] = key[i];
            }
        } else {
            this.settings[key] = value;
        }
    },
    get : function(key) {
        return this.settings[key];l
    },
    remove : function(key){
        delete this[key];
    }
});

Session.extend = Garam.extend;