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
        console.log(121212)
        this.on('workerEventTest',function(a,b,c){
            console.log(arguments)
        });

    },
    main: function(callback) {

    }


});

module.exports = Baram.getInstance().createAppInstance('ClusterController',App);
