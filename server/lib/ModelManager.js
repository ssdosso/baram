var EventEmitter = require('events').EventEmitter
    _ = require('underscore')
    , Garam = require('./Garam')

    , format = require('util').format
    , assert= require('assert');

exports = module.exports = ModelManager;

function ModelManager () {

    this.models = {};
    this.redisModels = {};
    this.inMemoryModels={};
}


_.extend(ModelManager.prototype, EventEmitter.prototype, {
    create : function() {
    },
    set : function(name,model) {
      //  console.log(model.modelType)
       // this.models[name] = model;
        
        switch (model.modelType) {
            case 'redis':
                
                this.redisModels[name] = model;
                break;
            case 'inmemory':
                this.inMemoryModels[name] = model;
                break;
        }

    },
    get : function(name,type) {

        if (typeof type ==='undefined') {
            type = 'redis';
        }

       switch (type) {
           case 'redis':


               return this.redisModels[name];

               break;
           case 'inmemory':
               return this.inMemoryModels[name];
               break;
       }
    }



});

ModelManager.extend = Garam.extend;