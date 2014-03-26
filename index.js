/**
 * Created with JetBrains WebStorm.
 * User: ssdosso , ssdosso@naver.com
 * Date: 13. 07. 15
 * Time: 오후 4:50
11
 */




var Baram = require('./server/lib/Baram');


//
var app = Baram.getInstance();


app.start({
    config: [
        {short:"p",long:"port",description:"port", value:true},
        {short:"c",     long:"cache",           description:"cache 사용여부", value:true, parser:function (value) {
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
app.on("initialize:after", function(options){
    //test
    app.configure(function(){

        app.set('application',true);
        app.set('appDir','application');
    });
});


app.on('initialize:transport',function(server){

});