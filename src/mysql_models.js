(function(MySQLTypes) {
    "use strict";

    // Constructor

    var Packet = function(newSequenceNumber, buffer) {
        this.mySQLTypes = new MySQLTypes();
        this.sequenceNumber = newSequenceNumber;
        this.data = buffer;
        this.dataLength = buffer.byteLength;
    };

    // Private methods

    Packet.prototype._outputUint8Array = function(array) {
        var lines = "";
        var out = "";
        var ascii = "";
        for (var i = 0; i < array.length; i++) {
            // out += String.fromCharCode(array[i]);
            var value = (Number(array[i])).toString(16).toUpperCase();
            if (value.length === 1) {
                value = "0" + value;
            }
            out += value;
            if (i % 2 !== 0) {
                out += " ";
            }
            if (0x20 <= array[i] && array[i] <= 0x7e) {
                ascii += String.fromCharCode(array[i]);
            } else {
                ascii += ".";
            }
            if (((i + 1) % 16) === 0) {
                lines += out + " " + ascii + "\n";
                out = "";
                ascii = "";
            }
        }
        if (out) {
            lines += out + " " + ascii + "\n";
        }
        console.log(lines);
    };

    // Public methods

    Packet.prototype.getArrayBuffer = function() {
        var result = new ArrayBuffer(4 + this.dataLength);
        var dataLengthArray = this.mySQLTypes.createFixedLengthInteger(this.dataLength, 3);
        var view = new Uint8Array(result);
        view.set(dataLengthArray, 0);
        view[3] = this.sequenceNumber;
        view.set(new Uint8Array(this.data), 4);
        return result;
    };

    Packet.prototype.outputForDebug = function() {
        console.log("sequenceNumber:", this.sequenceNumber);
        console.log("dataLength:", this.dataLength);
        this._outputUint8Array(new Uint8Array(this.data));
    };

    // Export

    MySQL.Packet = Packet;

})(MySQL.Types);

(function() {
    "use strict";

    // Constructor

    var InitialHandshakeRequest = function(newProtocolVersion,
                                           newServerVersion,
                                           newConnectionId,
                                           newAuthPluginDataPart1,
                                           newCapabilityFlag1,
                                           newCharacterSet,
                                           newStatusFlags,
                                           newCapabilityFlag2,
                                           newAuthPluginDataLen,
                                           newAuthPluginDataPart2,
                                           newAuthPluginName) {
        this.protocolVersion = newProtocolVersion;
        this.serverVersion = newServerVersion;
        this.connectionId = newConnectionId;
        this.authPluginDataPart1 = newAuthPluginDataPart1;
        this.capabilityFlag1 = newCapabilityFlag1;
        this.characterSet = newCharacterSet;
        this.statusFlags = newStatusFlags;
        this.capabilityFlag2 = newCapabilityFlag2;
        this.authPluginDataLen = newAuthPluginDataLen;
        this.authPluginDataPart2 = newAuthPluginDataPart2;
        this.authPluginName = newAuthPluginName;
    };

    MySQL.InitialHandshakeRequest = InitialHandshakeRequest;

})();

(function() {
    "use strict";

    // Constructor

    var StatusFlags = {
        SERVER_STATUS_IN_TRANS: 0x0001,
        SERVER_STATUS_AUTOCOMMIT: 0x0002,
        SERVER_MORE_RESULTS_EXISTS: 0x0008,
        SERVER_STATUS_NO_GOOD_INDEX_USED: 0x0010,
        SERVER_STATUS_NO_INDEX_USED: 0x0020,
        SERVER_STATUS_CURSOR_EXISTS: 0x0040,
        SERVER_STATUS_LAST_ROW_SENT: 0x0080,
        SERVER_STATUS_DB_DROPPED: 0x0100,
        SERVER_STATUS_NO_BACKSLASH_ESCAPES: 0x0200,
        SERVER_STATUS_METADATA_CHANGED: 0x0400,
        SERVER_QUERY_WAS_SLOW: 0x0800,
        SERVER_PS_OUT_PARAMS: 0x1000
    };

    // Export

    MySQL.StatusFlags = StatusFlags;

})();

