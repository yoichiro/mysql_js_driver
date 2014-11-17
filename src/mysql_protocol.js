(function(BinaryUtils,
          MySQLTypes,
          Hasher,
          QueryResult,
          OkResult,
          ErrResult,
          EofResult,
          InitialHandshakeRequest,
          ColumnDefinition,
          ResultsetRow) {
    "use strict";

    // Constructor

    var Protocol = function() {
        this.binaryUtils = new BinaryUtils();
        this.mySQLTypes = new MySQLTypes();
        this.hasher = new Hasher();
    };

    // Private methods

    var _createOkResult = function(data, offset, dataLength) {
        var affectedRowsResult = this.mySQLTypes.getLengthEncodedInteger(data, offset);
        var affectedRows = affectedRowsResult.result;
        var lastInsertIdResult =
                this.mySQLTypes.getLengthEncodedInteger(
                    data, affectedRowsResult.nextPosition);
        var lastInsertId = lastInsertIdResult.result;
        var statusFlags =
                this.mySQLTypes.getFixedLengthInteger(
                    data, lastInsertIdResult.nextPosition, 2);
        var warnings =
                this.mySQLTypes.getFixedLengthInteger(
                    data, lastInsertIdResult.nextPosition + 2, 2);
        var info = "";
        if (dataLength > lastInsertIdResult.nextPosition + 4) {
            var length = dataLength - lastInsertIdResult.nextPosition + 4;
            info = this.mySQLTypes.getFixedLengthString(
                data, lastInsertIdResult.nextPosition + 4, length);
        }
        return new OkResult(
            affectedRows, lastInsertId, statusFlags, warnings, info);
    };

    var _createErrResult = function(data, offset, dataLength) {
        var errorCode = this.mySQLTypes.getFixedLengthInteger(data, offset, 2);
        var sqlStateMarker = this.mySQLTypes.getFixedLengthString(data, offset + 2, 1);
        var sqlState = this.mySQLTypes.getFixedLengthString(data, offset + 3, 5);
        var errorMessageLength = dataLength - offset - 8;
        var errorMessage =
                this.mySQLTypes.getFixedLengthString(
                    data, offset + 8, errorMessageLength);
        return new ErrResult(errorCode, sqlStateMarker, sqlState, errorMessage);
    };

    // Public methods

    Protocol.prototype.generateStatisticsRequest = function() {
        var buffer = new ArrayBuffer(1);
        var array = new Uint8Array(buffer);
        array[0] = 0x09;
        return array;
    };

    Protocol.prototype.generateQueryRequest = function(queryString) {
        var buffer = this.binaryUtils.stringToArrayBuffer(queryString);
        var view = new Uint8Array(buffer);
        var array = this.binaryUtils.createUint8Array(1 + view.length);
        array[0] = 0x03;
        array.set(view, 1);
        return array;
    };

    Protocol.prototype.generateInitDBRequest = function(schemaName) {
        var schemaNameBuffer = this.binaryUtils.stringToArrayBuffer(schemaName);
        var schemaNameArray = new Uint8Array(schemaNameBuffer);
        var resultArray = this.binaryUtils.createUint8Array(1 + schemaNameArray.length);
        resultArray[0] = 0x02;
        resultArray.set(schemaNameArray, 1);
        return resultArray;
    };

    Protocol.prototype.generateSSLRequest = function(initialHandshakeRequest, multiStatements) {
        var capabilityFlagsValue =
                0x00001 // CLIENT_LONG_PASSWORD
              | 0x00200 // CLIENT_PROTOCOL_41
              | 0x00800 // CLIENT_SSL
              | 0x08000 // CLIENT_SECURE_CONNECTION
              | 0x80000; // CLIENT_PLUGIN_AUTH
        if (multiStatements) {
            capabilityFlagsValue |= 0x10000; // CLIENT_MULTI_STATEMENTS
            capabilityFlagsValue |= 0x20000; // CLIENT_MULTI_RESULTS
        }
        var capabilityFlags =
                this.mySQLTypes.createFixedLengthInteger(capabilityFlagsValue, 4);
        var maxPacketSize =
                this.mySQLTypes.createFixedLengthInteger(0xFFFFFF, 4); // About 16MB
        var characterSet =
                this.mySQLTypes.createLengthEncodedInteger(0x21); // utf8_general_ci
        var length =
                capabilityFlags.length +
                maxPacketSize.length +
                characterSet.length +
                23;
        var buffer = new ArrayBuffer(length);
        var array = new Uint8Array(buffer);
        var offset = 0;
        array.set(capabilityFlags, offset);
        offset += capabilityFlags.length;
        array.set(maxPacketSize, offset);
        offset += maxPacketSize.length;
        array.set(characterSet, offset);
        return array;
    };

    Protocol.prototype.generateHandshakeResponse = function(
        initialHandshakeRequest, username, passwordHash, multiStatements) {
        var capabilityFlagsValue =
                0x00001 // CLIENT_LONG_PASSWORD
              | 0x00200 // CLIENT_PROTOCOL_41
              | 0x08000 // CLIENT_SECURE_CONNECTION
              | 0x80000; // CLIENT_PLUGIN_AUTH
        if (multiStatements) {
            capabilityFlagsValue |= 0x10000; // CLIENT_MULTI_STATEMENTS
            capabilityFlagsValue |= 0x20000; // CLIENT_MULTI_RESULTS
        }
        var capabilityFlags =
                this.mySQLTypes.createFixedLengthInteger(capabilityFlagsValue, 4);
        var maxPacketSize =
                this.mySQLTypes.createFixedLengthInteger(0xFFFFFF, 4); // About 16MB
        var characterSet =
                this.mySQLTypes.createLengthEncodedInteger(0x21); // utf8_general_ci
        var usernameArray = this.mySQLTypes.createNullEndString(username);
        var passwordHashLength;
        if (passwordHash === null) {
            passwordHashLength = 0;
        } else {
            passwordHashLength =
                this.mySQLTypes.createLengthEncodedInteger(passwordHash.length);
        }
        var authPluginName =
                this.mySQLTypes.createNullEndString(initialHandshakeRequest.authPluginName);
        var length =
                capabilityFlags.length +
                maxPacketSize.length +
                characterSet.length +
                23 +
                usernameArray.length +
                authPluginName.length;
        if (passwordHash === null) {
            length += 1;
        } else {
            length += passwordHashLength.length + passwordHash.length;
        }
        var buffer = new ArrayBuffer(length);
        var array = new Uint8Array(buffer);
        var offset = 0;
        array.set(capabilityFlags, offset);
        offset += capabilityFlags.length;
        array.set(maxPacketSize, offset);
        offset += maxPacketSize.length;
        array.set(characterSet, offset);
        offset += characterSet.length;
        offset += 23;
        array.set(usernameArray, offset);
        offset += usernameArray.length;
        if (passwordHash === null) {
            array.set([0], offset);
            offset += 1;
        } else {
            array.set(passwordHashLength, offset);
            offset += passwordHashLength.length;
            array.set(passwordHash, offset);
            offset += passwordHash.length;
        }
        array.set(authPluginName, offset);
        return array;
    };

    Protocol.prototype.generatePasswordHash = function(
        initialHandshakeRequest, passwordString) {
        var password1Array = this.hasher.sha1ToUint8Array(passwordString);
        var password2Array = this.hasher.sha1Uint8ArrayToUint8Array(password1Array);
        var authPluginDataPart1 = initialHandshakeRequest.authPluginDataPart1;
        var authPluginDataPart2 = initialHandshakeRequest.authPluginDataPart2;
        var sourceBuffer = new ArrayBuffer(authPluginDataPart1.length +
                                           authPluginDataPart2.length +
                                           password2Array.length);
        var sourceView = new Uint8Array(sourceBuffer);
        sourceView.set(authPluginDataPart1, 0);
        sourceView.set(authPluginDataPart2, authPluginDataPart1.length);
        sourceView.set(password2Array,
                       authPluginDataPart1.length + authPluginDataPart2.length);
        var hashedSourceArray = this.hasher.sha1Uint8ArrayToUint8Array(sourceView);
        var result = new Uint8Array(password1Array.length);
        for (var i = 0; i < result.length; i++) {
            result[i] = password1Array[i] ^ hashedSourceArray[i];
        }
        return result;
    };

    Protocol.prototype.generatePingRequest = function() {
        var array = this.binaryUtils.createUint8Array(1);
        array[0] = 0x0e;
        return array;
    };

    Protocol.prototype.parseQueryResultPacket = function(packet, callback) {
        var data = packet.data;
        var header = this.mySQLTypes.getFixedLengthInteger(data, 0, 1);
        if (header === 0) {
            // No result set
            var okResult = _createOkResult.call(
                this, data, 1, packet.dataLength);
            callback(okResult);
        } else if (header == 0xFF) {
            // Error
            var errResult = _createErrResult.call(
                this, data, 1, packet.dataLength);
            callback(errResult);
        } else {
            // Result set exists
            var columnCountResult = this.mySQLTypes.getLengthEncodedInteger(data, 0);
            var queryResult = new QueryResult(columnCountResult.result);
            callback(queryResult);
        }
    };

    Protocol.prototype.parseOkErrResultPacket = function(packet) {
        var data = packet.data;
        var header = this.mySQLTypes.getFixedLengthInteger(data, 0, 1);
        if (header === 0) {
            // Succeeded
            return _createOkResult.call(
                this, data, 1, packet.dataLength);
        } else if (header == 0xFF) {
            // Error
            return _createErrResult.call(
                this, data, 1, packet.dataLength);
        } else {
            // TODO: Unknown
            return null;
        }
    };

    Protocol.prototype.parseEofPacket = function(packet) {
        var data = packet.data;
        var header = this.mySQLTypes.getFixedLengthInteger(data, 0, 1);
        if (header == 0xFE) {
            var warningCount = this.mySQLTypes.getFixedLengthInteger(data, 1, 2);
            var statusFlags = this.mySQLTypes.getFixedLengthInteger(data, 3, 2);
            return new EofResult(warningCount, statusFlags);
        } else {
            // TODO: Unknown
            return null;
        }
    };

    Protocol.prototype.parseInitialHandshakePacket = function(packet) {
        var data = packet.data;
        var offset = 0;
        var protocolVersion = this.mySQLTypes.getFixedLengthInteger(data, offset++, 1);
        var serverVersionResult = this.mySQLTypes.getNullEndString(data, offset);
        var serverVersion = serverVersionResult.result;
        offset = serverVersionResult.nextPosition;
        var connectionId = this.mySQLTypes.getFixedLengthInteger(data, offset, 4);
        offset += 4;
        var authPluginDataPart1 = new Uint8Array(data, offset, 8);
        offset += 8 + 1; // Skip 1 byte
        var capabilityFlag1 = this.mySQLTypes.getFixedLengthInteger(data, offset, 2);
        offset += 2;
        var characterSet = this.mySQLTypes.getFixedLengthInteger(data, offset++, 1);
        var statusFlags = this.mySQLTypes.getFixedLengthInteger(data, offset, 2);
        offset += 2;
        var capabilityFlag2 = this.mySQLTypes.getFixedLengthInteger(data, offset, 2);
        offset += 2;
        var authPluginDataLen = this.mySQLTypes.getFixedLengthInteger(data, offset++, 1);
        offset += 10; // Skip 10 bytes
        var authPluginDataPart2 = new Uint8Array(data, offset, 12);
        offset += 12 + 1; // Skip 1 byte
        var authPluginNameResult = this.mySQLTypes.getNullEndString(data, offset);
        var authPluginName = authPluginNameResult.result;
        return new InitialHandshakeRequest(protocolVersion,
                                           serverVersion,
                                           connectionId,
                                           authPluginDataPart1,
                                           capabilityFlag1,
                                           characterSet,
                                           statusFlags,
                                           capabilityFlag2,
                                           authPluginDataLen,
                                           authPluginDataPart2,
                                           authPluginName);
    };

    Protocol.prototype.parseColumnDefinitionPacket = function(packet) {
        var data = packet.data;
        var catalogResult = this.mySQLTypes.getLengthEncodedString(data, 0);
        var schemaResult = this.mySQLTypes.getLengthEncodedString(
            data, catalogResult.nextPosition);
        var tableResult = this.mySQLTypes.getLengthEncodedString(
            data, schemaResult.nextPosition);
        var orgTableResult = this.mySQLTypes.getLengthEncodedString(
            data, tableResult.nextPosition);
        var nameResult = this.mySQLTypes.getLengthEncodedString(
            data, orgTableResult.nextPosition);
        var orgNameResult = this.mySQLTypes.getLengthEncodedString(
            data, nameResult.nextPosition);
        var nextLengthResult = this.mySQLTypes.getLengthEncodedInteger(
            data, orgNameResult.nextPosition);
        var offset = nextLengthResult.nextPosition;
        var characterSet = this.mySQLTypes.getFixedLengthInteger(data, offset, 2);
        offset += 2;
        var columnLength = this.mySQLTypes.getFixedLengthInteger(data, offset, 4);
        offset += 4;
        var columnType = this.mySQLTypes.getFixedLengthInteger(data, offset, 1);
        offset += 1;
        var flags = this.mySQLTypes.getFixedLengthInteger(data, offset, 2);
        offset += 2;
        var decimals = this.mySQLTypes.getFixedLengthInteger(data, offset, 1);
        return new ColumnDefinition(catalogResult.result,
                                    schemaResult.result,
                                    tableResult.result,
                                    orgTableResult.result,
                                    nameResult.result,
                                    orgNameResult.result,
                                    nextLengthResult.result,
                                    characterSet,
                                    columnLength,
                                    columnType,
                                    flags,
                                    decimals);
    };

    Protocol.prototype.parseResultsetRowPacket = function(packet) {
        var data = packet.data;
        var offset = 0;
        var values = [];
        while(offset < packet.dataLength) {
            var valueResult = this.mySQLTypes.getLengthEncodedString(data, offset);
            values.push(valueResult.result);
            offset = valueResult.nextPosition;
        }
        return new ResultsetRow(values);
    };

    Protocol.prototype.parseStatisticsResultPacket = function(packet) {
        var data = packet.data;
        var dataLength = packet.dataLength;
        var result = this.mySQLTypes.getFixedLengthString(data, 0, dataLength);
        return result;
    };

    // Export

    MySQL.Protocol = Protocol;

})(MySQL.BinaryUtils,
   MySQL.Types,
   MySQL.Hasher,
   MySQL.QueryResult,
   MySQL.OkResult,
   MySQL.ErrResult,
   MySQL.EofResult,
   MySQL.InitialHandshakeRequest,
   MySQL.ColumnDefinition,
   MySQL.ResultsetRow);
