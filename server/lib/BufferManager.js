var _ = require('underscore')
    , fs = require('fs')
    , Garam = require('./Garam')
    , Base = require('./Base')
    , domain = require('domain')
    , redis = require('socket.io-redis')
    ,Int64BE = require("int64-buffer").Int64BE
    ,Uint64BE = require("int64-buffer").Uint64BE
    , assert= require('assert');

exports = module.exports = BufferManager;

function BufferManager (mgr, name) {
    Base.prototype.constructor.apply(this,arguments);
    this.buffers = {};
}

_.extend(BufferManager.prototype, Base.prototype, {
    createBuffer : function(options) {
        if (typeof options === 'undefined') {
            assert(0,'options does not exist');
        }
        if (_.isNull(options.name)) {
            assert(0,'options.name does not exist');
        }

        this.buffers[options.name] =  Buffer.alloc();
        this.buffers[options.name] .create(options);
        return this.buffers[options.name];
    },
    clear : function(buffer) {

        delete  this.buffers[buffer.bufferName];
    }
});


var FieldType =  {
    'uint8':1,
    'int8':1,
    'uint16':2,
    'int16':2,
    'uint32':4,
    'int32':4,
    'uint64':8,
    'int64':8,
    'float':8
}
var FieldFuncType =  {
    'uint8':'writeUInt8',
    'int8':'writeInt8',
    'uint16':'writeUInt16',
    'int16':'writeInt16',
    'uint32':'writeUInt32',
    'int32':'writeInt32',
    'float':'writeFloat',
    'uint64':'Uint64BE',
    'int64':'Int64BE'
}


var FieldReadFuncType =  {
    'uint8':'readUInt8',
    'int8':'readInt8',
    'uint16':'readUInt16',
    'int16':'readInt16',
    'uint32':'readUInt32',
    'int32':'readInt32',
    'float':'readFloat',
    'uint64':'Uint64BE',
    'int64':'Int64BE'
}


function buffer (mgr, name) {
    Base.prototype.constructor.apply(this,arguments);


}

_.extend(buffer.prototype, Base.prototype, {
    create : function(options){
        this.fields = {};
        this.length = 0;
        this.endian = options.endian ? options.endian : 'BE';
        this.bufferName  = options.name;
    },
    add : function(name,type,order) {
        if (typeof type ==='undefined') {
            assert(0);
        }
        if (typeof FieldType[type] === 'undefined') {
            assert(0,type);
        }

        if (typeof order === 'undefined') {
            order = this.length;
        }
        this.fields[name]  = {
            buffer :Buffer.alloc(FieldType[type]),
            type :type,
            order : order,
            name : name

        };
        switch (this.fields[name].type) {
            case 'uint8':
            case 'int8':
                this.fields[name].writeFunc =  FieldFuncType[type];
                this.fields[name].readFunc =  FieldReadFuncType[type];
                break;
            case 'int64':
            case 'uint64':
                this.fields[name].writeFunc =  FieldFuncType[type];
                this.fields[name].readFunc =  FieldReadFuncType[type];
                break;
            default:
                this.fields[name].writeFunc =  FieldFuncType[type] +this.endian;
                this.fields[name].readFunc =  FieldReadFuncType[type]+this.endian;
                break;
        }
        this.length++;
    },
    write : function(name,value,offset) {
        if (typeof name ==='undefined') {
            assert(0);
        }
        if (typeof  this.fields[name] === 'undefined') {
            assert(0);
        }
        if (typeof offset === 'undefined') {
            offset = 0;
        }
        var field = this.fields[name];
        var fieldBuffer = field.buffer;

        var writeFunc = field.writeFunc;
        switch (this.fields[name].type) {
            case 'int64':
                var buff =  new Int64BE(value);
                field.buffer= buff.buffer;
                break;
            case 'uint64':
                var buff =  new Uint64BE(value);
                field.buffer= buff.buffer;
                break;
            default:
                fieldBuffer[writeFunc](value,offset);
                break;
        }



    },
    merge : function() {

        var list = [],buffers=[];

        for ( var i in this.fields ) {
            list.push(this.fields[i]);
        }
        list.sort(function(a, b) {return a.order - b.order});

        for (var i in list) {
            buffers.push(list[i].buffer);
        }
        var buf = Buffer.concat(buffers);

        for ( var i in this.fields ) {
            this.write(i,0); //초기화
        }

        return buf;

    },
    read : function(buffer) {
        var list = [],buffers=[],length,readFunc,data={},offset=0;
        for ( var i in this.fields ) {
            list.push(this.fields[i]);
        }
        list.sort(function(a, b) {return a.order - b.order});
        for (var i = 0; i < list.length; i ++) {
            length = list[i].buffer.length;
            readFunc = list[i].readFunc;

            switch (list[i].type) {
                case 'int64':
                    var buff =  new Int64BE(buffer,offset);
                    data[list[i].name] = buff.toString();
                    break;
                case 'uint64':
                    var buff =  new Uint64BE(buffer,offset);
                    data[list[i].name] = buff.toString();
                    break;
                default:
                    data[list[i].name] = buffer[readFunc](offset);
                    break;
            }

            offset = offset + length;

        }
        return data;

    }

});