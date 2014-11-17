describe("MySQL.Protocol", function() {

    var target;

    beforeEach(function() {
        target = new MySQL.Protocol();
    });

    it("can generate statistics request", function() {
        var actual = target.generateStatisticsRequest();
        expect(1).toEqual(actual.length);
        expect(0x09).toEqual(actual[0]);
    });

    it("can generate query request", function() {
        var actual = target.generateQueryRequest("ABC");
        expect(4).toEqual(actual.length);
        expect(0x03).toEqual(actual[0]);
        expect(0x41).toEqual(actual[1]);
        expect(0x42).toEqual(actual[2]);
        expect(0x43).toEqual(actual[3]);
    });

    it("can generate init DB request", function() {
        var actual = target.generateInitDBRequest("ABC");
        expect(4).toEqual(actual.length);
        expect(0x02).toEqual(actual[0]);
        expect(0x41).toEqual(actual[1]);
        expect(0x42).toEqual(actual[2]);
        expect(0x43).toEqual(actual[3]);
    });

    it ("can generate handshake response", function() {
        var initialHandshakeRequest = {
            authPluginName: "CBA"
        };
        var username = "ABC";
        var passwordHashBuffer = new ArrayBuffer(5);
        var passwordHash = new Uint8Array(passwordHashBuffer);
        passwordHash[0] = 0x41;
        passwordHash[1] = 0x42;
        passwordHash[2] = 0x43;
        passwordHash[3] = 0x44;
        passwordHash[4] = 0x45;
        var actual = target.generateHandshakeResponse(
            initialHandshakeRequest, username, passwordHash, false);
        var expected =
                [0x01, 0x82, 0x08, 0, 0xFF, 0xFF, 0xFF, 0, 0x21, 0,
                 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                 0, 0, 0x41, 0x42, 0x43, 0, 0x05, 0x41, 0x42, 0x43,
                 0x44, 0x45, 0x43, 0x42, 0x41, 0];
        for (var i = 0; i < actual.length; i++) {
            expect(expected[i]).toEqual(actual[i]);
        }
    });

    it ("can generate handshake response with no password", function() {
        var initialHandshakeRequest = {
            authPluginName: "CBA"
        };
        var username = "ABC";
        var passwordHash = null;
        var actual = target.generateHandshakeResponse(
            initialHandshakeRequest, username, passwordHash, false);
        var expected =
                [0x01, 0x82, 0x08, 0, 0xFF, 0xFF, 0xFF, 0, 0x21, 0,
                 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                 0, 0, 0x41, 0x42, 0x43, 0, 0,
                 0x43, 0x42, 0x41, 0];
        for (var i = 0; i < actual.length; i++) {
            expect(expected[i]).toEqual(actual[i]);
        }
    });

    it ("can generate handshake response with multi-statements", function() {
        var initialHandshakeRequest = {
            authPluginName: "CBA"
        };
        var username = "ABC";
        var passwordHashBuffer = new ArrayBuffer(5);
        var passwordHash = new Uint8Array(passwordHashBuffer);
        passwordHash[0] = 0x41;
        passwordHash[1] = 0x42;
        passwordHash[2] = 0x43;
        passwordHash[3] = 0x44;
        passwordHash[4] = 0x45;
        var actual = target.generateHandshakeResponse(
            initialHandshakeRequest, username, passwordHash, true);
        var expected =
                [0x01, 0x82, 0x0B, 0, 0xFF, 0xFF, 0xFF, 0, 0x21, 0,
                 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                 0, 0, 0x41, 0x42, 0x43, 0, 0x05, 0x41, 0x42, 0x43,
                 0x44, 0x45, 0x43, 0x42, 0x41, 0];
        for (var i = 0; i < actual.length; i++) {
            expect(expected[i]).toEqual(actual[i]);
        }
    });

    it ("can generate password hash", function() {
        var password = "pass";
        var initialHandshakeRequest = {
            authPluginDataPart1: new Uint8Array([0x01, 0x02, 0x03]),
            authPluginDataPart2: new Uint8Array([0x04, 0x05, 0x06])
        };
        var actual = target.generatePasswordHash(
            initialHandshakeRequest, password);
        var expected =
                [0x8c, 0x9b, 0xe0, 0x7d, 0x9d,
                 0xb4, 0x78, 0xc4, 0xd7, 0x32,
                 0xb9, 0x19, 0x61, 0x7d, 0x60,
                 0xf6, 0x0a, 0x3f, 0xea, 0xbc];
        for (var i = 0; i < actual.length; i++) {
            expect(expected[i]).toEqual(actual[i]);
        }
    });

    it ("can generate ping request", function() {
        var actual = target.generatePingRequest();
        var expected = [0x0e];
        for (var i = 0; i < actual.length; i++) {
            expect(expected[i]).toEqual(actual[i]);
        }
    });

    it ("can parse query result packet (OkResult)", function() {
        var data = [0, 0x05, 0x06, 0x34, 0x12,
                    0x78, 0x56, 0x41, 0x42, 0x43];
        var array = new Uint8Array(data, 0);
        var packet = new MySQL.Packet(2, array.buffer);
        target.parseQueryResultPacket(packet, function(actual) {
            expect(true).toEqual(actual.isSuccess());
            expect(5).toEqual(actual.affectedRows);
            expect(6).toEqual(actual.lastInsertId);
            expect(0x1234).toEqual(actual.statusFlags);
            expect(0x5678).toEqual(actual.warnings);
            expect("ABC").toEqual(actual.info);
            expect(false).toEqual(actual.hasResultset());
        });
    });

    it ("can parse query result packet (ErrResult)", function() {
        var data = [0xFF, 0x34, 0x12, 0x44, 0x41,
                    0x42, 0x43, 0x44, 0x45, 0x43,
                    0x42, 0x41];
        var array = new Uint8Array(data, 0);
        var packet = new MySQL.Packet(2, array.buffer);
        target.parseQueryResultPacket(packet, function(actual) {
            expect(false).toEqual(actual.isSuccess());
            expect(0x1234).toEqual(actual.errorCode);
            expect("D").toEqual(actual.sqlStateMarker);
            expect("ABCDE").toEqual(actual.sqlState);
            expect("CBA").toEqual(actual.errorMessage);
        });
    });

    it ("can parse query result packet (QueryResult)", function() {
        var data = [0xFC, 0x34, 0x12];
        var array = new Uint8Array(data, 0);
        var packet = new MySQL.Packet(2, array.buffer);
        target.parseQueryResultPacket(packet, function(actual) {
            expect(true).toEqual(actual.isSuccess());
            expect(true).toEqual(actual.hasResultset());
            expect(0x1234).toEqual(actual.columnCount);
        });
    });

    it ("can parse ok or err result packet (OkResult)", function() {
        var data = [0, 0x05, 0x06, 0x34, 0x12,
                    0x78, 0x56, 0x41, 0x42, 0x43];
        var array = new Uint8Array(data, 0);
        var packet = new MySQL.Packet(2, array.buffer);
        target.parseOkErrResultPacket(packet, function(actual) {
            expect(true).toEqual(actual.isSuccess());
            expect(5).toEqual(actual.affectedRows);
            expect(6).toEqual(actual.lastInsertId);
            expect(0x1234).toEqual(actual.statusFlags);
            expect(0x5678).toEqual(actual.warnings);
            expect("ABC").toEqual(actual.info);
            expect(false).toEqual(actual.hasResultset());
        });
    });

    it ("can parse ok or err result packet (ErrResult)", function() {
        var data = [0xFF, 0x34, 0x12, 0x44, 0x41,
                    0x42, 0x43, 0x44, 0x45, 0x43,
                    0x42, 0x41];
        var array = new Uint8Array(data, 0);
        var packet = new MySQL.Packet(2, array.buffer);
        target.parseOkErrResultPacket(packet, function(actual) {
            expect(false).toEqual(actual.isSuccess());
            expect(0x1234).toEqual(actual.errorCode);
            expect("D").toEqual(actual.sqlStateMarker);
            expect("ABCDE").toEqual(actual.sqlState);
            expect("CBA").toEqual(actual.errorMessage);
        });
    });

    it ("can parse ok or err result packet (null)", function() {
        var data = [0xFC, 0x34, 0x12];
        var array = new Uint8Array(data, 0);
        var packet = new MySQL.Packet(2, array.buffer);
        target.parseOkErrResultPacket(packet, function(actual) {
            expect(null).toEqual(actual);
        });
    });

    it ("can parse eof result packet", function() {
        var data = [0xFE, 0x34, 0x12, 0x78, 0x56];
        var array = new Uint8Array(data, 0);
        var packet = new MySQL.Packet(2, array.buffer);
        target.parseEofPacket(packet, function(actual) {
            expect(0x1234).toEqual(actual.warnings);
            expect(0x5678).toEqual(actual.statusFlags);
        });
    });

    it ("can parse initial handshake packet", function() {
        var data = [0x10, 0x41, 0x42, 0x43, 0x00, 0x78, 0x56, 0x34, 0x12, 0x12,
                    0x34, 0x56, 0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x89, 0x67,
                    0x02, 0x43, 0x21, 0x98, 0x76, 0x12, 0x00, 0x00, 0x00, 0x00,
                    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x12, 0x34, 0x56, 0x78,
                    0x90, 0x12, 0x34, 0x56, 0x78, 0x90, 0x12, 0x34, 0x41, 0x42,
                    0x43, 0x00];
        var array = new Uint8Array(data, 0);
        var packet = new MySQL.Packet(2, array.buffer);
        target.parseEofPacket(packet, function(actual) {
            expect(0x10).toEqual(actual.protocolVersion);
            expect("ABC").toEqual(actual.serverVersion);
            expect("0x12345678").toEqual(actual.connectionId);
            var expectedAuthPluginDataPart1 = new Uint8Array(
                [0x12, 0x34, 0x56, 0x78, 0x00, 0x00, 0x00, 0x00]);
            for (var i = 0; i < expectedAuthPluginDataPart1.length; i++) {
                expect(expectedAuthPluginDataPart1[i]).toEqual(
                    actual.authPluginDataPart1[i]);
            }
            expect(0x6789).toEqual(actual.capabilityFlag1);
            expect(0x02).toEqual(actual.characterSet);
            expect(0x2143).toEqual(actual.statusFlags);
            expect(0x7698).toEqual(actual.capabilityFlag2);
            expect(0x12).toEqual(actual.authPluginDataLen);
            var expectedAuthPluginDataPart2 = new Uint8Array(
                [0x12, 0x34, 0x56, 0x78, 0x90,
                 0x12, 0x34, 0x56, 0x78, 0x90,
                 0x12, 0x34]);
            for (i = 0; i < expectedAuthPluginDataPart2.length; i++) {
                expect(expectedAuthPluginDataPart2[i]).toEqual(
                    actual.authPluginDataPart2[i]);
            }
            expect("ABC").toEqual(actual.authPluginName);
        });
    });

    it ("can parse column definition packet", function() {
        var data = [0x03, 0x61, 0x62, 0x63,
                    0x02, 0x41, 0x42,
                    0x04, 0x41, 0x42, 0x43, 0x44,
                    0x04, 0x44, 0x43, 0x42, 0x41,
                    0x03, 0x63, 0x62, 0x61,
                    0x03, 0x43, 0x42, 0x41,
                    0xFC, 0x34, 0x12,
                    0x12, 0x34,
                    0xFC, 0x78, 0x90,
                    0x45,
                    0x87, 0x65,
                    0x56];
        var array = new Uint8Array(data, 0);
        var packet = new MySQL.Packet(2, array.buffer);
        target.parseColumnDefinitionPacket(packet, function(actual) {
            expect("abc").toEqual(actual.catalogResult);
            expect("AB").toEqual(actual.schemaResult);
            expect("ABCD").toEqual(actual.tableResult);
            expect("DCBA").toEqual(actual.orgTableResult);
            expect("cba").toEqual(actual.nameResult);
            expect("CBA").toEqual(actual.orgNameResult);
            expect(0x1234).toEqual(actual.nextLengthResult);
            expect(0x3412).toEqual(actual.characterSet);
            expect(0x9078).toEqual(actual.columnLength);
            expect(0x45).toEqual(actual.columnType);
            expect(0x6587).toEqual(actual.flags);
            expect(0x56).toEqual(actual.decimals);
        });
    });

    it ("can parse resultset rows packet", function() {
        var data = [0x03, 0x41, 0x42, 0x43,
                    0x05, 0x61, 0x62, 0x63, 0x64, 0x65];
        var array = new Uint8Array(data, 0);
        var packet = new MySQL.Packet(2, array.buffer);
        target.parseResultsetRowPacket(packet, function(actual) {
            var values = actual.values;
            expect(2).toEqual(values.length);
            expect("ABC").toEqual(values[0]);
            expect("abcde").toEqual(values[1]);
        });
    });

    it ("can parse statistics result packet", function() {
        var data = [0x41, 0x42, 0x43, 0x61, 0x62, 0x63, 0x64, 0x65];
        var array = new Uint8Array(data, 0);
        var packet = new MySQL.Packet(2, array.buffer);
        target.parseStatisticsResultPacket(packet, function(actual) {
            expect("ABCabcde").toEqual(actual);
        });
    });

    it ("can generate SSL request", function() {
        var initialHandshakeRequest = {};
        var actual = target.generateSSLRequest(initialHandshakeRequest, false);
        var expected =
                [0x01, 0x8A, 0x08, 0, 0xFF, 0xFF, 0xFF, 0, 0x21,
                 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                 0, 0, 0];
        for (var i = 0; i < actual.length; i++) {
            expect(expected[i]).toEqual(actual[i]);
        }
    });

    it ("can generate SSL request with multi-statements", function() {
        var initialHandshakeRequest = {};
        var actual = target.generateSSLRequest(initialHandshakeRequest, true);
        var expected =
                [0x01, 0x8A, 0x0B, 0, 0xFF, 0xFF, 0xFF, 0, 0x21,
                 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                 0, 0, 0];
        for (var i = 0; i < actual.length; i++) {
            expect(expected[i]).toEqual(actual[i]);
        }
    });

});
