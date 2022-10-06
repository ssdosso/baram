/**
 * Created by megan on 2016-01-05.
 */

var _ = require('underscore')
    , fs = require('fs')
    , Garam = require('./Garam')
    , Base = require('./Base')
    , json2csv = require('json2csv');

exports = module.exports = File;

function File(mgr, name){
    Base.prototype.constructor.apply(this, arguments);
}

_.extend(File.prototype, Base.prototype, {
    jsonToCSV : function(jsonData, bTitle, callback){
        json2csv({ data: jsonData, fields: null, hasCSVColumnTitle: bTitle }, function(err, csv){
            if (err) Garam.logger().error(err);

            Garam.logger().info('Converted to CSV');

            callback(err, csv);
        });
    },
    createFile : function(file, data, callback){
        fs.writeFileSync(file, data, function(err){
            if(err) throw err;

            Garam.logger().info(file + ' saved');

            callback(err);
        });
    }
});