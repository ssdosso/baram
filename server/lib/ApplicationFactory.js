var EventEmitter = require('events').EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Garam = require('./Garam')
    , winston = require('winston')
    , assert= require('assert');

exports = module.exports = Application;

function Application(mod) {
    if(mod) this._targetApp = mod;
    else this._targetApp ='all';
    //this.trigger = require('./triggerMethod');

}
_.extend(Application.prototype, EventEmitter.prototype, {
    appCreate : async function() {

        this._controllers = {};
        this.appDir = Garam.getInstance().get('appDir');
        var self = this;

        return new Promise(async (resolve, reject) => {
            
            try {
                if(!fs.existsSync(this.appDir + '/controllers')) {
                    Garam.getInstance().log.info(this.appDir + '/controllers make appDir');
                    fs.mkdirSync(this.appDir + '/controllers');
                }


                let dir = process.cwd()+'/'+ this.appDir + '/controllers';
                let list = fs.readdirSync(dir);
                let total =list.length;
                if(total === 0){
                    return reject('controllers is empty');
                    //Garam.getInstance().log.error('controllers is empty');
                }
                for await(let file of list) {
                    await (async (controllerFile) => {
                        let stats = fs.statSync(process.cwd() + '/' + this.appDir + '/controllers/' + controllerFile);
                        if (stats.isFile()) {
                            let controller = require(process.cwd() + '/' + self.appDir + '/controllers/' + controllerFile);
                            assert(controller.className);
                            if (!controller.className) {
                                return reject('className does not exist');
                            }

                            await this.appendController(controller);
                            //Garam.getInstance().emit('applicationReady');
                            // self.addController(controller, function () {
                            //     if (total === (job + 1)) {
                            //         Garam.getInstance().emit('applicationReady');
                            //     }
                            //
                            // });
                        } else {
                            return reject('controller 는   does not exist');
                        }
                    })(file);
                }
                Garam.getInstance().emit('applicationReady');
                console.log('load end')
                resolve();
            } catch (e) {
                reject('appCreate',e)
            }

        });


    },
    /**
     * 컨트롤러 객체를 생성한다.
     * @param application
     * @param callback
     * @returns {Promise<unknown>}
     */
    appendController: async function(application) {

        return new Promise(async (resolve, reject) => {
            try {
                let controller = application.app,self=this;
                let c = new controller;
                let className = application.className.toLowerCase();
                this._controllers[className] = c;
                await this._controllers[className]._create(className);

                if (  self._controllers[className].workerOnly === true && !Garam.isMaster()) {
                    self._controllers[className].init();

                } else if(self._controllers[className].workerOnly === true && Garam.isMaster()) {

                } else {

                    self._controllers[className].init();

                }
                resolve();
                // this._controllers[className]._create(className,function(){1
                //     if (  self._controllers[className].workerOnly === true && !Garam.isMaster()) {
                //         self._controllers[className].init();
                //
                //     } else if(self._controllers[className].workerOnly === true && Garam.isMaster()) {
                //
                //     } else {
                //
                //         self._controllers[className].init();
                //
                //     }
                //
                //     return resolve();
                // });
            } catch (e) {
                reject('addController Error '+e)
            }

        });



    },

    getControllers : function() {
        return this._controllers;
    },
    /**
     * 외부에서 applicaction 컨트롤러를 리턴
     * @param className
     * @returns {*}
     */
    getController : function(className) {
        return this._controllers[className];
    },

    addControllers: function() {



    }
});