var Backbone = require('backbone')
    , _ = require('underscore')
    , Garam = require('../../Garam')
    ,  Cluster = require('cluster')
    , Base = require('../../Base')
    , assert = require('assert')
    , fs = require('fs')
    , async = require('async');


var DBlib = function(namespace) {
    this.namespace = namespace;
    this.sql_list = {};
};
module.exports =  DBlib;
_.extend(DBlib.prototype, Base.prototype, {
    addSQL : async function(sql) {
        assert(sql.dpname);

        let db =    Garam.getDB(this.namespace);
        //console.log('create  sql',this.namespace,sql.dpname)
        db.addProcedure(sql.dpname,sql);
       await sql.create(db.config);




    },
    create : async function(model_dir) {
        let self = this;
        let namespace = this.namespace;
        this.appDir = Garam.getInstance().get('appDir');
        this._sql = {};

        return new Promise(async (resolve, reject) => {
            try {

                if(!fs.existsSync(this.appDir + '/model')) {
                    Garam.getInstance().log.info(this.appDir + '/db make db dir');
                    fs.mkdirSync(this,appDir + '/model');
                }

                if(!fs.existsSync(this.appDir + '/model/' + namespace)){
                    Garam.getInstance().log.info(this.appDir + '/db/' + namespace + 'make model dir');
                    fs.mkdirSync(this.appDir + '/model/' + namespace);
                }
                let dir = process.cwd()+'/'+ this.appDir + '/model/'+namespace;
                let list = fs.readdirSync(dir);
                let total =list.length;


                if(total === 0){
                    resolve();
                    return;
                }


                for await(let file of list) {
                        let stats = fs.statSync(dir + '/'+ file);
                        if (stats.isFile()) {
                            let sql = require(dir + '/'+  file);
                            let t = new sql();
                            if(!t.dpname) {
                                reject(dir + '/'+  file+', dbname does not exist');
                                return;
                            }
                            await self.addSQL(t);
                        } else {
                             await read(file);
                        }
                }

                resolve();

            } catch (e) {
                reject(e);
            }
        });

        // if(!fs.existsSync(this.appDir + '/model')) {
        //     Garam.getInstance().log.info(this.appDir + '/db make db dir');
        //     fs.mkdirSync(this,appDir + '/model');
        // }
        //
        // if(!fs.existsSync(this.appDir + '/model/' + namespace)){
        //     Garam.getInstance().log.info(this.appDir + '/db/' + namespace + 'make model dir');
        //     fs.mkdirSync(this.appDir + '/model/' + namespace);
        // }
        //
        // var dir = process.cwd()+'/'+ this.appDir + '/model/'+namespace;
        // var list = fs.readdirSync(dir);
        // var total =list.length;
        //
        //
        // if(total === 0){
        //     Garam.getInstance().log.error('Procedure Factory is empty',namespace);
        //
        //     Garam.getInstance().emit('databaseOnReady',namespace);
        //     return;
        // }
        //
        // list.forEach(function (file,i) {
        //     (function(job) {
        //         var stats = fs.statSync(dir + '/'+ file);
        //         if (stats.isFile()) {
        //
        //             var sql = require(dir + '/'+  file);
        //             var t = new sql();
        //
        //             if(!t.dpname) {
        //                 Garam.getInstance().log.error(dir + '/'+  file+', dbname does not exist');
        //                 return;
        //             }
        //             self.addSQL(t);
        //             if (total === (job+1)) {
        //                 Garam.getInstance().emit('completeWork',namespace);
        //                 Garam.getInstance().emit('databaseOnReady',namespace);
        //             }
        //
        //         } else {
        //             read(file,function () {
        //                 if (total === (job+1)) {
        //                     Garam.getInstance().emit('completeWork',namespace);
        //                     Garam.getInstance().emit('databaseOnReady',namespace);
        //                 }
        //             });
        //         }
        //     })(i);


            // var stats = fs.statSync(dir + '/'+ file);
            // if (stats.isFile()) {
            //     var sql = require(dir + '/'+  file);
            //     var t = new sql();
            //
            //     if(!t.dpname) {
            //         Garam.getInstance().log.error(dir + '/'+  file+', dbname does not exist');
            //         return;
            //     }
            //     self.addSQL(t);
            //
            // }
            // if (total === (i+1)) {
            //
            //     Garam.getInstance().emit('completeWork',namespace);
            //     Garam.getInstance().emit('databaseOnReady',namespace);
            // }



        async function read(folderName,callback) {

            return new Promise(async (resolve, reject) => {
                var subDir = dir+'/'+folderName;
                var list = fs.readdirSync(subDir);
                var total = list.length,Transaction;

                for await(let file of list) {
                    let stats = fs.statSync(subDir + '/'+ file);
                    if (stats.isFile()) {
                        let sql = require(subDir + '/'+ file);
                        let t = new sql();
                        if(!t.dpname) {
                            reject(dir + '/'+  file+', dbname does not exist');
                            return;
                        }
                        await this.addSQL(t);

                    } else {
                        assert(0);
                    }
                }
                resolve();


                // if (list.length > 0) {
                //     list.forEach(function (file,i) {
                //         (function (job) {
                //             var stats = fs.statSync(subDir + '/'+ file);
                //             if (stats.isFile()) {
                //                 var sql = require(subDir + '/'+ file);
                //                 var t = new sql();
                //
                //                 if(!t.dpname) {
                //
                //                     reject(dir + '/'+  file+', dbname does not exist');
                //                     return;
                //                 }
                //                 self.addSQL(t);
                //                 if (total === (job+1)) {
                //
                //                     callback();
                //
                //                 }
                //
                //             } else {
                //                 assert(0);
                //             }
                //         })(i);
                //     });
                //}
            });

        }


    }
});


DBlib.extend = Garam.extend;