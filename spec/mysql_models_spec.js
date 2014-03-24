describe("MySQL.ColumnDefinition", function() {

    var createTarget = function(flags) {
        var target = new MySQL.ColumnDefinition(
            "catalog1",
            "schema1",
            "table1",
            "orgTable1",
            "name1",
            "orgName1",
            0,
            0,
            0,
            0,
            flags,
            0
        );
        return target;
    };

    it("can check NOT NULL constraint", function() {
        var target = createTarget(MySQL.FieldFlags.NOT_NULL);
        expect(true).toEqual(target.isNotNull());
        target.flags = 0;
        expect(false).toEqual(target.isNotNull());
    });

    it("can check PRIMARY KEY attribute", function() {
        var target = createTarget(MySQL.FieldFlags.PRIMARY_KEY);
        expect(true).toEqual(target.isPrimaryKey());
        target.flags = 0;
        expect(false).toEqual(target.isPrimaryKey());
    });

    it("can check UNIQUE constraint", function() {
        var target = createTarget(MySQL.FieldFlags.UNIQUE);
        expect(true).toEqual(target.isUnique());
        target.flags = 0;
        expect(false).toEqual(target.isUnique());
    });

    it("can check INDEX constraint", function() {
        var target = createTarget(MySQL.FieldFlags.INDEX);
        expect(true).toEqual(target.isIndex());
        target.flags = 0;
        expect(false).toEqual(target.isIndex());
    });

    it("can check BLOB attribute", function() {
        var target = createTarget(MySQL.FieldFlags.BLOB);
        expect(true).toEqual(target.isBlob());
        target.flags = 0;
        expect(false).toEqual(target.isBlob());
    });

    it("can check UNSIGNED constraint", function() {
        var target = createTarget(MySQL.FieldFlags.UNSIGNED);
        expect(true).toEqual(target.isUnsigned());
        target.flags = 0;
        expect(false).toEqual(target.isUnsigned());
    });

    it("can check ZEROFILL constraint", function() {
        var target = createTarget(MySQL.FieldFlags.ZEROFILL);
        expect(true).toEqual(target.isZeroFill());
        target.flags = 0;
        expect(false).toEqual(target.isZeroFill());
    });

    it("can check BINARY constraint", function() {
        var target = createTarget(MySQL.FieldFlags.BINARY);
        expect(true).toEqual(target.isBinary());
        target.flags = 0;
        expect(false).toEqual(target.isBinary());
    });

    it("can check AUTO INCREMENT constraint", function() {
        var target = createTarget(MySQL.FieldFlags.AUTO_INCREMENT);
        expect(true).toEqual(target.isAutoIncrement());
        target.flags = 0;
        expect(false).toEqual(target.isAutoIncrement());
    });

    it("can check ENUM constraint", function() {
        var target = createTarget(MySQL.FieldFlags.ENUM);
        expect(true).toEqual(target.isEnum());
        target.flags = 0;
        expect(false).toEqual(target.isEnum());
    });

    it("can check SET constraint", function() {
        var target = createTarget(MySQL.FieldFlags.SET);
        expect(true).toEqual(target.isSet());
        target.flags = 0;
        expect(false).toEqual(target.isSet());
    });

    it("can check NO DEFAULT VALUE constraint", function() {
        var target = createTarget(MySQL.FieldFlags.NO_DEFAULT_VALUE);
        expect(true).toEqual(target.isNoDefaultValue());
        target.flags = 0;
        expect(false).toEqual(target.isNoDefaultValue());
    });

});
