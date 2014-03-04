(function() {

    // Constructor

    var ChromeSocket = function() {
        this.socketId = null;
    };

    // Public methods

    ChromeSocket.prototype.connect = function(host, port, callback) {
        chrome.socket.create("tcp", {}, function(createInfo) {
            this.socketId = createInfo.socketId;
            chrome.socket.connect(
                this.socketId, host, port, function(result) {
                    callback(result);
                }.bind(this));
        }.bind(this));
    };

    ChromeSocket.prototype.isConnected = function() {
        return this.socketId !== null;
    };

    ChromeSocket.prototype.disconnect = function(callback) {
        if (this.socketId) {
            chrome.socket.disconnect(this.socketId);
            chrome.socket.destroy(this.socketId);
        }
        this.socketId = null;
        if (callback) {
            callback();
        }
    };

    ChromeSocket.prototype.write = function(packet, callback, errorCallback) {
        chrome.socket.write(this.socketId, packet.getArrayBuffer(), function(writeInfo) {
            var bytesWritten = writeInfo.bytesWritten;
            if (bytesWritten > 0) {
                callback(writeInfo);
            } else {
                console.log("Error: writeInfo.bytesWritten=" + bytesWritten);
                errorCallback("Sending packet failed: " + bytesWritten);
            }
        }.bind(this));
    };

    ChromeSocket.prototype.read = function(length, callback, fatalCallback) {
        chrome.socket.read(this.socketId, length, function(readInfo) {
            var resultCode = readInfo.resultCode;
            if (resultCode > 0) {
                callback(readInfo);
            } else {
                console.log("Error: readInfo.resultCode=" + resultCode +
                            " data=" + readInfo.data);
                fatalCallback("Reading packet failed: " + resultCode);
            }
        }.bind(this));
    };

    // Export

    MySQL.ChromeSocket = ChromeSocket;

})();