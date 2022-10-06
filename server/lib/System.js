var _ = require('underscore')
    , fs = require('fs')
    , Garam = require('./Garam')
    , Base = require('./Base')
    , Express = require('express')
    , Http = require('http')
    , domain = require('domain')
    , redis = require('socket.io-redis')
    , engine = require('ejs-locals')
    , os = require('os')
    , assert= require('assert');

exports = module.exports = System;

function System (mgr, name) {
    Base.prototype.constructor.apply(this,arguments);

}
_.extend(System.prototype, Base.prototype, {

    cpuAverage : function() {
        let cpus = os.cpus();



        //Initialise sum of idle and time of cores and fetch CPU info
        let totalIdle = 0, totalTick = 0;





        //Loop through CPU cores
        for(let i = 0, len = cpus.length; i < len; i++) {

            //Select CPU core
            let cpu = cpus[i];
            //Total up the time in the cores tick
            for(let type in cpu.times) {
                totalTick += cpu.times[type];


            }

            //Total up the idle time of the core
            totalIdle += cpu.times.idle;

        }

        //Return the average Idle and Tick times
        return {idle: totalIdle / cpus.length,  total: totalTick / cpus.length};
    },
    start : function() {
        let self = this;
        this.logData = {cpuUsage:0,load_avg:[0,0,0]};
        this._loadavg1 = [0];
        this._loadavg5 = [0];
        this._loadavg15 = [0];
        this._cpuUsage = [0];
        this._checkDate = [0];

        setTimeout(function(){
            //if (Garam.getCluster().isMaster()) {
                // self.startMonitoring();
                let startMeasure = self.cpuAverage();

                setInterval(function(){
                    //console.log(  os.loadavg(15))
                    let d = new Date(),  logs=self.logData ={cpuUsage:0,load_avg:[0,0,0]};
                    //  logs.now = d.getFullYear() +'-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() +':'+d.getSeconds();
                    logs.now = d.getTime();

                    logs.load_avg = [];
                    logs.cpuUsage='';
                    let endMeasure = self.cpuAverage();

                    //Calculate the difference in idle and total time between the measures
                    let idleDifference = endMeasure.idle - startMeasure.idle;
                    let totalDifference = endMeasure.total - startMeasure.total;

                    //Calculate the average percentage CPU usage
                    let percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
                    logs.cpuUsage = percentageCPU;
                   // console.log('cpuUsage', logs.cpuUsage)
                    //Output result to console
                    // console.log(percentageCPU + "% CPU Usage.");

                    let loadavg = os.loadavg();

                    logs.load_avg.push(loadavg[0].toFixed(6));
                    logs.load_avg.push(loadavg[1].toFixed(6));
                    logs.load_avg.push(loadavg[2].toFixed(6));
                  //    console.log(logs)

                    //  self.logData = logs;
                    //시스템의 최근 1,5,15 분의 시스템의 평균 부하량(Load Average)에 대한 정보

                },1000*10 );


            //}
        },1000*10);

    },
    addLog : function(logs) {


        if (this.logData.length > 20) {
            this.logData.shift();
            this._loadavg1.shift();
            this._loadavg5.shift();
            this._loadavg15.shift();
            this._cpuUsage.shift();
            this._checkDate.shift();
        }

        this._loadavg1.push(logs.load_avg[0]);
        this._loadavg5.push(logs.load_avg[1]);
        this._loadavg15.push(logs.load_avg[2]);
        this._cpuUsage.push(logs.cpuUsage);
        this._checkDate.push(logs.now);

        this.logData = logs;
    },
    getLastLoadData : function () {


      // var cpu =  Math.round(this.logData.load_avg[0] *100);
           // console.log('cpu',this.logData.cpuUsage)
        var cpu = this.logData.cpuUsage;
        return {
            cpuUsage : cpu || 0,
            loadavg1 : this.logData.load_avg[0] || 0,
            loadavg5 :  this.logData.load_avg[1] || 0,
            loadavg15 :this.logData.load_avg[2]|| 0
        }
    },
    getChartData : function() {
        var arr = [];
        var d = [].concat('x',this._checkDate);
        var loadavg1 = [].concat('loadavg1',this._loadavg1);
        var loadavg5 = [].concat('loadavg5',this._loadavg5);
        var loadavg15 = [].concat('loadavg15',this._loadavg15);
        arr.push(d);
        arr.push(loadavg1);
        arr.push(loadavg5);
        arr.push(loadavg15);

        return {loadavg:arr,cpu:[].concat('cpu',this._cpuUsage)}

    }

});