(function() {

    // Constructor

    var ChromeSocket2 = function() {
        this.socketId = null;
        this.initialize();
        this.callbacks = [];
        this.buffer = new ArrayBuffer(0);
    };

    // Public methods

    ChromeSocket2.prototype.initialize = function() {
        chrome.sockets.tcp.onReceive.addListener(function(info) {
            this.onReceive(info);
        }.bind(this));
        chrome.sockets.tcp.onReceiveError.addListener(function(info) {
            this.onReceiveError(info);
        }.bind(this));
    };

    ChromeSocket2.prototype.onReceive = function(info) {
        var received = info.data;
        var newSize = this.buffer.byteLength + received.byteLength;
        var newBuffer = new ArrayBuffer(newSize);
        var newBufferView = new Uint8Array(newBuffer, 0, newSize);
        newBufferView.set(new Uint8Array(this.buffer, 0, this.buffer.byteLength), 0);
        newBufferView.set(new Uint8Array(received, 0, received.byteLength),
                          this.buffer.byteLength);
        this.buffer = newBuffer;
        this.fetch();
    };

    ChromeSocket2.prototype.onReceiveError = function(info) {
        this.raiseError(info);
    };

    ChromeSocket2.prototype.raiseError = function(info) {
        if (this.callbacks.length > 0) {
            var data = this.callbacks[0];
            data.fatalCallback("Network error occurred: " + info.resultCode);
            this.raiseError(info);
        }
    };

    ChromeSocket2.prototype.fetch = function() {
        if (this.callbacks.length > 0) {
            var data = this.callbacks[0];
            if (this.buffer.byteLength < data.length) {
                console.log("There is no data: " + this.buffer.byteLength + "<" + data.length);
                // There is no data
                data.fatalCallback("There is no data: " + this.buffer.byteLength + "<" + data.length);
                // Delete callback info
                this.callbacks = this.callbacks.slice(1);
            } else {
                // Fetch result buffer
                var resultBuffer = new ArrayBuffer(data.length);
                var resultBufferArray = new Uint8Array(resultBuffer, 0, resultBuffer.byteLength);
                var bufferArray = new Uint8Array(this.buffer, 0, this.buffer.byteLength);
                resultBufferArray.set(bufferArray.subarray(0, data.length));
                // Delete read bytes
                var newBuffer = new ArrayBuffer(this.buffer.byteLength - data.length);
                var newArray = new Uint8Array(newBuffer, 0, newBuffer.byteLength);
                newArray.set(bufferArray.subarray(data.length, bufferArray.byteLength), 0);
                this.buffer = newBuffer;
                // Delete callback info
                this.callbacks = this.callbacks.slice(1);
                // Make result
                var result = {
                    resultCode: 0,
                    data: resultBuffer
                };
                data.callback(result);
            }
            // Recursible
            this.fetch();
        }
    };

    ChromeSocket2.prototype.connect = function(host, port, callback) {
        var id = null;
        chrome.sockets.tcp.create({
            bufferSize: 0xFFFFFF
        }, function(createInfo) {
            id = createInfo.socketId;
            chrome.sockets.tcp.connect(
                id, host, port, function(result) {
                    if (result >= 0) {
                        this.socketId = id;
                    } else {
                        this.socketId = null;
                    }
                    callback(result);
                }.bind(this));
        }.bind(this));
    };

    ChromeSocket2.prototype.isConnected = function() {
        return this.socketId !== null;
    };

    ChromeSocket2.prototype.disconnect = function(callback) {
        if (this.socketId) {
            chrome.sockets.tcp.disconnect(this.socketId);
            chrome.sockets.tcp.close(this.socketId);
        }
        this.socketId = null;
        if (callback) {
            callback();
        }
    };

    ChromeSocket2.prototype.write = function(packet, callback, errorCallback) {
        chrome.sockets.tcp.send(this.socketId, packet.getArrayBuffer(), function(sendInfo) {
            var resultCode = sendInfo.resultCode;
            if (resultCode === 0) {
                callback(sendInfo);
            } else {
                console.log("Error: writeInfo.resultCode=" + resultCode);
                errorCallback("Sending packet failed: " + resultCode);
            }
        }.bind(this));
    };

    ChromeSocket2.prototype.read = function(length, callback, fatalCallback) {
        this.callbacks.push({
            length: length,
            callback: callback,
            fatalCallback: fatalCallback
        });
    };

    // Export

    MySQL.ChromeSocket2 = ChromeSocket2;

})();
