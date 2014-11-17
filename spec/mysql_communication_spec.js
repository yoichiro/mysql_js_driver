describe("MySQL.Communication", function() {

    var target;

    beforeEach(function() {
        target = new MySQL.Communication();
    });

    it("can connect", function() {
        target.setSocketImpl({
            connect: function(host, port, callback) {
                expect("host1").toEqual(host);
                expect(1234).toEqual(port);
                callback("result1");
            }
        });
        target.connect("host1", 1234, function(actual) {
            expect("result1").toEqual(actual);
        });
    });

    it("can disconnect", function() {
        target.setSocketImpl({
            disconnect: function(callback) {
                callback("result1");
            }
        });
        target.disconnect(function(actual) {
            expect("result1").toEqual(actual);
        });
    });

    it("can check whether is connected", function() {
        target.setSocketImpl({
            isConnected: function() {
                return true;
            }
        });
        expect(true).toEqual(target.isConnected());
    });

    it("can read packet", function() {
        target.setSocketImpl({
            read: function(length, callback, fatalCallback) {
                var data;
                if (length == 3) {
                    data = new Uint8Array([0x05, 0, 0]);
                    callback({
                        resultCode: 0,
                        data: data
                    });
                } else if (length == 1) {
                    data = new Uint8Array([0x01]);
                    callback({
                        resultCode: 0,
                        data: data
                    });
                } else {
                    data = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x90]);
                    callback({
                        resultCode: 0,
                        data: data
                    });
                }
            }
        });
        target.readPacket(function(actual) {
            expect(5).toEqual(actual.dataLength);
            expect(1).toEqual(actual.sequenceNumber);
            var expected = [0x12, 0x34, 0x56, 0x78, 0x90];
            var actualArray = new Uint8Array(actual.data);
            for (var i = 0; i < expected.length; i++) {
                expect(expected[i]).toEqual(actualArray[i]);
            }
        }, function(){});
    });

    it("can read plural packets", function() {
        var SocketImplMock = function() {
            this.data = [
                0x01, 0, 0, 0, 0x41,
                0x02, 0, 0, 0x01, 0x41, 0x42,
                0x03, 0, 0, 0x02, 0x41, 0x42, 0x43
            ];
            this.pos = 0;
        };
        SocketImplMock.prototype.read = function(length, callback, fatalCallback) {
            var slice = this.data.slice(this.pos, this.pos + length);
            var array = new Uint8Array(slice);
            this.pos += length;
            callback({resultCode: 0, data: array.buffer});
        };
        target.setSocketImpl(new SocketImplMock());
        target.readPluralPackets(3, function(actual) {
            expect(3).toEqual(actual.length);
            var expected = [0x41];
            var actualArray = new Uint8Array(actual[0].data);
            for (var i = 0; i < expected.length; i++) {
                expect(expected[i]).toEqual(actualArray[i]);
            }
            expected = [0x41, 0x42];
            actualArray = new Uint8Array(actual[1].data);
            for (i = 0; i < expected.length; i++) {
                expect(expected[i]).toEqual(actualArray[i]);
            }
            expected = [0x41, 0x42, 0x43];
            actualArray = new Uint8Array(actual[2].data);
            for (i = 0; i < expected.length; i++) {
                expect(expected[i]).toEqual(actualArray[i]);
            }
        }, function() {});
    });

    it("can write packet", function() {
        var socketImpl = {
            write: function(packet, callback, errorCallback) {
                expect(3).toEqual(packet.dataLength);
                expect(2).toEqual(packet.sequenceNumber);
                var expected = [0x41, 0x42, 0x43];
                var actualArray = new Uint8Array(packet.data);
                for (var i = 0; i < expected.length; i++) {
                    expect(expected[i]).toEqual(actualArray[i]);
                }
                callback(5);
            }
        };
        target.setSocketImpl(socketImpl);
        var data = new Uint8Array([0x41, 0x42, 0x43]);
        var packet = new MySQL.Packet(2, data.buffer);
        target.writePacket(packet, function(result) {
            expect(5).toEqual(result);
        }, function() {});
    });

    it("can increase sequence number", function() {
        target.incrementSequenceNumber(5);
        expect(6).toEqual(target.nextSequenceNumber);
        target.incrementSequenceNumber(255);
        expect(0).toEqual(target.nextSequenceNumber);
    });

    it("can create packet", function() {
        var data = new Uint8Array([0x41, 0x42, 0x43]);
        target.nextSequenceNumber = 255;
        var actual = target.createPacket(data.buffer);
        expect(255).toEqual(actual.sequenceNumber);
        expect(3).toEqual(actual.dataLength);
        var actualArray = new Uint8Array(actual.data);
        for (var i = 0; i < data.length; i++) {
            expect(data[i]).toEqual(actualArray[i]);
        }
    });

    it("can reset sequence number", function() {
        target.nextSequenceNumber = 100;
        target.resetSequenceNumber();
        expect(0).toEqual(target.nextSequenceNumber);
    });

    it("can establish TLS", function() {
        var socketImpl = {
            establishTls: function(ca, checkCN, callback, fatalCallback) {
                expect("ca1").toEqual(ca);
                expect(true).toEqual(checkCN);
                callback();
            }
        };
        target.setSocketImpl(socketImpl);
        target.establishTls("ca1", true, function() {}, function() {});
    });

});
