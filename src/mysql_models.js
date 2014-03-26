(function(mySQLTypes) {
    "use strict";

    // Constructor

    var Packet = function(newSequenceNumber, buffer) {
        this.sequenceNumber = newSequenceNumber;
        this.data = buffer;
        this.dataLength = buffer.byteLength;
    };

    // Public methods

    Packet.prototype.getArrayBuffer = function() {
        var result = new ArrayBuffer(4 + this.dataLength);
        var dataLengthArray = mySQLTypes.createFixedLengthInteger(this.dataLength, 3);
        var view = new Uint8Array(result);
        view.set(dataLengthArray, 0);
        view[3] = this.sequenceNumber;
        view.set(new Uint8Array(this.data), 4);
        return result;
    };

    // Export

    MySQL.Packet = Packet;

})(MySQL.types);

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

    OkResult.prototype.hasResultset = function() {
        return false;
    };

    // Export

    MySQL.OkResult = OkResult;

})();

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

    // Export
    MySQL.ErrResult = ErrResult;

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

(function() {
    "use strict";

    // Constructor

    var EofResult = function(newWarningCount, newStatusFlags) {
        this.warningCount = newWarningCount;
        this.statusFlags = newStatusFlags;
    };

    // Export

    MySQL.EofResult = EofResult;

})();

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
