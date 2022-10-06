var EventEmitter = require('events').EventEmitter
    ,_ = require('underscore')
    , fs = require('fs')
    , Garam = require('../Garam')
    , Base = require('../Base')
    , async = require('async')

    , domain = require('domain')
    , bfj = require('bfj')

    ,zlib = require('zlib')
    , assert= require('assert');


var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
var ByteBuffer = require("bytebuffer");
module.exports = JsonParse;

function JsonParse() {
    Base.prototype.constructor.apply(this,arguments);

}

_.extend(JsonParse.prototype, Base.prototype, {
    socket :null,

    _packetNum: null,
    _overflow :null,

    _read:null,
    _delay:null,
    _recvTimeCheck:null,
    _sendTimeOut :null,
    _decodeBreak: null,
    _unionBuffers :null,
    _delayNum :null,
    _flush :null,
    _splitWriteData:null,
    _splitByte :null,
    _pause :null,
    _splitBuffers:null,
    _writeData :null,
    _sendSplitCount:null,
    _waitTime: null,
    isConnect : function() {
        return !this.disconnected;
    },
    send : function(message) {

        var self = this;
        if(this.disconnected) {
            return;
        }
        if( !_.isObject(message) ) {
            assert(0,'message 는  Object 형식이어야만 합니다.');
        }

        if (Garam.get('ispacket') && message.pid !== "heartbeat") {
            Garam.logger().packet('send  ' +JSON.stringify(message));
        }

        self.encode(message,function(encoded){

            if (encoded != null) {
                self._writeMessage(encoded);
            }
        });

    },
    _savePacket : function(message) {
        var self = this;
        process.nextTick(function(){
            self._packetQueue.enqueue(message);
        });
    },
    _getPacketLength : function() {
        return this._packetQueue.getLength();
    },
    _getPacket : function() {
        return this._packetQueue.dequeue();
    },
    /**
     * 원격 서버에 메세지 전송
     * @param message String
     * @private
     */
    _writeMessage: function(message) {
        var self = this;
        //패킷 버퍼링이 없으면... 실제 메세지 발송
        if (this.isDelay() === false) {
            process.nextTick(function(){
                if (self.isConnect() && self.socket && !self.socket.write(message)) {
                    self._setDelay();
                    //    this.socket.pause();
                    Garam.logger().warn('tcp busy . . . ');
                } else if(!self.isConnect()) {
                    Garam.logger().warn('socket close send error','server disconnect:',self.isConnect());
                }
            });
        }  else {

            this._savePacket(message);
            //   this._writeData.push(message);

        }

    },
    _setDelay : function() {
        this._pause = true;
        this.socket.pause();
    },
    _removeDelay : function() {
        this._pause = false;
    },
    isDelay : function() {
        return this._pause;
    },


    onSocketDrain: function() {


        var self = this;
        var delayTime = 20;
        Garam.logger().info('on drain');
        this.socket.resume();
        self.discardPacket();
        // this.socket.setTimeout(delayTime,function(){
        //
        // });


    },
    /**
     * drain
     */
    // writeDiscard: function() {
    discardPacket: function() {
        //this.drained = true;
        var self = this,k=0;
        if(this.disconnected) {
            return;
        }

        if (this._getPacketLength() > 0) {
            //this._waitTime--;
            var message = this._getPacket();
            /**
             * 버퍼가 성공적으로 비워지면, 다음을 호출한다.
             * 그러나 실패 하게 되면. 자동으로 discardPacket() 함수가 onSocketDrain 에 의해서 실행된다.
             */
            if (this.socket.write(message)) {

                self.discardPacket();
            }


            // self._writeMessage();

        }  else {

            this._removeDelay();


        }

    },

    setHandlers: function(){
        this.disconnected = false;
        this._pause = false;
        this._bound = {
            end: this.onSocketEnd.bind(this)
            , close: this.onSocketClose.bind(this)
            , error: this.onSocketError.bind(this)
            , drain: this.onSocketDrain.bind(this)

        };
        // this.socket.setTimeout(2000);

        this.socket.on('end', this._bound.end);
        this.socket.on('close', this._bound.close);
        this.socket.on('error', this._bound.error);
        this.socket.on('drain', this._bound.drain);

    },
    onSocketTimeout : function () {
        this.end('socket timeout');
    },
    onSocketEnd: function() {
        this.end('socket end');
    },
    onSocketClose: function(error) {
        this.end(error ? 'socket error' : 'socket close');
    },
    onSocketError: function(err) {

        if (!this.disconnected) {
            this.socket.destroy();
            this.onClose();
        }

        // this.reconnect();
    },


    startHeartbeatEvent : function() {
        this._onHeartbeatClear();
    },



    onConnectEvent: function() {
        var self = this;
        this._splitByte = 2048;  // 한번에 보낼 수 있는 byte
        this._delayNum = 0;
        this._writeData = [];
        this._flush = true;

        this._splitWriteData = [];
        this._splitBuffers = {};
        this._sendSplitCount = 0;
        this._packetQueue = new Queue();


        this.socket.removeAllListeners('data');
        this.socket.on('data', function (data) {

            self.decodePacket(data);
        });
    },

    _setUpDelay: function(delay) {
        //    this._unsetWriteProcess();
        this._delay = delay;

    },
    _unsetWriteProcess: function() {
        clearInterval(this._sendTimeOut);
    },

    /**
     *
     * @param message
     * @return {String}
     */
    encode: function(message,callback) {
        var self = this;

        if (message.pid ==='heartbeat') {
            this.createHeartBeatBuffer(callback);
        } else {
            bfj.stringify(message,{buffers:'ignore'}).
                then(function (packet) {

                    if (packet !== null && packet !== undefined) {
                        zlib.deflate(packet, function(err, buffer) {
                            if (!err) {
                                self._writeBuffer(buffer,function(buf){

                                    callback(buf);
                                });
                            } else {
                                Garam.logger().error('json parse error', message);
                            }
                        });


                    }
                })
                .catch(function (error) {
                    Garam.logger().error('json parse error', message);
                });
        }


    },




    _setPayLoadData: function() {

    },
    _getTotalByte : function(buffer) {

        return buffer.readInt16LE(0);
    },
    _addToOverflow: function(data){
        if (this._overflow == null) {
            this._overflow = data;
        } else {
            var prevOverflow = this._overflow;
            this._overflow = Buffer.alloc(this._overflow.length + data.length);
            prevOverflow.copy(this._overflow, 0);
            data.copy(this._overflow, prevOverflow.length);
            return this._overflow;
        }
        // var buffer = new Buffer(data.length - self._toRead );
    },
    createHeartBeatBuffer : function (callback) {
        var buf =  Buffer.alloc(2);

        buf[0] = 0x81;

        this._writeMessage(buf);
    },
    _writeBuffer: function(data,callback) {
        var self = this;
        //  if (type === null) type = 4;

        var bodyBuffer;

        var jsonData = Buffer.from(data);


        //buffers 가 125 바이트 이내 일경우의 처리
        //2진수 1000, 0111, 0011 와 같이
        //첫번재 비트는 1 또는 0 이기에  10진수로 8 또는 0 으로 표현 된다.
        //세번째 비트 부터는 옵션 값이다.
        if (jsonData.length <= 125 ) {

            var headerBuf =  Buffer.alloc(2);
            headerBuf[0] = 0x84;
            headerBuf[1] = data.length;
            bodyBuffer = Buffer.alloc(data.length + headerBuf.length);
            headerBuf.copy(bodyBuffer,0,0,headerBuf.length);
            jsonData.copy(bodyBuffer,headerBuf.length,0,jsonData.length);
            callback(bodyBuffer)
            // return bodyBuffer;

        } else if (jsonData.length <= 65535) {
            //UINT16 Size


            var headerBuf =  Buffer.alloc(4);
            headerBuf[0] = 0x85;
            headerBuf[1] = 0x7E;
            headerBuf.writeUInt16LE(jsonData.length,2);
            bodyBuffer = Buffer.alloc(jsonData.length + headerBuf.length);

            headerBuf.copy(bodyBuffer,0,0,headerBuf.length);
            jsonData.copy(bodyBuffer,headerBuf.length,0,jsonData.length);
            callback(bodyBuffer);


        } else {
            //UInt32

            var headerBuf =  Buffer.alloc(6);

            headerBuf[0] = 0x86;
            headerBuf[1] = 0x7F; //126
            headerBuf.writeUInt32LE(jsonData.length,2); //전체길이


            bodyBuffer = Buffer.alloc(jsonData.length + headerBuf.length);
            headerBuf.copy(bodyBuffer,0,0,headerBuf.length);
            jsonData.copy(bodyBuffer,headerBuf.length,0,jsonData.length);
            callback(bodyBuffer);


        }





    },
    _expect : function(data ) {
        this.decodePacket(data);

    },
    decodePacket: function(data) {
        var handler;
        if (!this.isConnect()) {
            return
        }
        //this._decodeBreak = true;//디코드가 작업중임을 현재 소켓에 알린다.
        if (this._overflow != null) {
            data =   this._addToOverflow(data);
            this._overflow = null;
        }

        switch ((data[0] & 0x8f)) {

            case 0x81:
                //heartbeat
                handler=  this._opcodeHandlers[3];
                handler.call(this,data);

                break;
        /**
         * length 가 125 바이트 이내 였을 경우의 처리
         */
            case 0x84:
                handler=  this._opcodeHandlers[4];
                if(handler) {
                    handler.call(this,data);
                }

                break;
            case 0x85:
                /**
                 * 큰데이터를 여러개로 쪼개는 패킷의 첫번째 데이터
                 * @type {*}
                 */
                handler=  this._opcodeHandlers[5];
                if(handler) {
                    handler.call(this,data);
                }

                break;
            case 0x86:
                /**
                 * int32 바이트 이상의 처리
                 * @type {*}
                 */

                handler=  this._opcodeHandlers[7];
                if(handler) {
                    handler.call(this,data);
                }

                break;
            case 0x05:

                handler=  this._opcodeHandlers[6];
                if(handler) {
                    handler.call(this,data);
                }
                break;
            default:
                Garam.logger().warn('decodePacket error', data.toString());
                Garam.logger().warn('Fin data error');
                // this._addToOverflow(data);
                break;
        }

    },
    _onHeartbeat: function() {},
    setOpcodeHandlers: function() {

        this._packetNum = 0;

        this._opcodeHandlers = {


            /**
             * uint32
             * @param buffer
             */
            7: function(buffer) {


                if (buffer.length < 6) {
                    this._addToOverflow(buffer);
                    return;
                }

                var extendedPayloadLen = buffer.readUInt32LE(2); //총길이


                var targetBuffer = Buffer.alloc(extendedPayloadLen);
                var targetStart = 0;
                var sourceStart = 6;
                var sourceEnd = extendedPayloadLen + sourceStart;

                if (sourceEnd > buffer.length) {
                    this._addToOverflow(buffer);
                    return;
                }

                buffer.copy(targetBuffer,targetStart,sourceStart,sourceEnd);

                this._sendMessage(targetBuffer);

                if (buffer.length  > sourceEnd) {
                    var overLen =sourceEnd;
                    var nextBuffer = Buffer.alloc(buffer.length-overLen);
                    buffer.copy(nextBuffer,0,overLen,buffer.length);
                    //_expect : function(data,opcode)
                    this._expect(nextBuffer);
                }

            },
            6: function(buffer) {



            },
            /**
             * uint 16
             * @param data
             */
            5: function(buffer) {

                if (buffer.length < 4) {
                    this._addToOverflow(buffer);
                    return;
                }

                var extendedPayloadLen = buffer.readUInt16LE(2); //총길이


                var targetBuffer = Buffer.alloc(extendedPayloadLen);
                var targetStart = 0;
                var sourceStart = 4;
                var sourceEnd = extendedPayloadLen + sourceStart;

                if (sourceEnd > buffer.length) {
                    this._addToOverflow(buffer);
                    return;
                }

                buffer.copy(targetBuffer,targetStart,sourceStart,sourceEnd);

                this._sendMessage(targetBuffer);

                if (buffer.length  > sourceEnd) {
                    var overLen =sourceEnd;
                    var nextBuffer = Buffer.alloc(buffer.length-overLen);
                    buffer.copy(nextBuffer,0,overLen,buffer.length);
                    //_expect : function(data,opcode)
                    this._expect(nextBuffer);
                }



            },
            3: function (buffer) {
                if (buffer.length ==2) {


                    this._onHeartbeatClear();
                } else {
                    var nextBuffer = Buffer.alloc(buffer.length-2);
                    buffer.copy(nextBuffer,0,2,buffer.length);
                    this._sendMessage({type:'heartbeat'});
                    this._expect(nextBuffer);
                }

            },
            /**
             * uint8
             * @param data
             */
            4: function(data) {
                var payloadLen = data.readInt8(1);
                if (payloadLen <= 125 ) {
                    expectLowData.call(this,data,payloadLen);
                } else if (payloadLen === 126){
                    expectExtendedData.call(this,data);
                } else  if (payloadLen === 127) {
                }

                function expectLowData(buffer,length) {
                    var targetBuffer = Buffer.alloc(length);
                    var targetStart = 0;
                    var sourceStart = 2;
                    var sourceEnd = length + sourceStart;

                    if (length > buffer.length) {
                        this._addToOverflow(buffer);
                        return;
                    }

                    buffer.copy(targetBuffer,targetStart,sourceStart,sourceEnd);
                    this._sendMessage(targetBuffer);


                    if (buffer.length  >  length + sourceStart) {
                        var overLen = length + sourceStart;
                        var nextBuffer = Buffer.alloc(buffer.length-overLen);
                        buffer.copy(nextBuffer,0,overLen,buffer.length);
                        //_expect : function(data,opcode)
                        this._expect(nextBuffer);


                    }

                }
                function expectExtendedData(buffer) {
                    var extendedPayloadLen,targetBuffer;
                    extendedPayloadLen  = buffer.readUInt16LE(2);
                    var sourceEnd = extendedPayloadLen + 4;
                    if (extendedPayloadLen > buffer.length) {
                        this._addToOverflow(buffer);
                        return;
                    }
                    targetBuffer = Buffer.alloc(extendedPayloadLen);
                    buffer.copy(targetBuffer,0,4,sourceEnd);

                    this._sendMessage(targetBuffer);
                    if (buffer.length >  sourceEnd) {
                        var nextBuffer = Buffer.alloc(buffer.length-sourceEnd);
                        buffer.copy(nextBuffer,0,sourceEnd,buffer.length);
                        this._expect(nextBuffer);
                    }
                }
            }

        }
    },
    _sendMessage: function(buffer) {

        var self = this;
        zlib.unzip(buffer, function(err, message) {
            if (!err) {
                try {
                    var obj = JSON.parse(message);
                } catch (e) {
                    Garam.Logger().warn('parse error', {message:message, error:e});
                    return;
                }

                //  Garam.Logger().info('receive',obj)
                if (obj.type !== undefined && obj.type === 'heartbeat'){
                    //  this._decodeBreak = false;
                    self._onHeartbeatClear();
                } else {
                    if ('object' !== typeof obj) {
                        Garam.logger().warn(obj);
                    } else {
                        //    this._decodeBreak = false;

                        self.emit('message',obj);

                    }
                }

            }
        });


    },

    generateId : function() {
        return Math.abs(Math.random() * Math.random() * Date.now() | 0).toString()
            + Math.abs(Math.random() * Math.random() * Date.now() | 0).toString();
    }


});




function Queue(){

    // initialise the queue and offset
    var queue  = [];
    var offset = 0;

    // Returns the length of the queue.
    this.getLength = function(){
        return (queue.length - offset);
    }

    // Returns true if the queue is empty, and false otherwise.
    this.isEmpty = function(){
        return (queue.length == 0);
    }

    /* Enqueues the specified item. The parameter is:
     *
     * item - the item to enqueue
     */
    this.enqueue = function(item){
        queue.push(item);
    }

    /* Dequeues an item and returns it. If the queue is empty, the value
     * 'undefined' is returned.
     */
    this.dequeue = function(){

        // if the queue is empty, return immediately
        if (queue.length == 0) return undefined;

        // store the item at the front of the queue
        var item = queue[offset];

        // increment the offset and remove the free space if necessary
        if (++ offset * 2 >= queue.length){
            queue  = queue.slice(offset);
            offset = 0;
        }

        // return the dequeued item
        return item;

    }

    /* Returns the item at the front of the queue (without dequeuing it). If the
     * queue is empty then undefined is returned.
     */
    this.peek = function(){
        return (queue.length > 0 ? queue[offset] : undefined);
    }

}
