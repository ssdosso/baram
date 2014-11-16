/**
 * Created with JetBrains WebStorm.
 * User: ssdosso , ssdosso@naver.com
 * Date: 13. 07. 15
 * Time: 오후 4:50
11
 */




var Baram = require('./server/lib/Baram');


//
var baram = Baram.getInstance();


baram.create({
    config: [
        {short:"p",long:"port",description:"port", value:true},
        {short:"d",     long:"useDB",           description:"데이터베이스 사용여부", value:true, parser:function (value) {
            if (value == 'true') {
                return true;
            } else {
                return false;
            }
        }},
        {short:"s",long:"single",  description:"single process 사용여부 ", value:true, parser:function (value) {
            if (value == 'true') {
                return true;
            } else {
                return false;
            }
        }}
    ]

});


/**
 * port listen 한 후
 */
baram.on("initialize:after", function(options){
    //test

    baram.configure(function(){

        baram.set('application',true);
        baram.set('appDir','application');
        baram.start();

    });
});




