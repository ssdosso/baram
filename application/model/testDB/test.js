let BaseProcedure = require('../../../server/lib/database/model/MysqlProcedure.js');
let Garam = require('../../../server/lib/Garam');


let DP = BaseProcedure.extend({
    dpname: 'testModel',
    create: async function () {
        this._read = 1;
        this._write = 2;
    },

    getTestQuery: async function () {
        let self = this;
        return new Promise(async (resolved, rejected) => {

            try {
                let query = "select * from test order by test asc";

                resolved(await self.executeAsync(query, [], this._read, true));
            } catch (e) {
                Garam.logger().error(e);

                rejected(e);
            }

        });
    },

    insertQuery : async function (userId,gp) {
        let self = this;
        return new Promise(async (resolved,rejected)=>{
            let connection = await this.beginTransaction();
            try {
                let query ="UPDATE  test set aa=aa+? where aaab=?";
                await self.queryAsync(connection, query, [gp,userId]);

                await self.commit(connection);

                resolved();

            } catch (e) {
                Garam.logger().error(e);
                await self.rollback(connection);
                rejected(e);
            }
        });
    },


});

module.exports = DP;