
var _ = require('underscore'),
    Garam = require('../../../Garam')
exports.Inmemory = Inmemory;

function Inmemory(modelName) {

    this.modelName =modelName;

}

Inmemory.prototype = {
    setSchema : function (properties) {

        this.properties = properties;
     },
    createData : function (data) {

        var model=  new Model(this.modelName);
        model._copy(this.properties);
        if (typeof data !== 'undefined') {
            var props = model.getProperties();

            for (var i in   props) {
                // if (props[i].index) {
                //     model._id = data[i];
                // }
                props[i].value = typeof data[i] !=='undefined' ?   data[i] : null;
            }

            assert(model._id);
        }
   
        return model;
    }
    
}


var Model = function (modelName) {
    this._properties = {};
    this.modelName =modelName;
    this.idxName = this.modelName +'Idx';

}

Model.prototype = {
    _copy : function (properties) {
        var props = _.clone(properties);
        for (var i in props) {
          this._properties[i] = props[i];
        }
    },
    setIdx : function (rs) {
        if (typeof rs === 'undefined') {
            assert(0,'해당 모델의 idx 값이 존재 하지 않습니다.',this.modelName);
        }
        if (_.isObject(rs)) {

            if (rs[this.idxName]) {
                this._id = rs[this.idxName];
            } else {
                Garam.logger().warn('InMemory ,invalid data type',this.idxName)
            }

        } else if (!_.isNaN(rs)) {
            this._id = rs;
        }

        //console.log('memory idx ' + this._id)
    },
    getIdx : function () {
      return this._id;  
    },
    getProperties : function () {
        return this._properties;
    },
    p : function (field) {
        var value = '';
        if (arguments.length === 2) {
            value = arguments[1];
        }
        if (arguments.length === 1 && _.isObject(field) ) {

            return this._setData(field);
        }
        if (this._properties[field].type ==='json' && !_.isObject(this._properties[field].value) && arguments.length === 1) {
            try {
                return JSON.parse(this._properties[field].value);
            }catch (e) {
                Garam.logger().warn('invalid json data ',field);
            }

        } else if ( arguments.length === 2) {
            this._properties[field].value = value;
        }

        return this._properties[field].value || null;
    },
    _setData : function (data) {
       
        var props = this.getProperties();
        for (var i in props) {
            // if (props[i].index) {
            //
            //     if (typeof this._id ==='undefined') this._id = data[i];
            // }
            props[i].value = typeof data[i] !=='undefined' ?   data[i] : props[i].value ? props[i].value : null;
        }
        
   
        if (typeof data[this.idxName] !== 'undefined') {
            this.setIdx(data[this.idxName]);
        }


        //assert(this._id,'not found model idx');
    },
    queryString : function () {
        
    },

    save : function (callback) {
      
        var inMemoryModel =Garam.getModel(this.modelName,'inmemory');
        inMemoryModel._update(this,function (err) {
            callback(err);
        });
    }
}

exports.InmemoryModel = Model;