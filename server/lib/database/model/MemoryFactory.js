var Backbone = require('backbone')
    , _ = require('underscore')
    , Garam = require('../../Garam')
    ,  Cluster = require('cluster')
    , Base = require('../../Base')
    , assert = require('assert')
    , fs = require('fs')
    , async = require('async');


var ModelFactory = function(namespace,config) {


    this.namespace = namespace;
    this.models = {};
    this.config = config;

    this.type = this.config.driver;

}
module.exports =  ModelFactory;
_.extend(ModelFactory.prototype, Base.prototype, {
    addModel : function(model) {

        if (typeof model.modelType ==='undefined') {
            model.modelType = 'memory';
        }
        model._create(model.dbName);
        var db =    Garam.getDB(this.namespace);

        db.addProcedure(model.name,model);
        //Garam.setModel(model.name,model);
    },
    create : async function(model_dir) {
        var self = this;
        var namespace = this.namespace;
        var modelDir = this.appDir + '/model/'+namespace;
        this.appDir = Garam.getInstance().get('appDir');
        this._sql = {};

        if(!fs.existsSync(this.appDir + '/model/'+namespace)) {
            Garam.getInstance().log.error(modelDir,'not find model dir');
            return;
        }
        var dir = process.cwd()+'/'+ this.appDir + '/model/'+namespace;

        read(dir);

        function read(dir) {
            var list = fs.readdirSync(dir);
            var total =list.length;

            list.forEach(function (file,i) {

                var stats = fs.statSync(dir + '/'+ file);
                if (stats.isFile()) {
                    var Model = require(dir + '/'+  file);
                    var t = new Model(this.type,self.config.namespace);
                    self.addModel(t);
                } else {
                    read(dir+'/'+file);
                }

                if (total === (i+1)) {
                    Garam.getInstance().emit('completeWork',namespace);
                    Garam.getInstance().emit('databaseOnReady',namespace);
                }

            });
        }



    },
    addCreateModel : function() {

    }
});


ModelFactory.extend = Garam.extend;