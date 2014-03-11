 var EventEmitter = process.EventEmitter
     ,_ = require('underscore')
     , Optparse = require('./optparse')
     , fs = require('fs')
     , assert= require('assert');

 exports =  module.exports  = BlueConfigure;
 function BlueConfigure() {}

 _.extend(BlueConfigure.prototype, EventEmitter.prototype, {
         start : function(options,Baram) {
             var scope = this;

             this._addOptions('conf',function(){
                 scope.readPromptOptions(options);
                 Baram.trigger('ready');
             })

         },
     readPromptOptions :function(options) {
         var scope = this;
         if (!_.isArray(options)) {
             assert(0,'Array 데이터만 올 수 있음');

         }
         this.options = Optparse.parse(options, true);


         for (var key in this.options) {

             if (key.length < 2) {
                 delete this.options[key]
             } else {
                 this[key] = this.options[key];
             }
         }

     },
     _addOptions:function (root, callback) {
         this._readConfig(root, 'root', false, function () {
             callback();
         });
     },
     _readConfig:function (configName, parent, childfolder, callback) {
         var path = ''
             , state = {}
             , self = this;

         if (!configName) configName = 'server/conf';
         if (childfolder == null) childfolder = false;
         path = process.cwd() + '/server/' + configName;

         if (parent == 'root') {
             process._folderListEvents = {};
             var config = self;
         }

         //현재 디렉토리의 폴더 리스트를 리턴한다.
         fs.readdir(path, function (err, folderlist) {
             if (err) {
                 throw err;
             }
             var total = folderlist.length - 1, isDir = false;

             //해당 폴더 안에 아무런 json 폴더가 없을경우
             if (total === -1 && parent != 'root') {
                 var parentEventName = configName.split('/');
                 parentEventName.pop();
                 parentEventName = parentEventName.join('/');
                 process.emit('read_' + parentEventName, configName, {});
             }
             folderlist.forEach(function (file, i) {
                 var extension = file.split('.');
                 //폴더일때 재귀함수를 호출한다.
                 if (extension.length == 1) {
                     isDir = true;
                     if (process.folderState == null) process.folderState = {};
                     process.folderState[extension[0]] = state[extension[0]] = false;
                     self._readConfig(configName + '/' + extension[0], configName, true);
                 } else {
                     var targetFile = path + '/' + file;

                     try {
                        if(parent == 'root' && extension[0] === 'default') {
                            var c =  JSON.parse(fs.readFileSync(targetFile));
                            _.extend(self,c)
                            //config[extension[0]] = c;
                        } else {
                            config[extension[0]] = JSON.parse(fs.readFileSync(targetFile));
                        }
                     } catch(e) {

                         throw e;
                     }
                 }

                 //폴더에 하위 json 파일이 존재하면...
                 if (total == i && parent != 'root') {
                     var parentEventName = configName.split('/');
                     parentEventName.pop();
                     parentEventName = parentEventName.join('/');

                     process.emit('read_' + parentEventName, configName, config);
                 } else if (total == i && isDir === false) {
                     //폴더 안에 파일이 존재하지 않을경우
                     if (typeof callback == 'function') {
                         callback(config);
                     }
                     //self.start();
                 }

                 if (i == 0) {

                     //forEach 를 돌때 첫번째 값에 아래의 이베트를 추가함.
                     process._folderListEvents['read_' + configName] = 'read_' + configName;
                     process.on('read_' + configName, function (parentCfgName, settingValue) {
                         var cfgName = parentCfgName.split('/')
                             , check = true;
                         cfgName = cfgName.pop();

                         config[cfgName] = settingValue;

                         process.folderState[cfgName] = true;
                         //하나라도 미완성이면 이벤트를 발생시키지 않는다.
                         for (var s  in  process.folderState) {
                             if (process.folderState[s] == false) {
                                 check = false;
                             }
                         }
                         if (check == true && parent == 'root') {

                             for (var i in process._folderListEvents) {
                                 process.removeListener(process._folderListEvents[i], function () {
                                 });
                             }
                             //self.setConfig(config);
                             //폴더 안에 파일이 존재하지 않을경우
                             if (typeof callback == 'function') {
                                 callback(config);
                             }
                             //   self.start();

                         } else if (check == true && childfolder == true) {
                             var folderNames = configName.split('/');
                             var targetConfigParam = folderNames.pop();
                             folderNames.join('/');

                             process.emit('read_' + folderNames, targetConfigParam, config);

                         }
                     });
                 }
             });
         });
     }
 });