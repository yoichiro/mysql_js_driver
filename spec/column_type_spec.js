describe("MySQL.columnType", function() {

    var target;

    beforeEach(function() {
        target = MySQL.columnType;
    });

    it("can retrieve column type name from code", function() {
        expect("VARCHAR").toEqual(target.getColumnTypeName(0xf));
    });

});
