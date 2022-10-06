var _ = require('underscore')
    , fs = require('fs')
    , Garam = require('./Garam')
  
    , Base = require('./Base')
    , assert= require('assert');

exports = module.exports = RouterFactory;

function RouterFactory (app,webManager,callback) {

    this.app = app;
    this.webManager = webManager;
    this._routers = {};
    this._callback = typeof callback === 'function' ? callback : undefined;
}

_.extend(RouterFactory.prototype, Base.prototype, {
    add : function(name,router) {
        this._routers[name] = router;
    },
    addRouter:function (name, Router) {
       var router = new Router();
        router.init(this.app,this.webManager);
        this.add(name,router);
    },
    addRouters : function(path,callback) {

        var self = this;
        if(!fs.existsSync(path)) {
            path = 'server/'+path;
        }
        var list = fs.readdirSync(path);
        var total =list.length;


        var work =0;
        list.forEach(function (file,i) {

            var stats = fs.statSync(process.cwd()+'/'+path + '/' + file);
            if (stats.isFile()) {
                var routerClasses = require(process.cwd()+'/'+path + '/' + file);
                var isClassName = false;


                for (var className in routerClasses) {
                    isClassName = true;
                    self.addRouter(className, routerClasses[className]);
                    work++;
                }

                if (total === work) {

                    Garam.getInstance().emit('routerComplete');
                    if (self._callback !== undefined) {
                        self._callback();
                    }
                }
                if (!isClassName) {
                    console.error(file + ' module.exports does not exist.');
                }
            }
        });


        //fs.readdirSync(path).forEach(function (file) {
        //    var stats = fs.statSync(process.cwd()+'/'+path + '/' + file);
        //    if (stats.isFile()) {
        //        var routerClasses = require(process.cwd()+'/'+path + '/' + file);
        //        var isClassName = false;
        //        for (var className in routerClasses) {
        //
        //            isClassName = true;
        //            self.addRouter(className, routerClasses[className]);
        //        }
        //        if (!isClassName) {
        //           console.error(file + ' module.exports does not exist.');
        //        }
        //    }
        //});

    }
});