var EventEmitter = require('events').EventEmitter
    ,_ = require('underscore')
    , Garam = require('./Garam')

    , format = require('util').format
    , assert= require('assert');
var Type = require('./Types');
exports = module.exports = Model;

var cron = require('node-cron');
var idGenerators = {
    'create': function (cb) {
        function rnd() {
            return Math.floor(Math.random() * 1e9).toString(36);
        }
        cb((+ new Date()).toString(36) + rnd() + rnd());
    }

};

function Model (type) {
    this.conn = null;
    this.readConn = null;
    this.ready = false;
    this.type = type;
    this.isReadDB = false;
    this._queryKeys = [];
    this._queryCache = {};


}
var CurrentModel = function() {

}
_.extend(CurrentModel.prototype, {
    init : function(data,connect,memory) {
        this._data = data;
        this._connect = connect;
        this._memoryMemory = memory;
        this._queryArr = [];
    },
    find : function (obj,callback) {
        //_queryKeys
        var searchKeys ='',query,queryData='';

        for (var field in this._memoryMemory.schema.properties) {
            if (obj[field]) {
                searchKeys +=':'+field;
                //  queryData+='^'+obj[field];
            }
        }


        query = this._memoryMemory.getQueryString(searchKeys,obj);
        if (!query) {
            assert(query,'not found query string')
        }


        //console.log('#query',query)
        var rows = this._connect.query(query);


        callback(null,rows);
    },
    _typeCheck : function(field,useData) {
        switch (field.type) {
            case 'string':
                if (!_.isString(useData)) {
                    return useData.toString();
                }

                break;
            case 'integer':
                if(!_.isNumber(useData)) {
                    return parseInt(useData);
                }

                break;
            case 'json':
                return JSON.stringify(useData);
                break;
            default:
                return useData;
                break;
        }

        return useData;
    },
    p : function (name,value) {
        if (_.isObject(name)) {
            var obj = name;
            for (var field in this._memoryMemory.schema.properties) {
                if (typeof obj[field] !== 'undefined') {

                    this._data[field] =this._typeCheck(this._memoryMemory.schema.properties[field],obj[field]);
                }
            }

        } else {

            if (typeof this._memoryMemory.schema.properties[name] === 'undefined') {
                assert(0);
            }
            if(typeof value !=='undefined') {

                return this._data[name] = this._typeCheck(this._memoryMemory.schema.properties[name],value);
            }
            if (this._memoryMemory.schema.properties[name].type ==='json' && this._data[name] !== '') {

                return JSON.parse(this._data[name]);
            } else if (this._memoryMemory.schema.properties[name].type ==='json' &&  (this._data[name] == null || this._data[name] =='')) {

                return {};
            } else {
                return this._data[name] ? this._data[name] : '';
            }

        }

    },
    load : function(id,callback) {
        var row = this._connect.getData(id);
        if (row !== null) {

            this._data = row;

        }
        callback(null);
        //callback(null,connect.getData(id))
    },
    remove : function(callback) {
        var args = Array.prototype.splice.call(arguments, 0);
        if (args.length > 1) {
            callback = args[1];
        }
        this._connect.deleteData(this._data._id);


        callback();
    },
    save : function (callback) {

        var args = Array.prototype.splice.call(arguments, 0),self=this;
        if (args.length > 1) {
            callback = args[1];
        }
        var query ;
        if (this._data.isLive ==false) {

            //   console.log('# insert data',self.getQueryList())
            var queryList = self._memoryMemory.getQueryList();

            idGenerators.create(function (id) {

                self._data._id = id;
                self._data.isLive =true;
                self._connect.addData(self._data);
                for (var i in queryList) {
                    query = self._memoryMemory.createQueryData(self._data,queryList[i]);
                    self._queryArr.push(query);
                    self._connect.addQuery(query,self._data._id);

                }
                callback();
            });

        } else {
            // if (queryArr.length ===0) {
            //     var queryList = self.getQueryList();
            //     for (var i in queryList) {
            //         query = self.createQueryData(data,queryList[i]);
            //         queryArr.push(query);
            //         connect.addQuery(query,data._id);
            //
            //     }
            // }
            //
            // for (var i in queryArr) {
            //    var query = queryArr[i];
            // }

            this._connect.addData(this._data);

            callback();
        }


    }
});



