var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Express = require('express')
    , Baram = require('./Baram')
    , Base = require('./Base')
    , Https = require('https')
    , Http = require('http')
    , path = require('path')
    , assert= require('assert')
    , engine = require('ejs-locals')
    , request = require('request')
    , Cluster = require('cluster')
    , ChildServer = require('./cluster/Child')
    , MasterServer = require('./cluster/Master')
    , domain = require('domain')
    , FB = require( 'fb' );





exports =  module.exports  = WebServiceManager;

function WebServiceManager() {
    "use strict";
    Base.prototype.constructor.apply(this,arguments);
    if (Cluster.isWorker) {
        this._worker = new ChildServer;
    } else {
        this._master = new  MasterServer();
    }

}

_.extend(WebServiceManager.prototype, Base.prototype, {
          _service:null,
          _workers :null,
          _worker:null,
          _master:null,
          create : function(options) {
              var scope = this
                  , server
                  ,secureOptions;
              var cpus = require('os').cpus().length;
              this.options = options; //json 환경 데이터
              /**
               * S3 set
               */

               //webstorm single 모드가 동작하겠금 설정
              var single = Baram.getInstance().get('single');

              if (!single) {
                  if ( Cluster.isWorker ) {
                      this._worker = new ChildServer;
                  } else {
                      this._master = new  MasterServer();
                  }
              }

              Baram.getInstance().storage.create();

              if (Cluster.isMaster && !single) {

                  this._workers = {};
                  for (var i = 0; i < cpus; i++) {
                      this._workers[i] = Cluster.fork();
                  }
                  this._master.create();
                  this._master.on('message', function (data, id) {

                         console.log('child on message');
                         console.log(data)
                  });
              }  else  {
                  if(!single) this._worker.create();

                  var port = options.port;
                  if (options.SSL && options.SSL === true) {
                      assert(options.secureOptions.pfx)
                      secureOptions = {
                          pfx:fs.readFileSync(options.secureOptions.pfx)
                      };
                  } else {
                      secureOptions = null;
                  }
                  var app =  this.app = Express();

                  if (secureOptions) {
                      this._server = Https.createServer(secureOptions, this.app);
                      Baram.getInstance().info('SSL Server create');
                  } else {
                      this._server = Http.createServer(this.app);

                      Baram.getInstance().log.info('http Server create');
                  }

                  var serverDomain = domain.create();
                  serverDomain.on('error', function(err,data) {

                      if (err) {
                          Baram.getInstance().log.error(err.stack);
                      }

                  });
                  this._server.options = options;
                  serverDomain.run(function(){
                      if (typeof app.configure !== 'function') {
                         Baram.getInstance().set('express',4);

                          app.configure = function(callback) {
                            if (typeof callback === 'string') {
                                callback = arguments[1];
                                callback();
                                console.log();
                            } else {
                                callback();
                            }

                          }
                      } else {
                          Baram.getInstance().set('express',3);
                      }

                      scope.setConfigure(server,options);
                  });


              }



          },
          addRouters: function(path) {
            this.routerFactory.addRouters(path);
          },
          addConfigure: function(callback) {
              callback(this.app);
          },
          setConfigure: function(server,options) {
                var app = this.app,scope=this;

                var allowCrossDomain =function(req, res, next) {

                    res.header('Access-Control-Allow-Origin', '*');
                    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

                    // intercept OPTIONS method
                    if ('OPTIONS' == req.method) {
                        res.send(200);
                    }
                    else {
                        next();
                    }
                };
                var myErrorHandler=function(err, req, res, next){

                    res.render('error',{});
                };

                app.configure(function () {
                    app.set('options',options);
                    app.set('port', options.port);
                    app.set('views', process.cwd() + '/server/views');
                    app.set('view engine', 'ejs');
                    app.engine('ejs', engine);

                    if ( Baram.getInstance().get('express') > 3) {
                        var cookieParser = require('cookie-parser');
                        var session = require('cookie-session');
                        var bodyParser = require('body-parser');

                        app.use(bodyParser()); // pull information from html in POST
                        app.use(bodyParser.json());
                        app.use(bodyParser.urlencoded());
                        //테스트 필요...
                        app.use(session({
                            keys: ['key1', 'key2'],
                            secureProxy: true // if you do SSL outside of node
                        }))
                        app.use(function (req, res, next) {
                            var n = req.session.views || 0
                            req.session.views = ++n
                            res.end(n + ' views')
                        })
                        var compress = require('compression');
                        app.use(compress());
                        app.use(require('method-override')())

                    } else {
                        app.use(Express.cookieParser('1234'));
                        app.use(Express.cookieSession());
                        app.use(Express.compress());
                        app.use(Express.methodOverride());
                        app.use(Express.json());
                        app.use(Express.urlencoded());
                    }





                    //app.use(Express.json());

                    app.use(allowCrossDomain);
                    app.use(function(req, res, next) {
                        var reqDomain = domain.create();
                        reqDomain.add(req);
                        reqDomain.add(res);
                        reqDomain.on('error', function(err) {

                            if (err) {
                                Baram.getInstance().log.error(err.stack);
                            }
                            reqDomain.dispose();
                            next(err);
                        });

                        next();
                    });
                    scope.routerFactory = new RouterFactory(app);
                    scope.routerFactory.addRouters('routes');

                });

                app.configure('production', function() {

                        if ( Baram.getInstance().get('express') > 3) {
                            var morgan  = require('morgan');
                            app.use(morgan());
                        } else {
                            app.use(Express.logger());
                        }

                    app.use(myErrorHandler);
                    app.use(Express.static(process.cwd() + '/public', { maxAge: 31557600000 }));
                });


                app.configure('development', function () {
                    app.use(Express.static(process.cwd() + '/public'));
                   // app.use(Express.static(process.cwd() + '/public', { maxAge: 31557600000 }));
                        if ( Baram.getInstance().get('express') > 3) {
                            var errorhandler = require('errorhandler');
                            app.use(errorhandler());
                        } else {
                            app.use(Express.errorHandler({ dumpExceptions: true, showStack: true }));
                        }


                });

          },
          listen : function(callback) {
              var self = this;
              this._server.listen(this.options.port, function () {
                  console.info("Baram server listening on port " + self.options.port);
                  Baram.getInstance().trigger("initialize:after", {});
                 if(!Baram.getInstance().get('single')) self._worker.onActive();
                  if (self.options.transport) {
                      callback.call(Baram.getInstance(),self._server);
                  }

              });
              this._server.on('clientError',function(exception) {

                  Baram.getInstance().log.error({exception:exception});
                  console.log('## ' + exception);
              });
          }
});


var RouterFactory = require('./RouterFactory');