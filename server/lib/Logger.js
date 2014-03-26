var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Baram = require('./Baram')
    , winston = require('winston')
    , assert= require('assert');

exports = module.exports = Logger;

function Logger (mgr, name) {
    this.options = {
        log:true,
        info:true,
        warn:true,
        file:true,
        console:true,
        mail:true
    };
    this.trigger = require('./triggerMethod');
    //this.init();

  // setInterval(this.init,84600 * 1000)

};

_.extend(Logger.prototype, EventEmitter.prototype, {
        init : function() {
            this._createLogFile();

        },
        _createLogFile: function() {
            var dt = new Date;
            var month = dt.getMonth()+1;
            var day = dt.getDate();
            var year = dt.getFullYear();
            this.currentMonthdir = year.toString()+month.toString();
            this.dir =Baram.getInstance().get('logDir');
            if (!fs.existsSync(this.dir)) {
                this.dir = './logs';
                fs.mkdirSync( this.dir);
            }
            this.currentDir = this.dir+'/'+this.currentMonthdir;
            if (!fs.existsSync(this.currentDir)){
                fs.mkdirSync( this.currentDir);
            }

            var logFile =  this.currentDir +'/'+year.toString() +month.toString()+day.toString()+'.log';
            this.logger = new (winston.Logger)({
                transports: [
                    new (winston.transports.Console)(),
                    new (winston.transports.File)({ filename: logFile})
                ]
            });

            setInterval(this._createLogFile,84600 * 1000);
        },
        info : function() {
             this.logger.info.apply(this.files, arguments);
        } ,
        error: function(log,err) {

            this.logger.error.apply(this.files, arguments);

        } ,
        warn: function() {
            this.logger.warn.apply(this.files, arguments);
        }
});