var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , request = require('request')
    , winston = require('winston')
    ,Baram = require('./Baram')
    , Base = require('./Base')
    , assert= require('assert');


exports= module.exports = Router;
function Router (mgr, name) {

    this.base();
}




_.extend(Router.prototype, Base.prototype, {
           init : function(app,webManager) {
                this.app = app;
                this.webManager = webManager;
                this.start();
           },
           getWorker : function() {
               return this.webManager.getWorker();
           },
           getController: function(controllerName) {
                assert(controllerName);
               return Baram.getInstance().getController(controllerName)
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
           get : function(path,callback) {
                var self = this;
               this.app.get(path,function(){
                   callback.apply(self,arguments);
               });
           },
           post : function(path,callback) {
                var self = this;
                this.app.post(path,function(){
                    callback.apply(self,arguments);
                });
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
        /**
         *  request rest 통신을 한다.
         * @param method
         * @param path
         * @param data
         * @param next
         */
            request: function(method,path,data,next) {
                assert(path);
                assert(next);
                if (!_.isObject(data)) {
                    assert(0);
                }
                var scope = this
                    ,url=  data.url ? data.url +'/' + path :Baram.getInstance().get('url') +'/' + path
                    ,qs = require('querystring').stringify(data)
                    ,options={};

                method = method === undefined ? 'get' : method;
                switch(method) {
                    case 'get':
                        options.headers = {'content-type' : 'application/x-www-form-urlencoded'};
                        options.url = url + '?' + qs;
                        break;
                    default :
                        options.headers = {'content-type' : 'application/x-www-form-urlencoded'};
                        options.url = url;
                        options.body = qs;
                        break;
                }


                request[method](options, function(error, response, body){
                    //  console.log(response)
                    if (error) {
                        Baram.getInstance().log.warn('Error Message:'+error);
                    }

                    if (body){
                        try {
                            var data = JSON.parse(body);

                            if (data.error && data.error < 0)  {
                                Baram.getInstance().log.info('error', data.error,data.result_text);
                            }

                            if (data.result_code && data.result_code < 0) {
                                data.error = data.result_code;
                            } else {
                                data.error = 0;
                            }
                            next(response, data);

                        } catch(e) {

                            Baram.getInstance().log.warn('Error Message: ' + body);
                        }


                    } else {
                        Baram.getInstance().log.warn('Error Message: No Body ');
                    }
                });
            },
            renderToJson : function(res,data) {
                    assert(data);
                    res.contentType('application/json');
                    var jsonData = JSON.stringify(data);
                    res.send(jsonData);
            }

});

Router.extend = Baram.extend;