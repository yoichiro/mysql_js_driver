(function(Packet, MySQLTypes) {
    "use strict";

    // Constructor

    var Communication = function() {
        this.mySQLTypes = new MySQLTypes();
        this.nextSequenceNumber = 0;
        this.socketImpl = null;
    };

    // Private Methods

    var _readPluralPackets = function(
        current, count, result, callback, fatalCallback) {
        this.readPacket(function(packet) {
            result.push(packet);
            current += 1;
            if (current < count) {
                _readPluralPackets.call(
                    this, current, count, result, callback, fatalCallback);
            } else {
                callback(result);
            }
        }.bind(this), fatalCallback);
    };

    var _readFixedLongValue = function(length, callback, fatalCallback) {
        _read.call(this, length, function(readInfo) {
            var result = this.mySQLTypes.getFixedLengthInteger(readInfo.data, 0, length);
            callback(result);
        }.bind(this), fatalCallback);
    };

    var _read = function(length, callback, fatalCallback) {
        this.socketImpl.read(length, callback, fatalCallback);
    };

    // Public Methods

    Communication.prototype.setSocketImpl = function(impl) {
        this.socketImpl = impl;
    };

    Communication.prototype.connect = function(host, port, callback) {
        this.socketImpl.connect(host, port, callback);
    };

    Communication.prototype.disconnect = function(callback) {
        this.socketImpl.disconnect(callback);
    };

    Communication.prototype.isConnected = function() {
        return this.socketImpl.isConnected();
    };

    Communication.prototype.readPacket = function(callback, fatalCallback) {
        _readFixedLongValue.call(this, 3, function(dataLength) {
            _readFixedLongValue.call(this, 1, function(sequenceNumber) {
                this.incrementSequenceNumber(sequenceNumber);
                _read.call(this, dataLength, function(readInfo) {
                    var packet = new Packet(sequenceNumber, readInfo.data);
                    callback(packet);
                }.bind(this), fatalCallback);
            }.bind(this), fatalCallback);
        }.bind(this), fatalCallback);
    };

    Communication.prototype.readPluralPackets = function(
        count, callback, fatalCallback) {
        _readPluralPackets.call(this, 0, count, [], callback, fatalCallback);
    };

    Communication.prototype.writePacket = function(packet, callback, errorCallback) {
        this.socketImpl.write(packet, callback, errorCallback);
    };

    Communication.prototype.incrementSequenceNumber = function(sequenceNumber) {
        this.nextSequenceNumber = sequenceNumber + 1;
        if (this.nextSequenceNumber > 255) {
            this.nextSequenceNumber = 0;
        }
    };

    Communication.prototype.createPacket = function(buffer) {
        return new Packet(this.nextSequenceNumber, buffer);
    };

    Communication.prototype.resetSequenceNumber = function() {
        this.nextSequenceNumber = 0;
    };

    Communication.prototype.establishTls = function(ca, checkCN, callback, fatalCallback) {
        this.socketImpl.establishTls(ca, checkCN, callback, fatalCallback);
    };

    // Export

    MySQL.Communication = Communication;


})(MySQL.Packet, MySQL.Types);
