(function(binaryUtils,
          mySQLTypes,
          hasher,
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
    };

    // Private methods

    var _createOkResult = function(data, offset, dataLength) {
        var affectedRowsResult = mySQLTypes.getLengthEncodedInteger(data, offset);
        var affectedRows = affectedRowsResult.result;
        var lastInsertIdResult =
                mySQLTypes.getLengthEncodedInteger(
                    data, affectedRowsResult.nextPosition);
        var lastInsertId = lastInsertIdResult.result;
        var statusFlags =
                mySQLTypes.getFixedLengthInteger(
                    data, lastInsertIdResult.nextPosition, 2);
        var warnings =
                mySQLTypes.getFixedLengthInteger(
                    data, lastInsertIdResult.nextPosition + 2, 2);
        var info = "";
        if (dataLength > lastInsertIdResult.nextPosition + 4) {
            var length = dataLength - lastInsertIdResult.nextPosition + 4;
            info = mySQLTypes.getFixedLengthString(
                data, lastInsertIdResult.nextPosition + 4, length);
        }
        return new OkResult(
            affectedRows, lastInsertId, statusFlags, warnings, info);
    };

    var _createErrResult = function(data, offset, dataLength) {
        var errorCode = mySQLTypes.getFixedLengthInteger(data, offset, 2);
        var sqlStateMarker = mySQLTypes.getFixedLengthString(data, offset + 2, 1);
        var sqlState = mySQLTypes.getFixedLengthString(data, offset + 3, 5);
        var errorMessageLength = dataLength - offset - 8;
        var errorMessage =
                mySQLTypes.getFixedLengthString(
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
        var buffer = binaryUtils.stringToArrayBuffer(queryString);
        var view = new Uint8Array(buffer);
        var array = binaryUtils.createUint8Array(1 + view.length);
        array[0] = 0x03;
        array.set(view, 1);
        return array;
    };

    Protocol.prototype.generateInitDBRequest = function(schemaName) {
        var schemaNameBuffer = binaryUtils.stringToArrayBuffer(schemaName);
        var schemaNameArray = new Uint8Array(schemaNameBuffer);
        var resultArray = binaryUtils.createUint8Array(1 + schemaNameArray.length);
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
                mySQLTypes.createFixedLengthInteger(capabilityFlagsValue, 4);
        var maxPacketSize =
                mySQLTypes.createFixedLengthInteger(0xFFFFFF, 4); // About 16MB
        var characterSet =
                mySQLTypes.createLengthEncodedInteger(0x21); // utf8_general_ci
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
                mySQLTypes.createFixedLengthInteger(capabilityFlagsValue, 4);
        var maxPacketSize =
                mySQLTypes.createFixedLengthInteger(0xFFFFFF, 4); // About 16MB
        var characterSet =
                mySQLTypes.createLengthEncodedInteger(0x21); // utf8_general_ci
        var usernameArray = mySQLTypes.createNullEndString(username);
        var passwordHashLength;
        if (passwordHash === null) {
            passwordHashLength = 0;
        } else {
            passwordHashLength =
                mySQLTypes.createLengthEncodedInteger(passwordHash.length);
        }
        var authPluginName =
                mySQLTypes.createNullEndString(initialHandshakeRequest.authPluginName);
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
        var password1Array = hasher.sha1ToUint8Array(passwordString);
        var password2Array = hasher.sha1Uint8ArrayToUint8Array(password1Array);
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
        var hashedSourceArray = hasher.sha1Uint8ArrayToUint8Array(sourceView);
        var result = new Uint8Array(password1Array.length);
        for (var i = 0; i < result.length; i++) {
            result[i] = password1Array[i] ^ hashedSourceArray[i];
        }
        return result;
    };

    Protocol.prototype.generatePingRequest = function() {
        var array = binaryUtils.createUint8Array(1);
        array[0] = 0x0e;
        return array;
    };

    Protocol.prototype.parseQueryResultPacket = function(packet, callback) {
        var data = packet.data;
        var header = mySQLTypes.getFixedLengthInteger(data, 0, 1);
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
            var columnCountResult = mySQLTypes.getLengthEncodedInteger(data, 0);
            var queryResult = new QueryResult(columnCountResult.result);
            callback(queryResult);
        }
    };

    Protocol.prototype.parseOkErrResultPacket = function(packet) {
        var data = packet.data;
        var header = mySQLTypes.getFixedLengthInteger(data, 0, 1);
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
        var header = mySQLTypes.getFixedLengthInteger(data, 0, 1);
        if (header == 0xFE) {
            var warningCount = mySQLTypes.getFixedLengthInteger(data, 1, 2);
            var statusFlags = mySQLTypes.getFixedLengthInteger(data, 3, 2);
            return new EofResult(warningCount, statusFlags);
        } else {
            // TODO: Unknown
            return null;
        }
    };

    Protocol.prototype.parseInitialHandshakePacket = function(packet) {
        var data = packet.data;
        var offset = 0;
        var protocolVersion = mySQLTypes.getFixedLengthInteger(data, offset++, 1);
        var serverVersionResult = mySQLTypes.getNullEndString(data, offset);
        var serverVersion = serverVersionResult.result;
        offset = serverVersionResult.nextPosition;
        var connectionId = mySQLTypes.getFixedLengthInteger(data, offset, 4);
        offset += 4;
        var authPluginDataPart1 = new Uint8Array(data, offset, 8);
        offset += 8 + 1; // Skip 1 byte
        var capabilityFlag1 = mySQLTypes.getFixedLengthInteger(data, offset, 2);
        offset += 2;
        var characterSet = mySQLTypes.getFixedLengthInteger(data, offset++, 1);
        var statusFlags = mySQLTypes.getFixedLengthInteger(data, offset, 2);
        offset += 2;
        var capabilityFlag2 = mySQLTypes.getFixedLengthInteger(data, offset, 2);
        offset += 2;
        var authPluginDataLen = mySQLTypes.getFixedLengthInteger(data, offset++, 1);
        offset += 10; // Skip 10 bytes
        var authPluginDataPart2 = new Uint8Array(data, offset, 12);
        offset += 12 + 1; // Skip 1 byte
        var authPluginNameResult = mySQLTypes.getNullEndString(data, offset);
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
        var catalogResult = mySQLTypes.getLengthEncodedString(data, 0);
        var schemaResult = mySQLTypes.getLengthEncodedString(
            data, catalogResult.nextPosition);
        var tableResult = mySQLTypes.getLengthEncodedString(
            data, schemaResult.nextPosition);
        var orgTableResult = mySQLTypes.getLengthEncodedString(
            data, tableResult.nextPosition);
        var nameResult = mySQLTypes.getLengthEncodedString(
            data, orgTableResult.nextPosition);
        var orgNameResult = mySQLTypes.getLengthEncodedString(
            data, nameResult.nextPosition);
        var nextLengthResult = mySQLTypes.getLengthEncodedInteger(
            data, orgNameResult.nextPosition);
        var offset = nextLengthResult.nextPosition;
        var characterSet = mySQLTypes.getFixedLengthInteger(data, offset, 2);
        offset += 2;
        var columnLength = mySQLTypes.getFixedLengthInteger(data, offset, 4);
        offset += 4;
        var columnType = mySQLTypes.getFixedLengthInteger(data, offset, 1);
        offset += 1;
        var flags = mySQLTypes.getFixedLengthInteger(data, offset, 2);
        offset += 2;
        var decimals = mySQLTypes.getFixedLengthInteger(data, offset, 1);
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
            var valueResult = mySQLTypes.getLengthEncodedString(data, offset);
            values.push(valueResult.result);
            offset = valueResult.nextPosition;
        }
        return new ResultsetRow(values);
    };

    Protocol.prototype.parseStatisticsResultPacket = function(packet) {
        var data = packet.data;
        var dataLength = packet.dataLength;
        var result = mySQLTypes.getFixedLengthString(data, 0, dataLength);
        return result;
    };

    // Export

    MySQL.protocol = new Protocol();

})(MySQL.binaryUtils,
   MySQL.types,
   MySQL.hasher,
   MySQL.QueryResult,
   MySQL.OkResult,
   MySQL.ErrResult,
   MySQL.EofResult,
   MySQL.InitialHandshakeRequest,
   MySQL.ColumnDefinition,
   MySQL.ResultsetRow);
