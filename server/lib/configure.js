var _ = require('underscore')
    , Optparse = require('./optparse')
    , fs = require('fs')
    , Base = require('./Base')
    , Garam = require('./Garam')
    , assert= require('assert');
const {addWhitelist} = require("ddos/lib");

exports =  module.exports  = BlueConfigure;
function BlueConfigure(settingModel) {

    Base.prototype.constructor.apply(this,arguments);
    this._user_options = {};
    this.settingModel = settingModel;


}
_.extend(BlueConfigure.prototype, Base.prototype, {
    loadJson :async function(options,appDir) {


        try {
            let scope = this,userOpt;

            this.appDir = appDir;
            this.userOpt =  userOpt = Optparse.parse(options, true);

            for (var i in options) {
                this._user_options[options[i].long] = options[i].value;
                for (var j in userOpt) {
                    if (j ===options[i].long) {
                        this._user_options[options[i].long] = userOpt[j];
                    }
                }

            }

            await this.readJsonFile('conf');
            this.merge(scope.userOpt);

        } catch (e) {
            Garam.logger().error(e)
        }


        // this.readJsonFile( 'conf', function () {
        //
        //     this.merge(scope.userOpt);
        //     Garam.getInstance().emit('onloadConfig');
        //
        // });


    },
    get: function(key) {
        return this.settingModel.get(key);
    },
    set: function(key,val) {
        return this.settingModel.set(key,val);
    },
    /**
     * 외부 command 옵션을 읽어 들인다.
     * @param options
     */
    merge :function(options) {
        var scope = this;


        // options =  Optparse.parse(options, true);
        for (var key in options) {
            if (key.length < 2) {
                delete options[key]
            }
        }

        for (var key in options) {
            switch(key) {
                case 'port':

                    var service = this.settingModel.get('service');
                    service.port = options[key];

                    break;
                default :
                    this.settingModel.set(key,options[key]);
                    break;
            }
        }




    },
    jsonFileRead:function (root, callback) {
        this.setSettings(root, 'root', false, function () {
            callback();
        });
    },
    readJsonFile :async function(confDir) {

      //  let args = [].slice.call(arguments);

      //  let fn = args.pop();
   //     let total = args.length,len=0;
        let self = this;
        // console.log(args)
        let path = __dirname +'/../../'+this.appDir+'/'+confDir;
        let jsonFiles = fs.readdirSync(path),currentFile;
        let subTotal = jsonFiles.length,subLen=0;
        if (this._user_options.configname ===true) {
            currentFile = 'default.json';
        } else {
            currentFile = self._user_options.configname +'.json';
        }

        if (!_.indexOf(jsonFiles,currentFile)) {
            Garam.logger().error('not found config file');
        }
        let targetFile = path + '/' + currentFile;
        let setting = JSON.parse(fs.readFileSync(targetFile));
        for (let key in setting ) {
          this.settingModel.set(key,setting[key]);
        }

        // _.each(args, function(confDir) {
        //     console.log(confDir)
        // });


        // _.each(args, function(confDir) {
        //
        //     let path = __dirname +'/../../'+self.appDir+'/'+confDir;
        //     let jsonFiles = fs.readdirSync(path);
        //     let subTotal = jsonFiles.length,subLen=0;
        //     if (self._user_options.configname ===true) {
        //
        //         jsonFiles = ['default.json'];
        //     } else {
        //         let debugFile = self._user_options.configname +'.json';
        //
        //         jsonFiles = [debugFile];
        //     }
        //
        //
        //     subTotal = 1;
        //
        //
        //     _.each(jsonFiles,function(jsonfile) {
        //
        //         let extension = jsonfile.split('.')[1];
        //         if (extension === 'json') {
        //             let targetFile = path + '/' + jsonfile;
        //
        //             let setting = JSON.parse(fs.readFileSync(targetFile));
        //
        //             for (let key in setting ) {
        //                 this.settingModel.set(key,setting[key]);
        //             }
        //         }
        //         subLen++;
        //         if (subLen ===subTotal) {
        //             len++;
        //             if (len === total) {
        //
        //                 fn.call(this);
        //             }
        //         }
        //     },this);
        //
        //
        // },this);
    }
});