var _ = require('underscore')
    , fs = require('fs')
    , request = require('request')
    , winston = require('winston')
    ,Garam = require('./Garam')
    , Base = require('./Base')
    , rawBodyParser = require('raw-body-parser')
    , assert= require('assert')
    , express = require('express');

exports= module.exports = Router;
function Router (mgr, name) {

    this.base();
}


_.extend(Router.prototype, Base.prototype, {
    init : function(app,webManager) {
        this.app = app;
        this.app.use(express.static('../public'))
        this.webManager = webManager;
        this.start();
    },

    getClientAddress : function (req) {
        return (req.headers['x-forwarded-for'] || '').split(',')[0]
            || req.connection.remoteAddress;
    },
    getController: function(controllerName) {
        assert(controllerName);
        controllerName = controllerName.toLowerCase();
        return Garam.getInstance().getController(controllerName)
    },

    end : function(req,res,variables,mode) {

        if (_.isNumber(variables)) {
            res.send(variables);
            return;
        }
        if (!_.isObject(variables)) variables = {};
        //TODO session info
        var userData = {};

        variables = _.extend(variables,userData,{
            production :process.env['NODE_ENV'] == 'development' ? 'false' : 'true'
        });
        if (variables.layout)
        {
            this.render(res,req,variables);
        }

    },
    getParams : function (req) {
        let body = req.body || req.query;
        return {

            get : (name) => {
                if (typeof body[name] ==='undefined') {
                    return false;
                }

                return body[name];
            }
        }
    },
    get : function() {
        let self = this,path,callback,parser;
        let args= [].slice.call(arguments),next;

        path = args.shift();
        callback = args.pop();
        if (args.length ===0) {
            this.app.get(path,function(){
                callback.apply(self,arguments);
            });
        } else {

            next = args.shift();
            this.app.get(path,next,function(){
                callback.apply(self,arguments);
            });

        }
    },

    del : function() {
        let self = this,path,callback,parser;
        let args= [].slice.call(arguments),next;

        path = args.shift();
        callback = args.pop();
        if (args.length ===0) {
            this.app.del(path,function(){
                callback.apply(self,arguments);
            });
        } else {
            next = args.shift();
            this.app.del(path,next,function(){
                callback.apply(self,arguments);
            });
        }
    },

    put : function() {
        let self = this,path,callback,parser;
        let args= [].slice.call(arguments),next;

        path = args.shift();
        callback = args.pop();
        if (args.length ===0) {
            this.app.put(path,function(){
                callback.apply(self,arguments);
            });
        } else {
            next = args.shift();
            this.app.put(path,next,function(){
                callback.apply(self,arguments);
            });
        }
    },
    post : function() {
        let self = this,path,callback,parser;
        let args= [].slice.call(arguments),next;
        // path = args[0];
        // callback = args[1];
        path = args.shift();
        callback = args.pop();
        if (args.length ===0) {
            this.app.post(path,function(){
                callback.apply(self,arguments);
            });
        } else {
            next = args.shift();
            this.app.post(path,next,function(){
                callback.apply(self,arguments);
            });
        }

        //  this.app.post.apply(self,arguments)

    },
    render : function(res,req,variables) {
        var layout = variables.layout;
        delete variables.layout;
        res.render(layout,variables);
    },
    encrypt :function (text){
        var crypto = require('crypto');
        var cipher = crypto.createCipher('aes-256-cbc','d6F3Efeq');
        var crypted = cipher.update(text,'utf8','hex')
        crypted += cipher.final('hex');
        return crypted;
    },

    decrypt: function (text){
        var crypto = require('crypto');
        var decipher = crypto.createDecipher('aes-256-cbc','d6F3Efeq');
        var dec = decipher.update(text,'hex','utf8')
        dec += decipher.final('utf8');
        return dec;
    },

    renderToJson : function(res,data) {
        assert(data);
        res.contentType('application/json');
        var jsonData = JSON.stringify(data);
        res.send(jsonData);
    }
});

Router.extend = Garam.extend;