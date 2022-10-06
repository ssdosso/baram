var EventEmitter = require('events').EventEmitter
    ,_ = require('underscore')
    , Garam = require('../../Garam')
    , Backbone = require('backbone')
    , Mssql  = require('mssql')
    , format = require('util').format
    , assert= require('assert');

exports = module.exports = DB_SQL;


function DB_SQL () {
    this._query = '';
    this._ready = false;
    this._stream = false;
    this._input = {};
    this._output = {};
    this._model =  new Backbone.Collection();
    this._dataType = {
        'int':0,
        'bigint':null,
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
    }
}


_.extend(DB_SQL.prototype, EventEmitter.prototype, {
    create : async function() {},
    run : function() {

    },
    set : function(key,name){
        this[key] = name;
    } ,
    isReady: function() {
        return this._ready;
    },
    setReady : function() {
        this._ready = true;
    },
    setStream : function(stream) {
        this._stream = true;
    },
    isStream : function() {
        return this._stream;
    },
    addInput : function(input) {
        assert(input.name);
        assert(input.type);

        this._input[input.name] = input;
    },
    addOutput : function(output) {

        assert(output.name);
        assert(output.type);

        this._output[output.name] = output;
    },
    setDP : function(dp) {
        this._dp = dp;
    },
    setQuery : function(query) {
        this._query = query;
    },
    getQuery : function() {
        return this._query;
    },
    getProcedure : function() {
        return this._dp;
    },
    setParameter : function(data) {
        this.setData = false;
    },

    addData : function(data) {
       // console.log(data)
        var self = this;
        if (_.isArray(data)) {
            _.each(data,function(row){

                self._model.add(row);
            });
        }
       // this._model.add({});
    },
    getModel : function() {
        return this._model;
    },

    execute : function(params,callback,scope) {

        var db = Garam.getDB(this.namespace),self =this,useStream=false;

        if (typeof isStream !== "undefined" && isStream === true) {
            useStream = true;
        }

        if (!scope) {
            scope = this;
        }
        if (!params) {
            params = [];
        }



        (function(parameters,inputFields,outFields,next,scope) {
            var param;


            for(var i in parameters) {
                param = parameters[i];
                if (typeof inputFields[param.name] !== 'undefined') {
                    if (param.value ===0) {
                        inputFields[param.name].value = 0;
                    } else {
                        inputFields[param.name].value = param.value || self._dataType[ inputFields[param.name].type];
                    }
                } else if(typeof outFields[param.name] !== 'undefined') {
                    outFields[param.name].value = param.value || self._dataType[ outFields[param.name].type];
                }
            }

            db.connection().getConnection(function(err,conn) {

                var request =  conn.request();

                // request.stream = true;
                __exec.call(self,self._dp,inputFields,outFields,request);
            });

            function __exec(procedure,InputParams,outputParams,request) {

                var dataType,inputType,rows=[],dbError=false,outType;
                for (var i in InputParams) {
                    var inputData = InputParams[i];
                    assert(inputData.name);
                    dataType =  db.connection().getDataType();
                    inputType = typeof(inputData.length === 'undefined') ? dataType[inputData.type] :dataType[inputData.type](inputData.length);
                    if (typeof inputType === 'undefined') {
                        Garam.logger().error('dp data type error '+ inputData.type);
                        return;
                    }

                    request.input(inputData.name,inputType ,inputData.value);
                    // request.input(inputData.name,sql.VarChar(20) );
                }


                for (var i in outputParams) {
                    var outData = outputParams[i];
                    dataType =  db.connection().getDataType();
                    outType = typeof(outData.length === 'undefined') ? dataType[outData.type] :dataType[outData.type](outData.length);
                    if (typeof outType === 'undefined') {
                        Garam.logger().error('dp data type error '+ outData.type);
                        return;
                    }

                    request.output(outData.name,outType ,outData.value);
                }

                if (self._stream) {
                    request.stream = true;
                    var rows= [],error=null;
                    request.on('recordset', function(columns) {

                    });
                    request.on('row', function(row,a) {
                            rows.push(row);

                    });

                    request.on('error', function(err) {
                         error= err;
                    });
                    request.on('done', function(affected) {

                        callback(error,rows);
                        // Always emitted as the last one
                       //console.log(rows)
                    });
                    request.execute(procedure);
                } else {
                    request.execute(procedure, function(err, recordsets, returnValue) {

                      //  next.call(scope,err,recordsets);   게임서버

                        callback.apply(scope, [err].concat(recordsets));

                    });
                }

            }
        })(params,_.clone(this._input),_.clone(this._output),callback,scope);





    }


});

DB_SQL.extend = Garam.extend;