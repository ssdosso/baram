var EventEmitter = process.EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
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
    this.init();

   setInterval(this.init,84600 * 1000)

};

_.extend(Logger.prototype, EventEmitter.prototype, {
    init : function() {
          var dt = new Date;
          var month = dt.getMonth()+1;
          var day = dt.getDate();
          var year = dt.getFullYear();
          var logFile = year.toString() +month.toString()+day.toString()+'.log';

              this.logger = new (winston.Logger)({
                  transports: [
                      new (winston.transports.Console)(),
                      new (winston.transports.File)({ filename: './logs/'+logFile })
                  ]
              });
          },
          info : function() {
             this.logger.info.apply(this.files, arguments);
          } ,
        error: function(log,err) {
          //  console.log(arguments)
            this.logger.error( log);

            this.logger.error(err.stack);

        } ,
        warn: function() {
            this.logger.warn.apply(this.files, arguments);
        }
});