(function(StatusFlags) {
    "use strict";

    // Constructor

    var OkResult = function(newAffectedRows,
                            newLastInsertId,
                            newStatusFlags,
                            newWarnings,
                            newInfo) {
        this.affectedRows = newAffectedRows;
        this.lastInsertId = newLastInsertId;
        this.statusFlags = newStatusFlags;
        this.warnings = newWarnings;
        this.info = newInfo;
    };

    // Public methods

    OkResult.prototype.isSuccess = function() {
        return true;
    };

    OkResult.prototype.isAuthSwitchRequest = function() {
        return false;
    };

    OkResult.prototype.hasResultset = function() {
        return false;
    };

    OkResult.prototype.isStatusInTrans = function() {
        return (this.statusFlags & StatusFlags.SERVER_STATUS_IN_TRANS) !== 0;
    };

    OkResult.prototype.isAutoCommit = function() {
        return (this.statusFlags & StatusFlags.SERVER_STATUS_AUTOCOMMIT) !== 0;
    };

    OkResult.prototype.isMoreResultsExists = function() {
        return (this.statusFlags & StatusFlags.SERVER_MORE_RESULTS_EXISTS) !== 0;
    };

    OkResult.prototype.isNoGoodIndexUsed = function() {
        return (this.statusFlags & StatusFlags.SERVER_STATUS_NO_GOOD_INDEX_USED) !== 0;
    };

    OkResult.prototype.isNoIndexUsed = function() {
        return (this.statusFlags & StatusFlags.SERVER_STATUS_NO_INDEX_USED) !== 0;
    };

    OkResult.prototype.isCursorExists = function() {
        return (this.statusFlags & StatusFlags.SERVER_STATUS_CURSOR_EXISTS) !== 0;
    };

    OkResult.prototype.isLastRowSent = function() {
        return (this.statusFlags & StatusFlags.SERVER_STATUS_LAST_ROW_SENT) !== 0;
    };

    OkResult.prototype.isDbDropped = function() {
        return (this.statusFlags & StatusFlags.SERVER_STATUS_DB_DROPPED) !== 0;
    };

    OkResult.prototype.isNoBackslashEscapes = function() {
        return (this.statusFlags & StatusFlags.SERVER_STATUS_NO_BACKSLASH_ESCAPES) !== 0;
    };

    OkResult.prototype.isMetadataChanged = function() {
        return (this.statusFlags & StatusFlags.SERVER_STATUS_METADATA_CHANGED) !== 0;
    };

    OkResult.prototype.isQueryWasSlow = function() {
        return (this.statusFlags & StatusFlags.SERVER_QUERY_WAS_SLOW) !== 0;
    };

    OkResult.prototype.isPsOutParams = function() {
        return (this.statusFlags & StatusFlags.SERVER_PS_OUT_PARAMS) !== 0;
    };

    // Export

    MySQL.OkResult = OkResult;

})(MySQL.StatusFlags);

(function() {
    "use strict";

    // Constructor

    var ErrResult = function(newErrorCode,
                             newSqlStateMarker,
                             newSqlState,
                             newErrorMessage) {
        this.errorCode = newErrorCode;
        this.sqlStateMarker = newSqlStateMarker;
        this.sqlState = newSqlState;
        this.errorMessage = newErrorMessage;
    };

    // Public methods

    ErrResult.prototype.isSuccess = function() {
        return false;
    };

    ErrResult.prototype.isAuthSwitchRequest = function() {
        return false;
    };

    // Export
    MySQL.ErrResult = ErrResult;

})();

