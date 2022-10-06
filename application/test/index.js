
var
    Garam = require('../../server/lib/Garam')
    , crypto = require('crypto')
    ,Test = require('../../server/lib/Test');

let Backbone = require('backbone')
    , _ = require('underscore');

let util = require('util');
const Countries = require("../lib/Countries");
const geoip = require("geoip-country");


let TestApp = Test.extend({

    create :function() {
        var bufferMng = Garam.getBufferMng();
            var self = this;
            var crypto = require('crypto');

        class Node{
            constructor(item){
                this.item = item;
                this.next = null;
            }
        }

        class Stack{
            constructor(){
                this.topOfStack = null;
                this.length = 0;
            }

            push(item){
                const node = new Node(item);
                if(this.topOfStack!=null){
                    node.next = this.topOfStack;
                }
                this.topOfStack = node;
                this.length+=1;
            }

            pop(){
                if(this.length==0)return -1;
                const popItem = this.topOfStack;
                this.topOfStack = popItem.next;
                this.length-=1;

                return popItem.item
            }

            size(){
                return this.length;
            }

            empty(){
                if(this.length==0) return 1;
                else return 0;
            }

            top(){
                if(this.length==0)return -1;
                return this.topOfStack.item;
            }
        }

        if (Garam.getInstance().get('service')) {
            Garam.getInstance().on('listenService', async function () {

let page = 2,maxPage =10,total= 100000;
                let paginator = require('pagination').create('search', {prelink:'aaaa', current: page, rowsPerPage: maxPage, totalResult: total});
                let pageData =  paginator.getPaginationData();
                const { Blob } = require("buffer");
                let buff =Buffer.alloc(10);

               let t =  new Blob(buff);

                // let asia ="BD,MN,BN,BH,BT,HK,JO,PS,LB,LA,TW,TR,LK,TL,TM,TJ,TH,XC,NP,PK,PH,AE,CN,AF,IQ,JP,IR,AM,SY,VN,GE,IL,IN,AZ,ID,OM,KG,UZ,MM,SG,KH,CY,QA,KR,KP,KW,KZ,SA,MY,YE";
                // let europe ="BE,FR,BG,DK,HR,DE,BA,HU,JE,FI,BY,GR,RU,NL,PT,NO,LI,LV,LT,LU,FO,PL,XK,CH,AD,EE,IS,AL,IT,GG,CZ,IM,GB,AX,IE,ES,ME,MD,RO,RS,MK,SK,MT,SI,SM,UA,SE,AT";
                // let southAmerica ="PY,CO,VE,CL,SR,BO,EC,AR,GY,BR,PE,UY,FK";
                // let africa ="BF,DJ,BI,BJ,ZA,BW,DZ,ET,RW,TZ,GQ,NA,NE,NG,TN,LR,LS,ZW,TG,TD,ER,LY,GW,ZM,CI,EH,CM,EG,SL,CG,CF,AO,CD,GA,GN,GM,XS,CV,GH,SZ,MG,MA,KE,SS,ML,KM,ST,MW,SO,SN,MR,UG,SD,MZ";
                // let northAmerica ="PR,D,DM,LC,NI,PA,CA,SV,HT,TT,JM,GT,HN,BZ,BS,CR,US,GL,M,CU";
                //
                // let northAmericaList = northAmerica.split(",");


               // console.log('#lastMission',lastMission)
             // let mission =   await Garam.getCtl('mission').getNextGetItemMission(156);
             //
             //    console.log(mission)

                // const countries = new Countries();
                // countries.create();
                //
                // console.log('$',countries.getContinent("ZW"));

                    //  https.post(url, (res) => {

                    //  }).on('error', (e) => {
                    //     console.log(e)
                    // })


                    // // TODO implement
                    // const response = {
                    //     statusCode: 200
                    //
                    // };
                    // return response;
                    //




            });

        }
    }
});

//exports.TestApp  =TestApp;
exports = module.exports = TestApp;