/**
 * Created by chocoh on 2014-09-28.
 */

var
    Baram = require('../../server/lib/Baram')
    ,Express = require('express')
    ,Application = require('../../server/lib/Application');

var Backbone = require('backbone')
    , _ = require('underscore');




var App = Application.extend({
    type :'cluster',
    create : function() {

        this.on('workerEventTest',function(a,b,c){
            console.log(arguments)
        });

    },
    main: function(callback) {

    }


});



exports.app  =App;
exports.className  = 'ClusterController';