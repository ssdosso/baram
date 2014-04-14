//var assert  = require('assert')
//fs = require('fs');
//var data = {status:"ok", message:"Message received"};
//describe('Example', function() {
//    describe('오브젝트인지 확인', function() {
//        it('1+1 should be 2', function() {
//            assert(data, {status:"ok", message:"Message received"})
//
//        });
//    });
//
//
//});

var _ = require('underscore');

function baramTest() {

    //this.test();
}
//Baram.extend(baramTest.prototype,Base.prototype,{
//    test : function() {
//
//        this.callParent('test');
//    },
//
//})
//function subClass() {
//    this.base();
//
//}
//
//Baram.extend(subClass.prototype,baramTest.prototype,{
//    test : function() {
//        this.callParent('test');
//    }
//})
//
//var d = new subClass;



function Base() {

    console.log(111);

}

_.extend(Base.prototype, {

    callParent : function(method) {
         this.$owner[method].apply(this,arguments.callee.caller.arguments)
    },

    super : function() {
          console.log(1212);
    },
    base : function() {



        //this.$owner.constructor.apply(this,arguments)
    }

});


var Baram = {};

Baram.extend = function(def,superClass) {
    if (Base == superClass.constructor) {

        // console.log(superClass.constructor);
      //  superClass.constructor.apply(this,arguments);
    }
    if(superClass.$owner) {
        console.log(111);
    }
    def.$owner = superClass;
    _.extend.apply(this,arguments);

}
Baram.Server = function() {

}

Baram.extend(Baram.Server.prototype, Base.prototype, {
    super : function() {
        console.log(3333)
    }
});

Baram.Test = function() {

}

Baram.extend(Baram.Test.prototype, Baram.Server.prototype, {
    super : function() {
        Baram.Server.prototype.super.apply(this,arguments)
    }
});

var a = new Baram.Test();
a.super();