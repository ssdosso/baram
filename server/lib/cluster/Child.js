var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , request = require('request')
    , winston = require('winston')
    , assert= require('assert');




/**
 * 필수   exports, 라우터 네임
 * @type {Function}
 */
exports = module.exports = ChildServer;

function ChildServer () {

}

_.extend(ChildServer.prototype,EventEmitter.prototype,{
    create : function() {
        var self = this;
        process.on('message', function(data) {
            self.onMessage(data);
        });
    } ,
    onActive: function() {
        this.sendToMaster({ev:'onWorks'});
    },
    sendToMaster: function(data){
        var packet = {
            ev :data.ev,
            args: data.args ? data.args : data
        }
        process.nextTick(function(){
            process.send(packet);
        });
    },
    send: function(data){
        var packet = {
            ev :'message',
            type:'sendMessage',
            pid :'message',
            args: data
        }
        process.nextTick(function(){
            process.send(packet);
        });
    },
    onMessage: function(packet,id) {
        packet.id = id;

        var name = (packet.ev && !packet.pid )? packet.ev : 'message';
        var params = [name].concat(packet.args,packet.id),self=this;

        process.nextTick(function(){
            self.emit.apply(self,params);
        });

    }
});