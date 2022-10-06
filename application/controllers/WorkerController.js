
const
    Garam = require('../../server/lib/Garam')
    ,Express = require('express')
    ,Application = require('../../server/lib/Application');

const Backbone = require('backbone')
    , _ = require('underscore');

const util = require('util');

exports.className  = 'worker';
exports.app = Application.extend({
    workerOnly : false,
    init : function() {
        var self = this;

         if (!Garam.isMaster()) {
           // var testMessage = this.getTransaction('testMessage').addPacket({msg:'test'})
          //   Garam.getWorker().send(testMessage);
        }



    },


    main: function(callback) {

        callback();

    }


});


