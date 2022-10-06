var EventEmitter = require('events').EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Garam = require('./../Garam')
    , sanitizer = require('sanitizer')
    , async = require('async')
    , ProcedureFactory = require('./model/ProcedureFactory')
    , DB_Store = require('./DB_Store')
    , RedisFactory = require('./model/ModelFactory')
    , MemoryFactory = require('./model/MemoryFactory')
    , assert= require('assert');

exports = module.exports = DB;

function DB (mgr, name) {
   // this.trigger = require('./../triggerMethod');




}


_.extend(DB.prototype, EventEmitter.prototype, {
    db: null,
    getNohm : function() {
      return this.db.getNohm();
    },
    get : function(name) {
        this.db.get.apply( this.db,arguments);
    },
    getOptions : function() {
      return this.db.getAllOptions();
    },
    addProcedure : function(dpname,sql) {
        this.db_store.add(dpname,sql);
    },
    getDP : function(dpname) {
        return this.db_store.get(dpname);
    },
    getProcedure : function (dpname) {
        return this.db_store.get(dpname);
    },
    getModel : function (dpname) {
     
        return this.db_store.get(dpname);
    },
    getNamespace : function() {

        this.db.getNamespace();
    },

    initModel : async function() {


        switch (this.config.driver.toLowerCase()) {
            case 'redis':
                this.modelFactory = new RedisFactory(this.config.namespace,this.config);
                break;
            case 'mysql':
            case 'mssql':

                this.modelFactory = new ProcedureFactory(this.config.namespace);
                break;
            case 'memory':
                this.modelFactory = new MemoryFactory(this.config.namespace,this.config);
                break;
        }
      return  this.modelFactory.create();

    },
    /**
     * reids 추가 모델 등록
     * @param defaultName
     * @param modelName
     */
    afterCreateModel : function(targetModelFolder,modelFile,modelName,callback) {
        var appDir = Garam.getInstance().get('appDir');
        var file =process.cwd()+'/'+appDir+'/model/'+targetModelFolder+'/'+modelFile;

        if(!fs.existsSync(file+'.js')) {
            Garam.getInstance().log.error('not found model');
            return;
        }

        var Model = require(file);
        var t = new Model();
        t.setName(modelName);
        this.modelFactory.addModel(t);
        callback(t);
    },
    close : function() {
        this.db.close();
    },
    _escapeString  : function  (str) {
        return str ? str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
            switch (char) {
                case "\0":
                    return "\\0";
                case "\x08":
                    return "\\b";
                case "\x09":
                    return "\\t";
                case "\x1a":
                    return "\\z";
                case "\n":
                    return "\\n";
                case "\r":
                    return "\\r";
                case "\"":
                case "'":
                case "\\":
                case "%":
                    return "\\"+char; // prepends a backslash to backslash, percent,

            }
        }):null;
    },
    createConnect : async function(config,callback) {
        this.config = config;
        this.db_store = new DB_Store(this.config.namespace);

        return new Promise((resolve, reject) => {
            let cfg = this.config;
            if(!cfg.driver) {


                return   reject(' not find  db driver')
            }
            if(!cfg.namespace) {

                return   reject('not find  db namespace')
            }


            let Database = require('./drivers/'+cfg.driver);
            this.db = new Database();
            this.db.create(cfg);
            Garam.getInstance().log.info(' connected DB  ',cfg.driver,cfg.namespace)
            this.db.connection(function(){

                Garam.getInstance().log.info(' connection DB  ',cfg.driver,cfg.namespace)
                resolve();
            });
        });

        // db_create.call(this);
        //
        // function db_create() {
        //     var cfg = this.config;
        //
        //     if(!cfg.driver) {
        //         Garam.logger().error(' not find  db driver ');
        //         return;
        //     }
        //     if(!cfg.namespace) {
        //         Garam.logger().error(' not find  db namespace');
        //         return;
        //     }
        //
        //     var Database = require('./drivers/'+cfg.driver);
        //     this.db = new Database();
        //     this.db.create(cfg);
        //     Garam.getInstance().log.info(' connected DB  ',cfg.driver,cfg.namespace)
        //     this.db.connection(function(){
        //
        //         Garam.getInstance().log.info(' connection DB  ',cfg.driver,cfg.namespace)
        //         callback();
        //     });
        //     //this.emit('ready');
        // }


    },

    connection : function() {

        // if (this.db.config.namespace =='memory') {
        //     console.log('11111',this.db.conn)
        // }

        return this.db.conn;
    },




    /**
     * 세부 쿼리
     */
    query : function() {
        this.db.query.apply( this.db,arguments);
    },


    /**
     *
     * @param procedure
     * @param params
     * @param callback Or OubtParams
     * @param callback
     */
     execute :  function() {

        this.db.execute.apply( this.db,arguments);

    }


});