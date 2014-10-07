(function() {
    "use strict";

    // Constructor

    var ColumnType = function() {
        this.typeMap = {
            "0": "DECIMAL",
            "1": "TINY",
            "2": "SHORT",
            "3": "LONG",
            "4": "FLOAT",
            "5": "DOUBLE",
            "6": "NULL",
            "7": "TIMESTAMP",
            "8": "LONGLONG",
            "9": "INT24",
            "10": "DATE",
            "11": "TIME",
            "12": "DATETIME",
            "13": "YEAR",
            "14": "NEWDATE",
            "15": "VARCHAR",
            "16": "BIT",
            "17": "TIMESTAMP2",
            "18": "DATETIME2",
            "19": "TIME2",
            "246": "NEWDECIMAL",
            "247": "ENUM",
            "248": "SET",
            "249": "TINY_BLOB",
            "250": "MEDIUM_BLOB",
            "251": "LONG_BLOB",
            "252": "BLOB",
            "253": "VAR_STRING",
            "254": "STRING",
            "255": "GEOMETRY"
        };
    };

    // Public methods

    ColumnType.prototype.getColumnTypeName = function(code) {
        return this.typeMap[String(code)];
    };

    // Export

    MySQL.columnType = new ColumnType();

})();
