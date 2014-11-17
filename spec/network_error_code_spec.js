describe("MySQL.NetworkErrorCode", function() {

    var target;

    beforeEach(function() {
        target = new MySQL.NetworkErrorCode;
    });

    it("can retrieve error message from error code", function() {
        expect("CONNECTION_REFUSED").toEqual(target.getErrorMessage("-102"));
    });

});
