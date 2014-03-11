var fs = require('fs');

fs.readdirSync(__dirname).forEach(function (file) {

    stats = fs.statSync(__dirname + '/' + file);

    if (stats.isFile()) {
        if (file != 'index.js') {
            var c = require(__dirname + '/' + file);

            for (var classname in c) {

                exports[classname] = c[classname];

            }

           // exports[c.classname] = c;
        }
    } else if (stats.isDirectory()) {
        exports[file] = require(__dirname + '/' + file);
    }
});
