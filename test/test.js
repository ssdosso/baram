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

var Baram = require('../server/lib/Baram');
var Base = require('../server/lib/Base');
function baramTest() {

    this.test();
}
Baram.extend(baramTest.prototype,Base.prototype,{
    test : function() {

        this.callParent('test');
    },

})
function subClass() {
    this.base();

}

Baram.extend(subClass.prototype,baramTest.prototype,{
    test : function() {
        this.callParent('test');
    }
})

var d = new subClass;


