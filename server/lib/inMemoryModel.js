var EventEmitter = require('events').EventEmitter
    ,_ = require('underscore')
    , Garam = require('./Garam')
    , Backbone = require('backbone')
    , format = require('util').format
    , Inmemory = require('./database/drivers/inmemoryObject/Inmemory')

    , assert= require('assert');
var Type = require('./Types');
exports = module.exports = Model;




function Model (type,namespace) {
    this.conn = null;
    this.ready = false;
    this.type = type;
    this.namespace = namespace;
    this._query = '';
    this._ready = false;
    this._stream = false;
    this._input = {};
    this._output = {};
    this._model =  new Backbone.Collection();
    this._dataType = {
        'bit':0,
        'int':0,
        'bigint':0,
        'money':null,
        'numeric':null,
        'smallint':null,
        'smallmoney':null,
        'real':null,
        'tinyint':null,
        'char':null,
        'nchar':null,
        'text':null,
        'varchar':null,
        'nvarchar':null,
        'xml':null,
        'time':null,
        'date':null,
        'dateTime':null,
        'dateTime2':null,
        'dateTimeOffset':null,
        'smallDateTime':null,
        'uniqueIdentifier':null,
        'binary':null,
        'varBinary':null,
        'image':null,
        'UDT':null,
        'geography':null,
        'geometry':null,
        'float' :null

    }
    this.indexField = null;
}


