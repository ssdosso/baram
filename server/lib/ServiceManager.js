const _ = require('underscore')
    , fs = require('fs')
    , Express = require('express')
    , Garam = require('./Garam')
    , Base = require('./Base')
    , Cookies = require('cookies')
    , Https = require('https')
    , Http = require('http')
    , path = require('path')
    , assert= require('assert')
    , moment = require('moment')
    , engine = require('ejs-locals')
    , request = require('request')
    , Cluster = require('cluster')
   // , ChildServer = require('./cluster/WorkerProcess')
   // , MasterServer = require('./cluster/MasterProcess')

    //, Router = require('./Router')
    , domain = require('domain');





exports =  module.exports  = WebServiceManager;
function WebServiceManager() {
    "use strict";
    Base.prototype.constructor.apply(this,arguments);
    this._listenStatus = false;


}

_.extend(WebServiceManager.prototype, Base.prototype, {
    _service:null,
    _workers :null,
    _worker:null,
    _master:null,
    get : function (name) {
        return this.options[name];
    },
    getHttpServer: function() {
        return this._server;
    },
    setHttpServer: function(server) {
        this._server = server;
    },
    getProxy : function () {
        return this._proxy ? this._proxy : null;
    },
    create : function(options) {
        var scope = this
            , server
            , app
            , httpProxy
            ,proxy
            ,secureOptions;

        this.options = options; //json 환경 데이터



        if (options.SSL && options.SSL === true) {
            assert(options.secureOptions.pfx);
            secureOptions = {
                pfx:fs.readFileSync(process.cwd() +'/key/'+options.secureOptions.pfx),
                passphrase : options.secureOptions.passphrase
            };
        } else {
            secureOptions = null;
        }

        if (typeof this.options.type ==='undefined' ) {
            this.options.type = 'http';
            app =  this.app = Express();
        } else if (this.options.type ==='http') {
            app =  this.app = Express();
        } else if (this.options.type ==='proxy') {
            httpProxy = require('http-proxy');
            var WebApp =require('./WebApp');
            app = this.app = new WebApp;
            this._proxy = httpProxy.createProxyServer({});

        }

        if (this.options.type ==='http') {
            if (secureOptions) {
                this.setHttpServer( Https.createServer(secureOptions, this.app));
               console.log('https Server create');
            } else {
                this.setHttpServer(Http.createServer(this.app));
            }
            this._server.options = options;
            if (typeof app.configure !== 'function') {
                Garam.getInstance().set('express',4);
                app.configure = function(env) {
                    var args = [].slice.call(arguments),callback,envs = 'all';
                    callback = args.pop();
                    if (args.length) envs = args;
                    if ('all' == envs || ~envs.indexOf(app.get('env'))) {
                        callback.call(this);
                    }
                    return this;
                }
            } else {
                Garam.getInstance().set('express',3);
            }

            scope.webInitialize(server,options);

        } else if (this.options.type ==='proxy') {

            app.configure(function () {
                scope.routerFactory = new RouterFactory(app,scope,function () {
                        console.log('reday')
                });

                scope._server = Http.createServer(function (req,res) {
                    var path = req.url;
                    var args = [].slice.call(arguments)
                    switch (req.method) {
                        case "POST":
                               // var params = ['POST:'+path].concat(args);
                               //
                           // console.log(['POST:'+path].concat(args))
                            scope.app.emit.apply(scope.app,['POST:'+path].concat(args));
                       
                            break;
                        case "GET":
                
                            scope.app.emit.apply(scope.app,['GET:'+path].concat(args));
                            break;
                    }
                });
            });

           // this.setHttpServer(Http.createServer());


        }






    },
    addRouters: function(path,callback) {

        if (typeof this.routerFactory !== 'undefined') {

            this.routerFactory.addRouters(path,callback);
        }

    },
    addConfigure: function(callback) {
        callback(this.app);
    },
    getWorker : function() {
        return this._worker;
    },
    getListenStatus : function () {
        return this._listenStatus;
    },
    webInitialize: function(server,options) {
        let app = this.app,scope=this;


        let allowCrossDomain =function(req, res, next) {
            if (typeof options.origin ==='undefined') {
                assert(0,'환경설정 service.origin   형식의 origin 값을 추가해주세요')
            }

            if (typeof options.debug ==='undefined') {
                assert(0,'환경설정 service.debug   boolean 형식의   값을 추가해주세요')
            }
            let allowedOrigins = options.origin;
            let origin = req.headers.host;
            //console.log(req.headers);


            if(_.indexOf(allowedOrigins,origin) > -1){

                res.header('Access-Control-Allow-Origin', origin);

            } else {
                res.header('Access-Control-Allow-Origin', '*');
            }

            res.header("Access-Control-Allow-Headers", "X-Requested-With");


            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
            let time = moment().format('x') +moment().format('SSS');
            res.header('timestamp',time);
           // req._ntime = time;
            if ('OPTIONS' === req.method) {
                res.sendStatus(200);
            }
            else {
                next();
            }
        };




        app.configure(function () {
            app.set('options',options);
            app.set('port', options.port);
            app.set('views', process.cwd() + '/server/views');
            app.set('view engine', 'ejs');
            app.engine('ejs', engine);


            //
            // var Ddos = require('ddos');
            // var ddos = new Ddos({
            //     burst:100
            // });

            var session = require('cookie-session');
            var bodyParser = require('body-parser');

            app.use(Cookies.express() );
            // app.use(Timeout('3s'));
            // app.use(haltOnTimedout);
            //
            // function haltOnTimedout (req, res, next) {
            //     if (!req.timedout) next();
            // }
            //app.use(ddos.express);

            app.use(function(req, res, next){
                res.setTimeout(1000*10, function(){

                    Garam.logger().error('Request has timed out.');
                     res.sendStatus(408);
                   // res.status(503).send({ sid: true,pingInterval:1, pingTimeout:1});
                });

                next();
            });

            app.use(function(req, res, next) {
                let contentType = req.headers['content-type'] || ''
                    , mime = contentType.split(';')[0];

                if (mime != 'text/plain') {
                    return next();
                }

                let data = '';
                req.setEncoding('utf8');
                req.on('data', function(chunk) {
                    data += chunk;
                });
                req.on('end', function() {
                    req.rawBody = unescape(data);
                    next();
                });
            });
           app.use(bodyParser.json());
           app.use(bodyParser.raw(options));
           app.use(bodyParser.urlencoded({extended:true}));
           // app.use(rawBody);
            app.set("jsonp callback", true);



            app.use(session({ secret: 'keyboard cat', key: 'sid', cookie: { secure: true }}));
            var compress = require('compression');
            app.use(compress());
            app.use(require('method-override')());
            app.use(allowCrossDomain);
            app.use(Express.static(process.cwd() + '/public'));
            app.disable('x-powered-by');

            scope.routerFactory = new RouterFactory(app,scope);


            var controllers = Garam.getControllers();
            for(var i in controllers) {
                (function(ctl){
                   if (typeof ctl.createRouter ==='function') {
                       var BaseRouter = require('./Router');
                       // var router = new Router();
                       //router.app = app;
                       //router.webManager = scope;
                       var ctlRouter = ctl.createRouter();
                       if (!_.isObject(ctlRouter)) {
                           assert(0,'createRouter 할때에는 Object 형식이어야 합니다.')
                       }
                       var Router = BaseRouter.extend(ctlRouter);
                       var router = new Router();
                       router.init(app,scope);

                   }
                })(controllers[i]);
            }



            var d = domain.create();
            d.on('error', function(er) {
                Garam.logger().error(er.stack);
            });


            /**
             * 라우터가 준비 되면 발생 하는 이벤트
             */
            Garam.getInstance().on('routerComplete',function(){
             
            
                var serverErrorHandler = function(err,req, res, next) {

                    d.add(req);
                    d.add(res);
                    d.run(function() {
                        Garam.logger().error(err.stack);
                        if (req.xhr) {
                            res.status(500).end();
                        } else {
                            res.render('500',{});
                        }


                    });
                };

                if (options.debug) {
                    Garam.logger().info('service Debug mode ');
                    var errorhandler = require('errorhandler');
                    app.use(errorhandler);
                } else {
                    app.use(serverErrorHandler);
                }



                app.use(function(req, res, next) {
                     if (req.xhr) {
                            res.status(404).send({ sid: true,pingInterval:1, pingTimeout:1});
                    } else {
                            res.render('404', {});

                    }
                });






            });





        });


        //app.configure('development', function () {
        //
        //
        //    //app.use(errorhandler);
        //   // app.use(Express.errorHandler());
        //
        //});



        //
        //app.configure('production', function() {
        //
        //    if ( Garam.getInstance().get('express') > 3) {
        //        var morgan  = require('morgan');
        //        app.use(morgan());
        //    } else {
        //        app.use(Express.logger());
        //    }
        //
        //    app.use(myErrorHandler);
        //    app.use(Express.static(process.cwd() + '/public', { maxAge: 31557600000 }));
        //});
        //
        //

    },
    listen : function(callback) {
        var self = this;
        this.getHttpServer().listen(this.options.port, function () {

            Garam.logger().info("server listening on port " + self.options.port);


            callback.call(Garam.getInstance(), self.getHttpServer());
        }.bind(this));
       

        this.getHttpServer().on('clientError',function(exception) {
            if (exception.errno !=='ECONNRESET') {
               // Garam.getInstance().log.error({exception:exception});
            } else {
                //console.log('ECONNRESET ')
            }

        });
    }
});


var RouterFactory = require('./RouterFactory');
const bodyParser = require("body-parser");