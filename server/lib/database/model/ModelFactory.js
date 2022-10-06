var Backbone = require('backbone')
    , _ = require('underscore')
    , Garam = require('../../Garam')
    ,  Cluster = require('cluster')
    , Base = require('../../Base')
    , assert = require('assert')
    , fs = require('fs')
    , async = require('async');


var ModelFactory = function(namespace,config) {
    assert(config);

    this.namespace = namespace;
    this.models = {};
    this.config = config;
    if (this.config.redisModel) {
        this.type = 'redis';
    } else {
        assert(this.config.type);
        this.type = this.config.type;
    }
    
}
module.exports =  ModelFactory;
_.extend(ModelFactory.prototype, Base.prototype, {
    addModel : async function(model) {
        
        if (typeof model.modelType ==='undefined') {
            model.modelType = 'redis';
        }
        model._create(model.dbName);
        var db =    Garam.getDB(this.namespace);

        db.addProcedure(model.name,model);
        //console.log('create  redis ',this.namespace,model.name)
        //Garam.setModel(model.name,model);
    },
    create : async function(model_dir) {
        let self = this;
        let namespace = this.namespace;
        let modelDir = this.appDir + '/model/'+namespace;
        this.appDir = Garam.getInstance().get('appDir');
        this._sql = {};

        return new Promise(async (resolve, reject) => {


            if(!fs.existsSync(this.appDir + '/model/'+namespace)) {

                return reject('not find model dir'+modelDir);
            }

            try {
                let dir = process.cwd()+'/'+ this.appDir + '/model/'+namespace;
                await read(dir);

                resolve();
            } catch (e) {
                reject(e);
            }


        });

        // if(!fs.existsSync(this.appDir + '/model/'+namespace)) {
        //     Garam.getInstance().log.error(modelDir,'not find model dir');
        //     return;
        // }
        // var dir = process.cwd()+'/'+ this.appDir + '/model/'+namespace;
        //
        // read(dir);

       async function read(dir) {
            let list = fs.readdirSync(dir);
            let total =list.length;

               for await(let file of list) {
                   let stats = fs.statSync(dir + '/'+ file);
                   if (stats.isFile()) {
                       let Model = require(dir + '/'+  file);
                       let t = new Model(self.type,self.config.namespace);
                       await self.addModel(t);
                   } else {
                       await read(dir+'/'+file);
                   }
               }
            // list.forEach(function (file,i) {
            //
            //     var stats = fs.statSync(dir + '/'+ file);
            //     if (stats.isFile()) {
            //         var Model = require(dir + '/'+  file);
            //         var t = new Model(this.type,self.config.namespace);
            //         self.addModel(t);
            //     } else {
            //         read(dir+'/'+file);
            //     }
            //
            //     if (total === (i+1)) {
            //         Garam.getInstance().emit('completeWork',namespace);
            //         Garam.getInstance().emit('databaseOnReady',namespace);
            //     }
            //
            // });
        }



    },
    addCreateModel : function() {

    }
});


ModelFactory.extend = Garam.extend;