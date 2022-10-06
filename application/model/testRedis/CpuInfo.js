/**
 * 샘플입니다.
 * @type {{getInstance: Function}}
 */
const Garam = require('../../../server/lib/Garam')
    , moment = require('moment')
    , Model = require('../../../server/lib/Model')
    , Type = require('../../../server/lib/Types');


const LZUTF8 = require('lzutf8');
module.exports = Model.extend({
    name :'CpuInfo',
    dbName :'testRedis',

    create : function() {

        this.addField('ip',Type.Str,false,['notEmpty'],true);
        this.addField('port',Type.Int,false,['notEmpty'],true);
        this.addField('cpu', Type.Int, false);

        //this.addField('accessToken', Type.Boolean, false, ['notEmpty'], true); //facebook token
        this.createModel();
    },


    addData :async function(ip,port,cpuData) {
        let self = this;
        let insertData = self.setParam({
            ip: ip,
            port: port,
            cpu : cpuData.cpuUsage
        });

        try {
            let cpuInfo =   await self.queryPromise({'ip':ip,'port':port});

            let nModel;
            if (cpuInfo.length > 0) {
              nModel =  await self.update(cpuInfo[0],insertData);
            } else {
              nModel =  await self.insertItem(insertData);
            }

          //
        } catch (e) {
            throw e;
        }


    }

});

