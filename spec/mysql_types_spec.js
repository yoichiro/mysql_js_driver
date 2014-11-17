describe("MySQL.Types", function() {

    var target;

    beforeEach(function() {
        target = new MySQL.Types();
    });

    it("can create fixed length integer", function() {
        var actual = target.createFixedLengthInteger(0x1234, 3);
        expect(3).toEqual(actual.length);
        expect(0x34).toEqual(actual[0]);
        expect(0x12).toEqual(actual[1]);
        expect(0).toEqual(actual[2]);
    });

    it("can create length encoded string", function() {
        var actual = target.createLengthEncodedString("ABC");
        expect(4).toEqual(actual.length);
        expect(3).toEqual(actual[0]);
        expect(0x41).toEqual(actual[1]);
        expect(0x42).toEqual(actual[2]);
        expect(0x43).toEqual(actual[3]);
    });

    it("can create null end value", function() {
        var buffer = new ArrayBuffer(3);
        var array = new Uint8Array(buffer);
        array[0] = 0x41;
        array[1] = 0x42;
        array[2] = 0x43;
        var actual = target.createNullEndValue(buffer);
        expect(4).toEqual(actual.length);
        expect(0x41).toEqual(actual[0]);
        expect(0x42).toEqual(actual[1]);
        expect(0x43).toEqual(actual[2]);
        expect(0).toEqual(actual[3]);
    });

    it("can create length encoded integer (null)", function() {
        var actual = target.createLengthEncodedInteger(null);
        expect(1).toEqual(actual.length);
        expect(0xFB).toEqual(actual[0]);
    });

    it("can create length encoded integer (1 byte)", function() {
        var actual = target.createLengthEncodedInteger(0xF9);
        expect(1).toEqual(actual.length);
        expect(0xF9).toEqual(actual[0]);
    });

    it("can create length encoded integer (2 bytes)", function() {
        var actual = target.createLengthEncodedInteger(0x1234);
        expect(3).toEqual(actual.length);
        expect(0xFC).toEqual(actual[0]);
        expect(0x34).toEqual(actual[1]);
        expect(0x12).toEqual(actual[2]);
    });

    it("can create length encoded integer (3 bytes)", function() {
        var actual = target.createLengthEncodedInteger(0x123456);
        expect(4).toEqual(actual.length);
        expect(0xFD).toEqual(actual[0]);
        expect(0x56).toEqual(actual[1]);
        expect(0x34).toEqual(actual[2]);
        expect(0x12).toEqual(actual[3]);
    });

    it("can create length encoded integer (8 bytes)", function() {
        var actual = target.createLengthEncodedInteger(0x12345678);
        expect(9).toEqual(actual.length);
        expect(0xFE).toEqual(actual[0]);
        expect(0x78).toEqual(actual[1]);
        expect(0x56).toEqual(actual[2]);
        expect(0x34).toEqual(actual[3]);
        expect(0x12).toEqual(actual[4]);
        expect(0).toEqual(actual[5]);
        expect(0).toEqual(actual[6]);
        expect(0).toEqual(actual[7]);
        expect(0).toEqual(actual[8]);
    });

    it("can create null end string", function() {
        var actual = target.createNullEndString("ABC");
        expect(4).toEqual(actual.length);
        expect(0x41).toEqual(actual[0]);
        expect(0x42).toEqual(actual[1]);
        expect(0x43).toEqual(actual[2]);
        expect(0).toEqual(actual[3]);
    });

    it("can retrieve null end string", function() {
        var buffer = new ArrayBuffer(6);
        var array = new Uint8Array(buffer);
        array[0] = 0x44;
        array[1] = 0x41;
        array[2] = 0x42;
        array[3] = 0x43;
        array[4] = 0;
        array[5] = 0x45;
        var actual = target.getNullEndString(buffer, 1);
        expect("ABC").toEqual(actual.result);
        expect(5).toEqual(actual.nextPosition);
    });

    it("can retrieve fixed length string", function() {
        var buffer = new ArrayBuffer(6);
        var array = new Uint8Array(buffer);
        array[0] = 0x44;
        array[1] = 0x41;
        array[2] = 0x42;
        array[3] = 0x43;
        array[4] = 0;
        array[5] = 0x45;
        var actual = target.getFixedLengthString(buffer, 1, 3);
        expect("ABC").toEqual(actual);
    });

    it("can retrieve length encoded string", function() {
        var buffer = new ArrayBuffer(6);
        var array = new Uint8Array(buffer);
        array[0] = 0x44;
        array[1] = 0x3;
        array[2] = 0x41;
        array[3] = 0x42;
        array[4] = 0x43;
        array[5] = 0x45;
        var actual = target.getLengthEncodedString(buffer, 1);
        expect("ABC").toEqual(actual.result);
        expect(5).toEqual(actual.nextPosition);
    });

    it("can retrieve fixed length integer", function() {
        var buffer = new ArrayBuffer(6);
        var array = new Uint8Array(buffer);
        array[0] = 0x44;
        array[1] = 0x56;
        array[2] = 0x34;
        array[3] = 0x12;
        array[4] = 0;
        array[5] = 0x45;
        var actual = target.getFixedLengthInteger(buffer, 1, 4);
        expect(0x123456).toEqual(actual);
    });

    it("can retrieve length encoded integer (null)", function() {
        var buffer = new ArrayBuffer(6);
        var array = new Uint8Array(buffer);
        array[0] = 0x44;
        array[1] = 0xFB;
        array[2] = 0x34;
        array[3] = 0x12;
        array[4] = 0;
        array[5] = 0x45;
        var actual = target.getLengthEncodedInteger(buffer, 1);
        expect(null).toEqual(actual.result);
        expect(2).toEqual(actual.nextPosition);
    });

    it("can retrieve length encoded integer (1 byte)", function() {
        var buffer = new ArrayBuffer(6);
        var array = new Uint8Array(buffer);
        array[0] = 0x44;
        array[1] = 0xF9;
        array[2] = 0x34;
        array[3] = 0x12;
        array[4] = 0;
        array[5] = 0x45;
        var actual = target.getLengthEncodedInteger(buffer, 1);
        expect(0xF9).toEqual(actual.result);
        expect(2).toEqual(actual.nextPosition);
    });

    it("can retrieve length encoded integer (2 bytes)", function() {
        var buffer = new ArrayBuffer(6);
        var array = new Uint8Array(buffer);
        array[0] = 0x44;
        array[1] = 0xFC;
        array[2] = 0x34;
        array[3] = 0x12;
        array[4] = 0;
        array[5] = 0x45;
        var actual = target.getLengthEncodedInteger(buffer, 1);
        expect(0x1234).toEqual(actual.result);
        expect(4).toEqual(actual.nextPosition);
    });

    it("can retrieve length encoded integer (3 bytes)", function() {
        var buffer = new ArrayBuffer(6);
        var array = new Uint8Array(buffer);
        array[0] = 0x44;
        array[1] = 0xFD;
        array[2] = 0x56;
        array[3] = 0x34;
        array[4] = 0x12;
        array[5] = 0x45;
        var actual = target.getLengthEncodedInteger(buffer, 1);
        expect(0x123456).toEqual(actual.result);
        expect(5).toEqual(actual.nextPosition);
    });

    it("can retrieve length encoded integer (8 bytes)", function() {
        var buffer = new ArrayBuffer(11);
        var array = new Uint8Array(buffer);
        array[0] = 0x44;
        array[1] = 0xFE;
        array[2] = 0x78;
        array[3] = 0x56;
        array[4] = 0x34;
        array[5] = 0x12;
        array[6] = 0;
        array[7] = 0;
        array[8] = 0;
        array[9] = 0;
        array[10] = 0x45;
        var actual = target.getLengthEncodedInteger(buffer, 1);
        expect(0x12345678).toEqual(actual.result);
        expect(10).toEqual(actual.nextPosition);
    });

});
