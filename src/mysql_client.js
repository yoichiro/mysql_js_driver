(function(mySQLCommunication, mySQLProtocol, networkErrorCode) {
    "use strict";

    // Constructor

    var Client = function() {
    };

    // Private methods

    var _handshake = function(username, password, callback, fatalCallback) {
        mySQLCommunication.readPacket(function(packet) {
            var initialHandshakeRequest =
                    mySQLProtocol.parseInitialHandshakePacket(packet);
            _sendHandshakeResponse.call(
                this, initialHandshakeRequest, username, password,
                callback, fatalCallback);
        }.bind(this), fatalCallback);
    };

    var _sendHandshakeResponse = function(initialHandshakeRequest, username, password, callback, fatalCallback) {
        var passwordHash;
        if (password) {
            passwordHash =
                mySQLProtocol.generatePasswordHash(
                    initialHandshakeRequest, password);
        } else {
            passwordHash = null;
        }
        var handshakeResponse =
                mySQLProtocol.generateHandshakeResponse(
                    initialHandshakeRequest, username, passwordHash);
        var handshakeResponsePacket =
                mySQLCommunication.createPacket(handshakeResponse.buffer);
        mySQLCommunication.writePacket(handshakeResponsePacket, function(writeInfo) {
            mySQLCommunication.readPacket(function(packet) {
                var result = mySQLProtocol.parseOkErrResultPacket(packet);
                callback(initialHandshakeRequest, result);
            }.bind(this), fatalCallback);
        }.bind(this), fatalCallback);
    };

    var _handshakeWithSSL = function(ca, checkCN, username, password, callback, fatalCallback) {
        mySQLCommunication.readPacket(function(packet) {
            var initialHandshakeRequest =
                    mySQLProtocol.parseInitialHandshakePacket(packet);
            var connectWithSSLRequest =
                    mySQLProtocol.generateSSLRequest(initialHandshakeRequest);
            var connectWithSSLRequestPacket =
                    mySQLCommunication.createPacket(connectWithSSLRequest.buffer);
            mySQLCommunication.writePacket(connectWithSSLRequestPacket, function(writeInfo) {
                mySQLCommunication.establishTls(ca, checkCN, function() {
                    mySQLCommunication.incrementSequenceNumber(
                        connectWithSSLRequestPacket.sequenceNumber);
                    _sendHandshakeResponse.call(
                        this, initialHandshakeRequest, username, password,
                        callback, fatalCallback);
                }.bind(this), fatalCallback);
            }.bind(this), fatalCallback);
        }.bind(this), fatalCallback);
    };

    var _readResultsetRows = function(result, callback, fatalCallback) {
        mySQLCommunication.readPacket(function(packet) {
            var eofResult = mySQLProtocol.parseEofPacket(packet);
            if (eofResult) {
                callback(result);
            } else {
                var row = mySQLProtocol.parseResultsetRowPacket(packet);
                result.push(row);
                _readResultsetRows.call(this, result, callback, fatalCallback);
            }
        }.bind(this), fatalCallback);
    };

    var _readColumnDefinitions = function(columnCount, resultsetCallback,
                                          noResultsetCallback, errorCallback,
                                          fatalCallback) {
        mySQLCommunication.readPluralPackets(columnCount, function(packets) {
            var columnDefinitions = [];
            for (var i = 0; i < packets.length; i++) {
                columnDefinitions.push(
                    mySQLProtocol.parseColumnDefinitionPacket(
                        packets[i]));
            }
            mySQLCommunication.readPacket(function(packet) {
                mySQLProtocol.parseEofPacket(packet);
                _readResultsetRows.call(this, [], function(resultsetRows) {
                    resultsetCallback(columnDefinitions, resultsetRows);
                }.bind(this), fatalCallback);
            }.bind(this), fatalCallback);
        }.bind(this), fatalCallback);
    };

    var _readQueryResult = function(resultsetCallback, noResultsetCallback,
                                    errorCallback, fatalCallback) {
        mySQLCommunication.readPacket(function(packet) {
            mySQLProtocol.parseQueryResultPacket(packet, function(result) {
                if (result.isSuccess() && result.hasResultset()) {
                    var columnCount = result.columnCount;
                    _readColumnDefinitions.call(
                        this, columnCount, resultsetCallback, noResultsetCallback,
                        errorCallback, fatalCallback);
                } else if (result.isSuccess() && !result.hasResultset()) {
                    noResultsetCallback(result);
                } else {
                    errorCallback(result);
                }
            }.bind(this));
        }.bind(this), fatalCallback);
    };

    var _sendQueryRequest = function(queryString, resultsetCallback,
                                     noResultsetCallback,
                                     errorCallback, fatalCallback) {
        var queryRequest = mySQLProtocol.generateQueryRequest(queryString);
        var queryPacket = mySQLCommunication.createPacket(queryRequest.buffer);
        mySQLCommunication.writePacket(queryPacket, function(writeInfo) {
            _readQueryResult.call(this, resultsetCallback, noResultsetCallback,
                             errorCallback, fatalCallback);
        }.bind(this), fatalCallback);
    };

    // Public methods

    Client.prototype.login = function(host, port, username, password,
                                      callback, errorCallback, fatalCallback) {
        mySQLCommunication.connect(host, port, function(result) {
            if (result >= 0) {
                _handshake.call(this, username, password, callback, fatalCallback);
            } else {
                errorCallback(result + "(" +
                              networkErrorCode.getErrorMessage(result) + ")");
            }
        }.bind(this));
    };

    Client.prototype.loginWithSSL = function(host, port, username, password,
                                             ca, checkCN,
                                             callback, errorCallback, fatalCallback) {
        mySQLCommunication.connect(host, port, function(result) {
            if (result >= 0) {
                _handshakeWithSSL.call(this, ca, checkCN, username, password, callback, fatalCallback);
            } else {
                errorCallback(result + "(" +
                              networkErrorCode.getErrorMessage(result) + ")");
            }
        }.bind(this));
    };

    Client.prototype.logout = function(callback) {
        mySQLCommunication.disconnect(callback);
    };

    Client.prototype.query = function(queryString, resultsetCallback,
                                      noResultsetCallback,
                                      errorCallback, fatalCallback) {
        if (!mySQLCommunication.isConnected()) {
            fatalCallback("Not connected.");
            return;
        }
        mySQLCommunication.resetSequenceNumber();
        _sendQueryRequest.call(this,
                               queryString, resultsetCallback, noResultsetCallback,
                               errorCallback, fatalCallback);
    };

    Client.prototype.getDatabases = function(callback, errorCallback, fatalCallback) {
        if (!mySQLCommunication.isConnected()) {
            fatalCallback("Not connected.");
            return;
        }
        this.query("SHOW DATABASES", function(columnDefinitions, resultsetRows) {
            var databases = [];
            for (var i = 0; i < resultsetRows.length; i++) {
                databases.push(resultsetRows[i].values[0]);
            }
            callback(databases);
        }.bind(this), function(result) {
            console.log("This callback function never be called.");
        }.bind(this), function(result) {
            errorCallback(result);
        }.bind(this), fatalCallback);
    };

    Client.prototype.initDB = function(schemaName, callback, fatalCallback) {
        if (!mySQLCommunication.isConnected()) {
            fatalCallback("Not connected.");
            return;
        }
        mySQLCommunication.resetSequenceNumber();
        var initDBRequest = mySQLProtocol.generateInitDBRequest(schemaName);
        var initDBPacket = mySQLCommunication.createPacket(initDBRequest.buffer);
        mySQLCommunication.writePacket(initDBPacket, function(writeInfo) {
            mySQLCommunication.readPacket(function(packet) {
                var result = mySQLProtocol.parseOkErrResultPacket(packet);
                callback(result);
            }.bind(this), fatalCallback);
        }.bind(this), fatalCallback);
    };

    Client.prototype.getStatistics = function(callback, fatalCallback) {
        if (!mySQLCommunication.isConnected()) {
            fatalCallback("Not connected.");
            return;
        }
        mySQLCommunication.resetSequenceNumber();
        var statisticsRequest = mySQLProtocol.generateStatisticsRequest();
        var statisticsPacket = mySQLCommunication.createPacket(statisticsRequest);
        mySQLCommunication.writePacket(statisticsPacket, function(writeInfo) {
            mySQLCommunication.readPacket(function(packet) {
                var statistics = mySQLProtocol.parseStatisticsResultPacket(packet);
                callback(statistics);
            }.bind(this), fatalCallback);
        }.bind(this), fatalCallback);
    };

    Client.prototype.ping = function(callback, fatalCallback) {
        if (!mySQLCommunication.isConnected()) {
            fatalCallback("Not connected.");
            return;
        }
        mySQLCommunication.resetSequenceNumber();
        var pingRequest = mySQLProtocol.generatePingRequest();
        var pingPacket = mySQLCommunication.createPacket(pingRequest);
        mySQLCommunication.writePacket(pingPacket, function(writeInfo) {
            mySQLCommunication.readPacket(function(packet) {
                var result = mySQLProtocol.parseOkErrResultPacket(packet);
                callback(result);
            }.bind(this), fatalCallback);
        }.bind(this), fatalCallback);
    };

    // Export

    MySQL.client = new Client();

})(MySQL.communication, MySQL.protocol, MySQL.networkErrorCode);
