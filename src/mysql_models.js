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

    // Export

    MySQL.ColumnDefinition = ColumnDefinition;

})();

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