(function() {
    "use strict";

    // Constructor

    var AuthSwitchRequest = function(newAuthMethodName,
                                     newAuthMethodData) {
        this.authMethodName = newAuthMethodName;
        this.authMethodData = newAuthMethodData;
    };

    // Public methods

    AuthSwitchRequest.prototype.isAuthSwitchRequest = function() {
        return true;
    };

    // Export
    MySQL.AuthSwitchRequest = AuthSwitchRequest;

})();

(function() {
    "use strict";

    // Constructor

    var AuthSwitchResponse = function(newData) {
        this.data = newData;
    };

    // Export
    MySQL.AuthSwitchResponse = AuthSwitchResponse;

})();

(function() {
    "use strict";

    // Constructor

    var QueryResult = function(newColumnCount) {
        this.columnCount = newColumnCount;
    };

    // Public methods

    QueryResult.prototype.isSuccess = function() {
        return true;
    };

    QueryResult.prototype.hasResultset = function() {
        return true;
    };

    // Export

    MySQL.QueryResult = QueryResult;

})();

(function() {
    "use strict";

    // Constructor

    var FieldFlags = {
        NOT_NULL: 0x0001,
        PRIMARY_KEY: 0x0002,
        UNIQUE: 0x0004,
        INDEX: 0x0008,
        BLOB: 0x0010,
        UNSIGNED: 0x0020,
        ZEROFILL: 0x0040,
        BINARY: 0x0080,
        AUTO_INCREMENT: 0x0200,
        ENUM: 0x0100,
        SET: 0x0800,
        NO_DEFAULT_VALUE: 0x1000
    };

    // Export

    MySQL.FieldFlags = FieldFlags;

})();

(function(FieldFlags) {
    "use strict";

    // Constructor

    var ColumnDefinition = function(newCatalog,
                                    newSchema,
                                    newTable,
                                    newOrgtable,
                                    newName,
                                    newOrgname,
                                    newNextlength,
                                    newCharacterset,
                                    newColumnlength,
                                    newColumntype,
                                    newFlags,
                                    newDecimals) {
        this.catalog = newCatalog;
        this.schema = newSchema;
        this.table = newTable;
        this.orgTable = newOrgtable;
        this.name = newName;
        this.orgName = newOrgname;
        this.nextLength = newNextlength;
        this.characterSet = newCharacterset;
        this.columnLength = newColumnlength;
        this.columnType = newColumntype;
        this.flags = newFlags;
        this.decimals = newDecimals;
    };

    // Public methods

    ColumnDefinition.prototype.isNotNull = function() {
        return (this.flags & FieldFlags.NOT_NULL) !== 0;
    };

    ColumnDefinition.prototype.isPrimaryKey = function() {
        return (this.flags & FieldFlags.PRIMARY_KEY) !== 0;
    };

    ColumnDefinition.prototype.isUnique = function() {
        return (this.flags & FieldFlags.UNIQUE) !== 0;
    };

    ColumnDefinition.prototype.isIndex = function() {
        return (this.flags & FieldFlags.INDEX) !== 0;
    };

    ColumnDefinition.prototype.isBlob = function() {
        return (this.flags & FieldFlags.BLOB) !== 0;
    };

    ColumnDefinition.prototype.isUnsigned = function() {
        return (this.flags & FieldFlags.UNSIGNED) !== 0;
    };

    ColumnDefinition.prototype.isZeroFill = function() {
        return (this.flags & FieldFlags.ZEROFILL) !== 0;
    };

    ColumnDefinition.prototype.isBinary = function() {
        return (this.flags & FieldFlags.BINARY) !== 0;
    };

    ColumnDefinition.prototype.isAutoIncrement = function() {
        return (this.flags & FieldFlags.AUTO_INCREMENT) !== 0;
    };

    ColumnDefinition.prototype.isEnum = function() {
        return (this.flags & FieldFlags.ENUM) !== 0;
    };

    ColumnDefinition.prototype.isSet = function() {
        return (this.flags & FieldFlags.SET) !== 0;
    };

    ColumnDefinition.prototype.isNoDefaultValue = function() {
        return (this.flags & FieldFlags.NO_DEFAULT_VALUE) !== 0;
    };

    // Export

    MySQL.ColumnDefinition = ColumnDefinition;

})(MySQL.FieldFlags);

