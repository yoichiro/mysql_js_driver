describe("MySQL.BinaryUtils", function() {

    var target;

    beforeEach(function() {
        target = new MySQL.BinaryUtils();
    });

    it("can create Uint8Array", function() {
        var actual = target.createUint8Array(5);
        expect(5).toEqual(actual.length);
        expect(1).toEqual(actual.BYTES_PER_ELEMENT);
    });

    it("can convert string to ArrayBuffer", function() {
        var actual = target.stringToArrayBuffer("ABC");
        expect(3).toEqual(actual.byteLength);
        var uint8Array = new Uint8Array(actual);
        expect(0x41).toEqual(uint8Array[0]);
        expect(0x42).toEqual(uint8Array[1]);
        expect(0x43).toEqual(uint8Array[2]);
    });

    it("can convert ArrayBuffer to string", function() {
        var buffer = new ArrayBuffer(3);
        var uint8Array = new Uint8Array(buffer);
        uint8Array[0] = 0x41;
        uint8Array[1] = 0x42;
        uint8Array[2] = 0x43;
        expect("ABC").toEqual(target.arrayBufferToString(buffer));
    });

});