_.extend(Model.prototype, EventEmitter.prototype, {
    create : function() {

    },
    getModelName : function () {
        return this.name;
    },
    setName : function(name) {
        this.name = name;
    },
    _create : function(dbName) {
        if (typeof dbName ==='undefined') {
            dbName = 'redis';
        }
        this.schema = {properties:{},publish:true};

        this._procedureList = {};

       
         //Garam.getDB(dbName).getConnection(),self=this;
        // //require.uncache('nohm');
        //

         //console.log(Garam.getDB(this.namespace))
         this.create();




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
    setDefault : function (obj) {

        // if (obj.id) {
        //     this.setId(obj.id);
        // }
        this._setProcedure();
        var options,procedure;
        if (obj.proceduresOptions) {
         for(var procedureType in obj.proceduresOptions) {
              options = obj.proceduresOptions[procedureType];
              if (this._procedureList[procedureType]) {
                  procedure = this._procedureList[procedureType];
                  this._procedureList[procedureType] = {
                      procedure:procedure.procedure,
                      arguments:options
                  };
              } else {
                  this._procedureList[procedureType] ={
                      procedure :'P_'+this.name+'_'+procedureType,
                      arguments : options
                  }
              }

         }

        

        }
    },
    addProcedure : function (key,type) {
        if (type.indexOf('P_') != -1) {
            assert(0,'invalid type argument');
        }
        this._procedureList[key] = 'P_' + this.name + '_'+type;
    },
    createModel : function(callback,scope) {

        this.ready = true;
        Garam.logger().info('create Model '+this.name);

        this.inmemory =  new Inmemory.Inmemory(this.name);
        this.inmemory.setSchema(this.schema.properties);
        if (typeof callback ==='function') {
            callback.call(scope);
        }
    },
    _setProcedure : function () {
        this._procedureList['get'] = {
            procedure :'P_' + this.name + '_Get'
        };
        this._procedureList['set'] = 'P_' + this.name + '_Set';
        this._procedureList['del'] = 'P_' + this.name + '_Del';
        this._procedureList['put'] = 'P_' + this.name + '_Update';

    },

    getProcedure : function (type) {
        if (typeof this._procedureList[type] ==='undefined') {
            assert(0,'not found getProcedure type');
        }
        return this._procedureList[type];

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
   

    checkParam : function (field,value) {

        switch (this.schema.properties[field].type) {
            case 'int':
            case 'float':
            case 'bit':
            case 'bigint':    
                return 'int';
                break;
            case 'json':

                return 'json';
                break;
            default :
                return 'string';
                break;
        }
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

        if (!model) {
            Garam.logger().error('Not Found Model');
            callback('Not Found Model');
            return;
        }


        var modelCheck = model instanceof Inmemory.InmemoryModel;
        if (  !modelCheck ) {
            assert(0,'넘어온 인자값의 형식이 옳바르지 않습니다.');
        }

        var query = this.queryString(model,'del','del'),self=this;

        this.executeDB(query,'del',function (err,rs) {
           
            if (err) {
                callback(err);
                return;
            }
            if (_.isArray(rs) && rs.length > 0) {
                rs =rs.pop();
            } else {
                callback('in memory result error');
                return;
            }

            if (rs.result ===0) {
                callback(err,model);
            } else {
                callback('insert error ,'+self.namespace)
            }
        });

        // assert(this.indexField);
        // var id = model.property(this.indexField);
        //
        // model.remove({ // options object can be omitted
        //     silent: false, // whether remove event is published. defaults to false.
        // }, function (err) {
        //     if (err) {
        //
        //         console.log(err);
        //     }
        //     callback(err);
        // });

    },
    update : function(model,obj,callback) {
        if (!model) {
            Garam.logger().error('Not Found Model');
            callback('Not Found Model');
            return;
        }

        var modelCheck = model instanceof Inmemory.InmemoryModel;
        if (  !modelCheck ) {
            assert(0,'넘어온 인자값의 형식이 옳바르지 않습니다.');
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


                callback(err);
            } else {
                callback(null);
            }
        });
    },
    queryString : function (model,procedureType,queryType) {

        var prop = model._properties,jsonStr,procedure,queryData;

        if (typeof queryType ==='undefined') {
            queryType = 'set';
            if (!this._procedureList[procedureType]) {
                assert(0);
            }
             procedure = this._procedureList[procedureType];

        } else {
            switch (queryType) {
                case 'get':
                    procedure = procedureType.procedure;
                    break;
                case 'put':
                    procedure = this._procedureList[procedureType];

                    break;
                case 'set':
                    procedure = this._procedureList[procedureType];
                    break;
                case 'del':
                    procedure = this._procedureList[procedureType];

                    break;
            }

        }

        if (typeof procedure === 'undefined') {
            assert(0,'not found procedure');
        }

        switch (queryType) {
            case 'get':
                var index = 0;
                if (procedureType.arguments) {
                    for ( var i in prop) {
                        delete prop[i].queryIndex;
                    }
                    for (var i in procedureType.arguments) {

                        prop[procedureType.arguments[i]].queryIndex = index;
                        index++;
                       // console.log(procedureType.arguments[i]);
                    }

                }
                queryData=   getQuery.call(this);
                break;
            case 'set':
                queryData=   setQuery.call(this);
                break;
            case 'put':
                queryData=   putQuery.call(this);
                break;
            case 'del':

                queryData=   deleteQuery.call(this);
                break;
        }


        return "exec "+procedure+" "+queryData.join(',');


        function deleteQuery() {
            var queryParam = [];

            queryParam.push(model.getIdx());
            
            return queryParam;
        }

        function getQuery() {
            var params = [],queryParam=[];
          
            for (var i in prop) {
                if(typeof prop[i].queryIndex !== 'undefined') {
                    params[prop[i].queryIndex] =  [prop[i].name,prop[i].value];
                }
            }


           // console.log(params)

            for ( var i in params) {
                switch (this.checkParam(params[i][0])) {
                    case 'int':
                        if (params[i][1] === null) {
                            assert(0,'query data 가 존재 하지 않습니다..',i);
                        }
                        queryParam.push( params[i][1] );
                        break;
                    case 'string':

                        if (params[i][1] === null || params[i][1] =='') {
                            assert(0,'query data 가 존재 하지 않습니다..',i);
                        }
                        queryParam.push("'"+params[i][1] +"'");
                        break;
                }
            }
            return queryParam;
        }
        function _checkIntData(prop,queryType,list) {
            assert(_.isArray(list));
            if (prop.value !== null) list.push(prop.value);
            else {
                if (!prop.nullOptions && queryType ==='set') {
                    assert(0,'해당 필드는 null 을 허용하지 않습니다.',i);
                }
                list.push( 0 );
            }
        }
        function _checkStringData(prop,queryType,list) {
            if(prop.value !== null) list.push("'"+prop.value +"'");
            else {
                if (!prop.nullOptions && queryType ==='set') {
                    assert(0,'해당 필드는 null 을 허용하지 않습니다.',i);
                }
                list.push('null');
            }
        }
        function _checkJsonData(prop,queryType,list) {
            if (prop.value !== null) {
                jsonStr = JSON.stringify(prop.value);
            } else {
                if (!prop.nullOptions  && queryType ==='set') {
                    assert(0,'해당 필드는 null 을 허용하지 않습니다.',i);
                }
                list.push('null');
            }

            list.push("'"+jsonStr+"'");
        }

        function putQuery() {
            var queryParam = [];

            queryParam.push(model.getIdx());

            for ( var i in prop) {
                switch (this.checkParam(i,prop[i].name )) {
                    case 'int':
                        _checkIntData(prop[i],queryType,queryParam);

                        break;
                    case 'string':
                        _checkStringData(prop[i],queryType,queryParam);

                        break;
                    case 'json':
                        _checkJsonData(prop[i],queryType,queryParam);
                        break;
                }
            }
            return queryParam;

        }
        function setQuery() {
            var queryParam = [];
            for ( var i in prop) {
                switch (this.checkParam(i,prop[i].name )) {
                    case 'int':
                        _checkIntData(prop[i],queryType,queryParam);

                        break;
                    case 'string':
                        _checkStringData(prop[i],queryType,queryParam);

                        break;
                    case 'json':
                        _checkJsonData(prop[i],queryType,queryParam);
                        break;
                }
            }
            return queryParam;
        }



    },
    query : function(params,procedureType,callback) {
     
       if (typeof procedureType ==='function') {
           callback = procedureType;
           procedureType = 'get';
       }

        function contains(a, obj) {
            var i = a.length;
            while (i--) {
                if (a[i] === obj) {
                    return true;
                }
            }
            return false;
        }
        if (!_.isObject(params)){
            Garam.logger().error(params);
            assert(0);
            return;
        }
        if (!this._procedureList[procedureType]) {
            assert(0,'not found _procedureList');
        }

        var procedure = this._procedureList[procedureType],checkParam=true;
            if (procedure.arguments) {
                for (var i in params) {
                    if (!contains(procedure.arguments,i)) {
                        checkParam= false;
                    }
                }
               if (!checkParam) {
                   assert(0,'주어진 인자값이 해당 프로시저의 인자값가 일치 하지 않습니다.',procedure.arguments);
               }

                var model = this.inmemory.createData();
               // console.log('params',params)
                model.property(params);

                var query = this.queryString(model,procedure,'get');
                // console.log('### q ' , query,model)
                this.executeDB(query,'get',function (err,rs) {

                    if (err) {
                        callback(err);
                        return;
                    }



                    callback(null,rs);



                });


            }
        

    },
    _update : function (model,callback) {
        var query = this.queryString(model,'put','put'),self=this;

        this.executeDB(query,'put',function (err,rs) {

      
            if (err) {
                callback(err);
                return;
            }
            if (_.isArray(rs) && rs.length > 0) {
                rs =rs.pop();
            } else {
                callback('in memory result error');
                return;
            }
            
            if (rs.result ===0) {
                callback(err,model);
            } else {
                callback('insert error ,'+self.namespace)
            }
        });
    },
    insert : function(obj,callback) {
        // var nohm = this.nohm;
        // var model = nohm.factory(this.name);
        var model = this.inmemory.createData(),self=this;
        model.property(obj);

    
        var query = this.queryString(model,'set');
      
        this.executeDB(query,function (err,rs) {

            if (err) {
                callback(err);
                return;
            }

            if (_.isArray(rs) && rs.length > 0) {
                rs =rs.pop();
            } else {
                callback('in memory result error');
                return;
            }
         
            if (rs.result ===0) {

                model.setIdx(rs);
                callback(err,model);
            } else {
                callback('insert error ,'+self.namespace)
            }

        });

    },
    executeDB : function (query,callback) {
        var db = Garam.getDB(this.namespace),self =this,type='set';
        db.connection().getConnection(connection);

        if (arguments.length > 2) {
            type= arguments[1];
            callback = arguments[2];
        }
        function connection(err,conn) {
            var request =  conn.request();
            if (err) {
                callback(err);
                return;
            }

            request.query(query).then(function (recordSet) {
                switch (type) {
                    case 'set' :
                        callback(null,recordSet);
                        break;
                    case 'get':


                       var model,models=[];
                        for (var i in recordSet) {
                         
                            if (_.isObject(recordSet[i])) {
                                 model = self.inmemory.createData();
                                 model.property(recordSet[i]);
                                 models.push(model);
                            }
                        }
                        callback(null,models);
                        break;
                    case 'put':
                        callback(null,recordSet);
                        break;
                    case 'del':
                        callback(null,recordSet);
                        break;
                }

                // if (recordSet.length > 0) {
                //
                //     for ( var i = 0; i < recordSet.length; i ++) {
                //         inmemoryRows.push(self.inmemory.createData(recordSet[i]));
                //     }
                //     callback(null,inmemoryRows);
                // }
            }).catch(function (err) {
               // console.log(err.message)

                if (_.isObject(err) && typeof err.message !=='undefined') {
                    Garam.logger().error(err.message);
                    callback(err.message);
                    return;
                }
                Garam.logger().error(err);
                callback(err);
            });
        }
    
    },

    /**
     *  삭제에서 사용될 모델
     * @param field
     */
    setId : function (field) {
        this.schema.properties[field].index = true;
        this.indexField = field;
    },
    /**
     *
     * @param field
     * @param type
     * @param unique
     * @param validations
     * @param index
     */
    addField : function(field,type,options) {
        assert(field);
        assert(type);
        if (typeof options === 'undefined' || !_.isObject(options)) {
            options = {};
        } 
        
        this.schema.properties[field] = {};
        // if (_.isObject(type)) {
        //     this.schema.properties[field].defaultValue = type.defaultValue;
        //     this.schema.properties[field].type = type.func;
        // } else {
        //    
        // }
        //기본값 치환
        this.schema.properties[field].name = field;

        switch (type) {
            case 'integer':
                this.schema.properties[field].type = 'int';
                this.schema.properties[field].value = this._dataType['int'];
                break;
            case 'float':
                this.schema.properties[field].type = 'float';
                this.schema.properties[field].value = this._dataType['float'];
                break;
            case 'boolean':
                this.schema.properties[field].type = 'bit';
                this.schema.properties[field].value = this._dataType['bit'];
                break;
            case 'timestamp':
                this.schema.properties[field].type = 'bigint';
                this.schema.properties[field].value = this._dataType['bigint'];
                break;
            case 'json':
                this.schema.properties[field].type = 'json';
                this.schema.properties[field].value = this._dataType['text'];
                break;
            case 'string':
                this.schema.properties[field].type = 'nvarchar';
                this.schema.properties[field].value = this._dataType['nvarchar'];
                break;
        }
        this.schema.properties[field].options = options;
        if (typeof options.isNull ==='undefined' || options.isNull === false) {
            this.schema.properties[field].nullOptions = false;
        } else {
            this.schema.properties[field].nullOptions = true;
        }
        
        // if (typeof key !== 'undefined' && key ===true)  {
        //     this.setId(field);
        // }
        // this.schema.properties.p = function (field) {
        //     return this[field].value;
        // }
        // this.schema.properties.data = function (field) {
        //     return this[field].value;
        // }
        // if (length) {
        //     this.schema.properties[field].length = length;
        // }



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