(function() {
    "use strict";

    // Constructor

    var ResultsetRow = function(newValues) {
        this.values = newValues;
    };

    // Export

    MySQL.ResultsetRow = ResultsetRow;

})();

(function(StatusFlags) {
    "use strict";

    // Constructor

    var EofResult = function(newWarningCount, newStatusFlags) {
        this.warningCount = newWarningCount;
        this.statusFlags = newStatusFlags;
    };

    // Public methods

    EofResult.prototype.isStatusInTrans = function() {
        return (this.statusFlags & StatusFlags.SERVER_STATUS_IN_TRANS) !== 0;
    };

    EofResult.prototype.isAutoCommit = function() {
        return (this.statusFlags & StatusFlags.SERVER_STATUS_AUTOCOMMIT) !== 0;
    };

    EofResult.prototype.isMoreResultsExists = function() {
        return (this.statusFlags & StatusFlags.SERVER_MORE_RESULTS_EXISTS) !== 0;
    };

    EofResult.prototype.isNoGoodIndexUsed = function() {
        return (this.statusFlags & StatusFlags.SERVER_STATUS_NO_GOOD_INDEX_USED) !== 0;
    };

    EofResult.prototype.isNoIndexUsed = function() {
        return (this.statusFlags & StatusFlags.SERVER_STATUS_NO_INDEX_USED) !== 0;
    };

    EofResult.prototype.isCursorExists = function() {
        return (this.statusFlags & StatusFlags.SERVER_STATUS_CURSOR_EXISTS) !== 0;
    };

    EofResult.prototype.isLastRowSent = function() {
        return (this.statusFlags & StatusFlags.SERVER_STATUS_LAST_ROW_SENT) !== 0;
    };

    EofResult.prototype.isDbDropped = function() {
        return (this.statusFlags & StatusFlags.SERVER_STATUS_DB_DROPPED) !== 0;
    };

    EofResult.prototype.isNoBackslashEscapes = function() {
        return (this.statusFlags & StatusFlags.SERVER_STATUS_NO_BACKSLASH_ESCAPES) !== 0;
    };

    EofResult.prototype.isMetadataChanged = function() {
        return (this.statusFlags & StatusFlags.SERVER_STATUS_METADATA_CHANGED) !== 0;
    };

    EofResult.prototype.isQueryWasSlow = function() {
        return (this.statusFlags & StatusFlags.SERVER_QUERY_WAS_SLOW) !== 0;
    };

    EofResult.prototype.isPsOutParams = function() {
        return (this.statusFlags & StatusFlags.SERVER_PS_OUT_PARAMS) !== 0;
    };

    // Export

    MySQL.EofResult = EofResult;

})(MySQL.StatusFlags);

(function() {
    "use strict";

    // Constructor

    var ColumnTypes = {
        DECIMAL: 0x00,
        TINY: 0x01,
        SHORT: 0x02,
        LONG: 0x03,
        FLOAT: 0x04,
        DOUBLE: 0x05,
        NULL: 0x06,
        TIMESTAMP: 0x07,
        LONGLONG: 0x08,
        INT24: 0x09,
        DATE: 0x0a,
        TIME: 0x0b,
        DATETIME: 0x0c,
        YEAR: 0x0d,
        VARCHAR: 0x0f,
        BIT: 0x10,
        NEWDECIMAL: 0xf6,
        ENUM: 0xf7,
        SET: 0xf8,
        TINY_BLOB: 0xf9,
        MEDIUM_BLOB: 0xfa,
        LONG_BLOB: 0xfb,
        BLOB: 0xfc,
        VAR_STRING: 0xfd,
        STRING: 0xfe,
        GEOMETRY: 0xff
    };

    // Export

    MySQL.ColumnTypes = ColumnTypes;

})();
