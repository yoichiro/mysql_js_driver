describe("MySQL.networkErrorCode", function() {

    var target;

    beforeEach(function() {
        target = MySQL.networkErrorCode;
    });

    it("can retrieve error message from error code", function() {
        expect("CONNECTION_REFUSED").toEqual(target.getErrorMessage("-102"));
    });

});