_.extend(Model.prototype, EventEmitter.prototype, {
    create : function() {

    },

    getModelName : function () {
        return this.name;
    },
    setName : function(name) {
        this.name = name;
    },
    set : function(key,name){
        this[key] = name;
    } ,
    _create : function(dbName) {
        var self = this;
        this.schema = {properties:{},publish:true};

        this.connect =  Garam.getDB(dbName).connection(),self=this;
        //   console.log(dbName,connect)
        //require.uncache('nohm');


      //  this.namespace = connect.getNamespace();

        this.create();

      //  connect.getConnection(function(err, conn,readConn){
            // self.nohm.setClient(conn);
            // self.conn = conn;
            // if (readConn) {
            //
            //     self.readConn = readConn;
            //     self.readNohm.setClient(readConn);
            // }


      //  });

        // cron.schedule('5,*,*,* * * * *', function(){
        //     console.log('call')
        // });



    },

    setConn : function(conn) {
        this.nohm.setClient(conn);

        this.conn = conn;
    },
    getConn : function() {
        return  this.conn;
    },
    getNamespace : function() {
        return this.namespace;
    },
    createModel : function(callback) {


        //
        //callback();
        var key='',self = this;

        var j = 0;

        for (var fieldName in this.schema.properties) {
            this.schema.properties[fieldName].number = j;
            j++;
        }

        function queryUniqueCheck(queryKeys,fieldObj) {
            if (typeof queryKeys == 'undefined') {
                queryKeys =[];

                return false;
            }
            for (var i in queryKeys) {
               if(queryKeys[i] == fieldObj) {
                   return true;
               }
            }


        }
        function _createQueryItems(currentFieldName,number) {
            var keyList = [];
            //var queryData = this.setDefaultIndex(currentFieldName);
          //  var queryKey = queryData.key,query='';
            var query ='';
            for (var fieldName in this.schema.properties) {
                if (this.schema.properties[fieldName].index === true ) {

                    keyList[this.schema.properties[fieldName].number] = fieldName;

                }
            }
            var j = 0,subQuery='';
            var queryObj = this.createModelKey(currentFieldName);
            //this._queryKeys[queryObj.key] = [];
            for (var k in queryObj.fields) {
                if(!queryUniqueCheck( this._queryKeys[queryObj.key],this.schema.properties[queryObj.fields[k]])) {
                    if (typeof this._queryKeys[queryObj.key] == 'undefined') {
                        this._queryKeys[queryObj.key] = [];
                    }
                    this._queryKeys[queryObj.key].push(this.schema.properties[queryObj.fields[k]]);
                }

            }
         //   this._queryKeys[queryObj.key] =[this.schema.properties[queryObj.field]];
            for (var i in keyList) {
                var currentTarget = keyList[i];
                subQuery='';
             //   console.log(currentFieldName,query)
                if (j == 0) {
                    query += keyList[i];
                } else {
                    query += ':'+keyList[i];
                }
                queryObj = this.createModelKey(query);
                if (typeof  this._queryKeys[queryObj.key] === 'undefined') {
                    this._queryKeys[queryObj.key] = [];
                }
                for (var k in queryObj.fields) {
                    if(!queryUniqueCheck( this._queryKeys[queryObj.key],this.schema.properties[queryObj.fields[k]])) {
                        if (typeof this._queryKeys[queryObj.key] == 'undefined') {
                            this._queryKeys[queryObj.key] = [];
                        }
                        this._queryKeys[queryObj.key].push(this.schema.properties[queryObj.fields[k]]);
                    }
                  //  this._queryKeys[queryObj.key].push(this.schema.properties[queryObj.fields[k]]);
                }
                // this._queryKeys[queryObj.key] =queryStr;
                if (number !==0 && typeof  keyList[number-1] !== 'undefined') {
                  //  console.log(keyList[number-1])
                    subQuery +=keyList[number-1];
                    subQuery +=':'+currentFieldName;
                   // console.log('sub',subQuery)
                    queryObj = this.createModelKey(subQuery);
                    // if (typeof  this._queryKeys[queryObj.key] === 'undefined') {
                    //     this._queryKeys[queryObj.key] = [];
                    // }
                    for (var k in queryObj.fields) {
                        if(!queryUniqueCheck( this._queryKeys[queryObj.key],this.schema.properties[queryObj.fields[k]])) {
                            if (typeof this._queryKeys[queryObj.key] == 'undefined') {
                                this._queryKeys[queryObj.key] = [];
                            }
                            this._queryKeys[queryObj.key].push(this.schema.properties[queryObj.fields[k]]);
                        }
                      //  this._queryKeys[queryObj.key].push(this.schema.properties[queryObj.fields[k]]);
                    }
                }
                j++;
              //  console.log(query)
            }

        }
        for (var fieldName in this.schema.properties) {
            var field = this.schema.properties[fieldName];
            if (typeof field.index !== 'undefined' && field.index === true) {

                _createQueryItems.call(this,fieldName,this.schema.properties[fieldName].number);
               //  this.setQueryIndex(fieldName,true);
               //  if (i !== 0) {
               //      key +=':'+fieldName;
               //  } else {
               //      key += fieldName;
               //  }
               // i++;
            }


            //this.setQueryIndex(key);
          //  this.conn.get(this.getModelName())
        }




        //this.setQueryIndex(key);
        this.ready = true;
        this._data ={};
        for (var field in self.schema.properties) {
            //  console.log(self.schema.properties[field]);
            switch (self.schema.properties[field].type) {
                case 'string':
                    this._data[field] ='';
                    break;
                case 'integer':
                    this._data[field] = 0;
                    break;
                case 'Float':
                    this._data[field] = 0;
                    break;
                case 'boolean':
                    this._data[field] = false;
                    break;
                case 'timestamp':
                    this._data[field] = false;
                    break;
                case 'json':
                    this._data[field] = {};
                    break;
            }

        }

        callback();


    },
    _idCreate : function(callback) {

        idGenerators.create(callback);
    },
    _getData : function() {
      return _.clone(this._data);
    },
    createModelKey : function(key) {

            var data = key.split(':');


          return  {key:this.getModelName() +':'+key,fields:data};


    },
    setQueryIndex : function(key,isArrayType) {
        var use = false;
        if (typeof isArrayType ==='undefined') {
            isArrayType = false;
        }
         key = this.getModelName() +':'+key;
       if (typeof this._queryKeys[key] ==='undefined') {
            this._queryKeys[key] = key;

       }

       for (var i in this._queryKeys) {
          if ( this._queryKeys[i] == key) {
              use = true;
          }
       }
       if (!use) {
           this._queryKeys.push(key)
       }
       if (isArrayType) {
           this._addData(key,[]);
       }

    },
    _addData : function(key,value) {
        this.connect.set(key,value)
    },
    getQueryIndex : function(query) {
        query = this.getModelName() +query;


        for (var i in this._queryKeys) {

           if ( this._queryKeys[i] == query) {
               return query;
           }
        }

        return false;
    },
    setParameter: function (param) {
        return []
    },
    findArray : function(fieldName,arr,callback) {
        if (!_.isArray(arr)) {
            assert(0);
        }
        var self = this,list=[];
        var nohm =  this.nohm;
        _query.call(this);
        function _query() {
            var self = this;
            var qeury = {};
            if (arr.length > 0) {
                var searchValue = arr.pop();
            } else{
                callback(false,list)
                return;
            }
            var model = nohm.factory(this.name);
            qeury[fieldName] = searchValue;
            model.findAndLoad(qeury,function(err,result) {
                if (err) {
                    if (err === 'not found') {
                        list.push(0);
                    } else {
                        callback(err);
                        return;
                    }

                } else {

                    list.push(result[0]);

                }
                _query.call(self);


            });
        }
    },
    queryKeys : function(obj,callback) {
        if (!_.isObject(obj)){
            Garam.logger().error(obj);
            assert(0);
            return;
        }
        for (var i in obj) {
            if (typeof obj[i] === 'undefined') {
                assert(0,i);
                return;
            }
        }
        var nohm =  this.nohm,self=this;
        var model = nohm.factory(this.name);


        model.find(obj,function(err,rows) {

            if (err) {
                if (err === 'not found') {
                    rows = {
                        length : 0
                    }
                    callback(null,rows);
                    return;
                }

            }
            callback(err,rows);


        });
    },
    getAll : function (callback) {


        var nohm =  this.nohm,self=this,rows=[],models=[],idLIst=[];
        var model = nohm.factory(this.name);

        model.find(function (err, ids) {
            // ids = array of ids

            if (err) {
                if (err === 'not found') {
                    callback(null,[],[]);
                } else {
                    console.log('not !!!')
                    callback(err);

                }
                return;
            }

            if (ids.length > 0) {
                self._load(ids,rows,models,function () {
                    callback(null,models,rows);
                });
            } else {
                callback(null,[],[]);
            }
        });


    },
    _rankLoad : function (ids,rows,models,callback) {
        var nohm =  this.nohm,model = nohm.factory(this.name);
        load.call(this);
        var r =0;
        function load() {
            if (ids.length > 0) {
                var key = ids.pop();
            } else {
                callback();
                return;
            }
            model.load(key, function (err, properties) {
                if (err && err !=='not found') {

                    callback(err);

                } else if(err && err =='not found') {
                    load();
                } else {
                    rows.push(properties);
                    models.push(model);
                    model.rank =++r;

                    load();
                }
            });
        }


    },




    _load : function (ids,rows,models,callback) {
        var nohm =  this.getNohm(),model = nohm.factory(this.name);

        load.call(this);

        function load() {
            if (ids.length > 0) {
                var key = ids.pop();
            } else {
                callback();
                return;
            }
            model.load(key, function (err, properties) {
                if (err && err !=='not found') {

                    callback(err);

                } else if(err && err =='not found') {
                    load();
                } else {
                    rows.push(properties);
                    models.push(model);

                    load();
                }
            });
        }


    },
    getNohm : function(mode) {
        if (typeof mode === "undefined") {
            return this.nohm;
        }
        if(this.isReadDB) {
            console.log('read db')
            return  this.readNohm;
        } else {
            return this.nohm;
        }
    },
    query : function(obj,userCallback,type) {
        var nohm,self=this;
        if (!_.isObject(obj)){
            Garam.logger().error(obj);
            assert(0);
            return;
        }
        for (var i in obj) {
            if (typeof obj[i] === 'undefined') {
                assert(0,i);
                return;
            }
        }

        nohm = this.getNohm(type);
        var model = nohm.factory(this.name);
        var rows=[],models=[];

        this.checkDbConnection(nohm, function(e) {
            if (e == 'fail') {
                userCallback(e);
                return;
            }
            model.find(obj, function (err, ids) {

                if (err) {
                    (err === 'not found') ? userCallback(null, rows) : userCallback(err);
                    return;
                }


                if (ids.length > 0) {
                    self._load(ids, rows, models, function () {
                        userCallback(null, models, rows);
                    });
                } else {
                    userCallback(null, rows);
                }
            });
        });




    },

    getWriteModel : function(model) {
        var nohm = this.nohm,self=this;
        if (!this.isReadDB) {
            return model;
        }
        var nModel =  nohm.factory(this.name);
        //  console.log(this.schema.properties)
        for (var field in this.schema.properties) {
            nModel.property(field,model.property(field))
            // this.schema.properties[field]
        }
        nModel.id = model.id;
        return nModel;

    },
    insert : async function(obj,callback) {
        let self =this,model = this.factory();

        return new Promise(function(resolved,rejected){

            model.property(obj);
            model.save(function(err){
                if (err === 'invalid') {
                    console.log('properties were invalid: '+JSON.stringify(obj), model.errors);
                    return rejected(err);
                } else if (err) {

                    return rejected(err);
                } else {

                    return resolved(model);
                }
            });
        });
    },

    insertItem : async function(obj) {

        var self =this,model = this.factory();

        return new Promise(function(resolved,rejected){

            model.property(obj);
            model.save(function(err){
                if (err === 'invalid') {
                    console.log('properties were invalid: '+JSON.stringify(obj), model.errors);
                    return rejected(err);
                } else if (err) {

                    return rejected(err);
                } else {

                    return resolved(model);
                }
            });
        });

    },
    getQueryString : function(query,queryData) {
        var queryObject =  this._queryKeys[this.getModelName() +query],query=this.getModelName() ;
        for (var i in queryObject) {
            var data = queryData[queryObject[i].fieldname];

            switch (queryObject[i].type ) {
                case 'string':
                    if (_.isString(data) ==false ){
                       assert(0,'not match string');
                    }
                    break;
                case 'integer':
                    if (_.isNumber(data) ==false ){
                        assert(0,'not match integer');
                    }
                    break;
            }

            query +=data;


        }

        return query;
      //  console.log(queryData)
    },
    _read : function (key) {
        var self=this;
        var model = this.factory();
        return new Promise(function (resolved,rejected) {
            model.load(key, function (err, properties) {
                if (err && err !=='not found') {
                    rejected(err);
                } else {

                    resolved(model);
                }


            });
        });
    },
    factory : function() {
        var connect = this.connect,data,self=this;

           data = this._getData();
           data.isLive = false;
           data._id = null;
            var model = new CurrentModel();
            model.init(data,connect,self);

        return model;
    },
    createQueryData : function(data,queryList) {
      //self.getQueryList()
        var query = this.getModelName();
        for (var i in queryList) {
            query +=  data[queryList[i].fieldname];
        }
        return query;
    },
    addQueryCache : function(key,query) {
        this._queryCache[key] = query;
    },
    getQueryCache : function(query) {
        if (typeof this._queryCache[query] !== 'undefined') {
            return this._queryCache[query];
        } else {
            return false;
        }
    },
    getQueryList : function() {
        return this._queryKeys;
    },
    queryPromise : function (obj,dataload,mode) {
        var self=this;
        var model = this.factory();




        return new Promise(function (resolved,rejected) {
            if (!_.isObject(obj)){
                return rejected('memory query error:'+ JSON.stringify(obj));
            }
            for (var key in obj) {
                if (typeof obj[key] === 'undefined') {
                    return rejected('memory query error: parameter error, '+ JSON.stringify(obj));
                }
                if (typeof self.schema.properties[key].index == 'undefined' ) {
                    return rejected('memory query  index error: parameter error, '+ JSON.stringify(obj));
                }


            }
            var rows=[],models=[],work=0,func='';

            // if (typeof dataload === 'undefined') {
            //     dataload = true;
            // }

            model.find(obj, function (err, ids) {

                if (err) {

                    return (err === 'not found') ? resolved([]) : rejected(err);

                }

                // if (!dataload) {
                //     resolved(ids);
                //     return;
                // }

              //  console.log(ids)
               //return resolved([]);

                if (ids.length > 0) {
                    for (var i=0; i < ids.length; i++) {
                        (function(key){
                            self._read(key)
                                .then(function (model) {

                                    models.push(model);
                                    work++;
                                    if (work ===ids.length ) {
                                        resolved(models);
                                    }
                                })
                                .catch(function (err) {
                                    rejected(err)
                                });
                        })(ids[i]);
                    }
                } else {
                    return resolved(models);
                }
            });



        })

    },

    /**
     *
     * @param event
     * @param callback
     */
    subscribe : function(event,callback) {
        var nohm = this.nohm,self=this;
        var model = nohm.factory(this.name);
        switch (event) {
            case 'create':
            case 'update':
            case 'save':
            case 'remove':
            case 'link':
            case 'unlink':
                break;
            default :
                assert(0);
                break;
        }
        model.subscribe(event, function (event) {
            // console.log('someModel with id'+event.target.id+' was updated and now looks like this:', event.target.properties);
            callback(event.target.id,event.target.properties);
        });

    },

    getModel : function(key,callback) {
        var nohm = this.nohm,self=this;

        var model = nohm.factory(this.name);
        model.load(key, function (err, properties) {
            if (err) {

                callback(err);
                return;
            }
            callback(null,model);
        });
    },
    deleteKey : function(key) {
        var db = Garam.getDB('redis');
        db.deleteKey(key);
    },
    remove : function(model,callback) {
        var nohm = this.nohm,self=this;
        if (!model) {
            model = nohm.factory(this.name);
        }
        model.remove({ // options object can be omitted
            silent: false, // whether remove event is published. defaults to false.
        }, function (err) {
            if (err) {

                console.log(err);
            }
            callback(err);
        });

    },
    deleteItem : function (model) {
        var self =this,nohm=this.nohm;

        if (!model) {
            model = nohm.factory(this.name);
        }
        return new Promise(function(resolved,rejected){
            model.remove({ // options object can be omitted
                silent: false, // whether remove event is published. defaults to false.
            }, function (err) {
                if (err) {

                    return rejected(err);
                }
                return resolved(null);
            });

        });
    },
    update : function(model,obj,callback) {
        if (!model) {
            Garam.logger().error('Not Found Model');
            callback('Not Found Model');
            return;
        }

        if (!obj) {
            Garam.logger().error('Not Found Save Data');
            callback('Not Found Save Data');
            return;
        }
        model.property(obj);
        model.save(function(err){
            if (err === 'invalid') {
                console.log('properties were invalid: ', model.errors);

                callback(err)
            } else if (err) {

                console.log(err); // database or unknown error
                callback(err);
            } else {
                callback(null);
            }
        });
    },


    getDefaultParam: function() {
        var data = {};
        for (var i in   this.schema.properties) {
            data[i] = this.schema.properties[i].defaultValue;
        }
        return data;
    },
    setParam : function(data) {
        if (typeof data === 'undefined') {
            data = {};
        }
        var param = this.getDefaultParam();

        for(var i in param) {

            if (data[i] || data[i] === false || data[i] ===0) {
                param[i] = data[i];
            }

        }

        return param;
    },
    /**
     *
     * @param field
     * @param type
     * @param unique
     * @param validations
     * @param index
     */
    addField : function(field,type,unique,validations,index) {
        assert(field);
        assert(type);


        this.schema.properties[field] = {};
        if (_.isObject(type)) {
            this.schema.properties[field].defaultValue = type.defaultValue;
            this.schema.properties[field].type = type.func;
        } else {
            this.schema.properties[field].type = type;
        }

        this.schema.properties[field].unique = unique ? unique : false;
        if (index) {
            this.schema.properties[field].validations = validations;
        }
        if (index) {
            this.schema.properties[field].index = index;
        }
        this.schema.properties[field].fieldname = field;


    },
    checkDbConnection: function(nohm, callback) {
        if(nohm.client.connected && nohm.client.ready) {
            callback(null);
        } else {
            var dbNm = Garam.getDB(this.namespace);
            dbNm.db.conn.reConnect(callback);
        }
    }
});

Model.extend = Garam.extend;