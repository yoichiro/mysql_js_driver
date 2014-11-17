(function(MySQLCommunication, MySQLProtocol, NetworkErrorCode) {
    "use strict";

    // Constructor

    var Client = function() {
        this.mySQLCommunication = new MySQLCommunication();
        this.mySQLProtocol = new MySQLProtocol();
        this.networkErrorCode = new NetworkErrorCode();
    };

    // Private methods

    var _handshake = function(username, password, multiStatements, callback, fatalCallback) {
        this.mySQLCommunication.readPacket(function(packet) {
            var initialHandshakeRequest =
                    this.mySQLProtocol.parseInitialHandshakePacket(packet);
            _sendHandshakeResponse.call(
                this, initialHandshakeRequest, username, password, multiStatements,
                callback, fatalCallback);
        }.bind(this), fatalCallback);
    };

    var _sendHandshakeResponse = function(initialHandshakeRequest, username, password, multiStatements, callback, fatalCallback) {
        var passwordHash;
        if (password) {
            passwordHash =
                this.mySQLProtocol.generatePasswordHash(
                    initialHandshakeRequest, password);
        } else {
            passwordHash = null;
        }
        var handshakeResponse =
                this.mySQLProtocol.generateHandshakeResponse(
                    initialHandshakeRequest, username, passwordHash, multiStatements);
        var handshakeResponsePacket =
                this.mySQLCommunication.createPacket(handshakeResponse.buffer);
        this.mySQLCommunication.writePacket(handshakeResponsePacket, function(writeInfo) {
            this.mySQLCommunication.readPacket(function(packet) {
                var result = this.mySQLProtocol.parseOkErrResultPacket(packet);
                callback(initialHandshakeRequest, result);
            }.bind(this), fatalCallback);
        }.bind(this), fatalCallback);
    };

    var _handshakeWithSSL = function(ca, checkCN, username, password, multiStatements, callback, fatalCallback) {
        this.mySQLCommunication.readPacket(function(packet) {
            var initialHandshakeRequest =
                    this.mySQLProtocol.parseInitialHandshakePacket(packet);
            var connectWithSSLRequest =
                    this.mySQLProtocol.generateSSLRequest(initialHandshakeRequest, multiStatements);
            var connectWithSSLRequestPacket =
                    this.mySQLCommunication.createPacket(connectWithSSLRequest.buffer);
            this.mySQLCommunication.writePacket(connectWithSSLRequestPacket, function(writeInfo) {
                this.mySQLCommunication.establishTls(ca, checkCN, function() {
                    this.mySQLCommunication.incrementSequenceNumber(
                        connectWithSSLRequestPacket.sequenceNumber);
                    _sendHandshakeResponse.call(
                        this, initialHandshakeRequest, username, password, multiStatements,
                        callback, fatalCallback);
                }.bind(this), fatalCallback);
            }.bind(this), fatalCallback);
        }.bind(this), fatalCallback);
    };

    var _readResultsetRows = function(result, callback, errorCallback, fatalCallback) {
        this.mySQLCommunication.readPacket(function(packet) {
            var eofResult = this.mySQLProtocol.parseEofPacket(packet);
            var errResult = this.mySQLProtocol.parseOkErrResultPacket(packet);
            if (eofResult) {
                callback(result, eofResult);
            } else if (errResult && !errResult.isSuccess()) {
                errorCallback(errResult);
            } else {
                var row = this.mySQLProtocol.parseResultsetRowPacket(packet);
                result.push(row);
                _readResultsetRows.call(this, result, callback, errorCallback, fatalCallback);
            }
        }.bind(this), fatalCallback);
    };

    var _readColumnDefinitions = function(columnCount, resultsetCallback,
                                          noResultsetCallback, errorCallback,
                                          fatalCallback) {
        this.mySQLCommunication.readPluralPackets(columnCount, function(packets) {
            var columnDefinitions = [];
            for (var i = 0; i < packets.length; i++) {
                columnDefinitions.push(
                    this.mySQLProtocol.parseColumnDefinitionPacket(
                        packets[i]));
            }
            this.mySQLCommunication.readPacket(function(packet) {
                this.mySQLProtocol.parseEofPacket(packet);
                _readResultsetRows.call(this, [], function(resultsetRows, eofResult) {
                    resultsetCallback(columnDefinitions, resultsetRows, eofResult);
                }.bind(this), errorCallback, fatalCallback);
            }.bind(this), fatalCallback);
        }.bind(this), fatalCallback);
    };

    var _readQueryResult = function(resultsetCallback, noResultsetCallback,
                                    errorCallback, fatalCallback) {
        this.mySQLCommunication.readPacket(function(packet) {
            this.mySQLProtocol.parseQueryResultPacket(packet, function(result) {
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
        var queryRequest = this.mySQLProtocol.generateQueryRequest(queryString);
        var queryPacket = this.mySQLCommunication.createPacket(queryRequest.buffer);
        this.mySQLCommunication.writePacket(queryPacket, function(writeInfo) {
            _readQueryResult.call(this, resultsetCallback, noResultsetCallback,
                             errorCallback, fatalCallback);
        }.bind(this), fatalCallback);
    };

    // Public methods

    Client.prototype.setSocketImpl = function(impl) {
        this.mySQLCommunication.setSocketImpl(impl);
    };

    Client.prototype.login = function(host, port, username, password, multiStatements,
                                      callback, errorCallback, fatalCallback) {
        this.mySQLCommunication.connect(host, port, function(result) {
            if (result >= 0) {
                _handshake.call(this, username, password, multiStatements, callback, fatalCallback);
            } else {
                errorCallback(result + "(" +
                              this.networkErrorCode.getErrorMessage(result) + ")");
            }
        }.bind(this));
    };

    Client.prototype.loginWithSSL = function(host, port, username, password, multiStatements,
                                             ca, checkCN,
                                             callback, errorCallback, fatalCallback) {
        this.mySQLCommunication.connect(host, port, function(result) {
            if (result >= 0) {
                _handshakeWithSSL.call(this, ca, checkCN, username, password, multiStatements, callback, fatalCallback);
            } else {
                errorCallback(result + "(" +
                              this.networkErrorCode.getErrorMessage(result) + ")");
            }
        }.bind(this));
    };

    Client.prototype.logout = function(callback) {
        this.mySQLCommunication.disconnect(callback);
    };

    Client.prototype.query = function(queryString, resultsetCallback,
                                      noResultsetCallback,
                                      errorCallback, fatalCallback) {
        if (!this.mySQLCommunication.isConnected()) {
            fatalCallback("Not connected.");
            return;
        }
        this.mySQLCommunication.resetSequenceNumber();
        _sendQueryRequest.call(this,
                               queryString, resultsetCallback, noResultsetCallback,
                               errorCallback, fatalCallback);
    };

    Client.prototype.getNextQueryResult = function(resultsetCallback,
                                                     noResultsetCallback,
                                                     errorCallback, fatalCallback) {
        if (!this.mySQLCommunication.isConnected()) {
            fatalCallback("Not connected.");
            return;
        }
        _readQueryResult.call(this,
                              resultsetCallback, noResultsetCallback,
                              errorCallback, fatalCallback);
    };

    Client.prototype.getDatabases = function(callback, errorCallback, fatalCallback) {
        if (!this.mySQLCommunication.isConnected()) {
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
        if (!this.mySQLCommunication.isConnected()) {
            fatalCallback("Not connected.");
            return;
        }
        this.mySQLCommunication.resetSequenceNumber();
        var initDBRequest = this.mySQLProtocol.generateInitDBRequest(schemaName);
        var initDBPacket = this.mySQLCommunication.createPacket(initDBRequest.buffer);
        this.mySQLCommunication.writePacket(initDBPacket, function(writeInfo) {
            this.mySQLCommunication.readPacket(function(packet) {
                var result = this.mySQLProtocol.parseOkErrResultPacket(packet);
                callback(result);
            }.bind(this), fatalCallback);
        }.bind(this), fatalCallback);
    };

    Client.prototype.getStatistics = function(callback, fatalCallback) {
        if (!this.mySQLCommunication.isConnected()) {
            fatalCallback("Not connected.");
            return;
        }
        this.mySQLCommunication.resetSequenceNumber();
        var statisticsRequest = this.mySQLProtocol.generateStatisticsRequest();
        var statisticsPacket = this.mySQLCommunication.createPacket(statisticsRequest);
        this.mySQLCommunication.writePacket(statisticsPacket, function(writeInfo) {
            this.mySQLCommunication.readPacket(function(packet) {
                var statistics = this.mySQLProtocol.parseStatisticsResultPacket(packet);
                callback(statistics);
            }.bind(this), fatalCallback);
        }.bind(this), fatalCallback);
    };

    Client.prototype.ping = function(callback, fatalCallback) {
        if (!this.mySQLCommunication.isConnected()) {
            fatalCallback("Not connected.");
            return;
        }
        this.mySQLCommunication.resetSequenceNumber();
        var pingRequest = this.mySQLProtocol.generatePingRequest();
        var pingPacket = this.mySQLCommunication.createPacket(pingRequest);
        this.mySQLCommunication.writePacket(pingPacket, function(writeInfo) {
            this.mySQLCommunication.readPacket(function(packet) {
                var result = this.mySQLProtocol.parseOkErrResultPacket(packet);
                callback(result);
            }.bind(this), fatalCallback);
        }.bind(this), fatalCallback);
    };

    Client.prototype.isConnected = function() {
        return this.mySQLCommunication.isConnected();
    };

    // Export

    MySQL.Client = Client;

})(MySQL.Communication, MySQL.Protocol, MySQL.NetworkErrorCode);
