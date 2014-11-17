(function(BinaryUtils) {
    "use strict";

    // Constructor

    var Types = function() {
        this.binaryUtils = new MySQL.BinaryUtils();
    };

    // Public methods

    Types.prototype.createFixedLengthInteger = function(value, length) {
        var buffer = new ArrayBuffer(4);
        var view = new DataView(buffer);
        view.setUint32(0, value, true);
        var array = new Uint8Array(buffer);
        var subarray = array.subarray(0, length);
        return subarray;
    };

    Types.prototype.createLengthEncodedString = function(value) {
        var buffer = this.binaryUtils.stringToArrayBuffer(value);
        var view = new Uint8Array(buffer);
        var length = view.length;
        var header = this.createLengthEncodedInteger(length);
        var result = new Uint8Array(header.length + view.length);
        result.set(header, 0);
        result.set(view, header.length);
        return result;
    };

    Types.prototype.createNullEndValue = function(buffer) {
        var view = new Uint8Array(buffer);
        var result = new Uint8Array(view.length + 1);
        result.set(view, 0);
        return result;
    };

    Types.prototype.createLengthEncodedInteger = function(value) {
        var result = null;
        var i = 0;
        if (value === null) {
            result = new Uint8Array(1);
            result[0] = 0xFB;
            return result;
        }
        if (0 <= value && value <= 0xFA) {
            result = new Uint8Array(1);
            result[0] = value;
            return result;
        }
        var buffer = new ArrayBuffer(4);
        var view = new DataView(buffer);
        view.setUint32(0, value, false); // 64bit not supported
        var array = new Uint8Array(buffer);
        var length = 4;
        for (i = 0; i < array.length; i++) {
            if (array[i] !== 0) {
                length -= i;
                break;
            }
        }
        if (value >= 0xFB && length == 2) {
            result = new Uint8Array(3);
            result[0] = 0xFC;
            for (i = 0; i < length; i++) {
                result[i + 1] = array[array.length - 1 - i];
            }
            return result;
        } else if (length == 3) {
            result = new Uint8Array(4);
            result[0] = 0xFD;
            for (i = 0; i < length; i++) {
                result[i + 1] = array[array.length - 1 - i];
            }
            return result;
        } else {
            result = new Uint8Array(9);
            result[0] = 0xFE;
            for (i = 0; i < length; i++) {
                result[i + 1] = array[array.length - 1 - i];
            }
            return result;
        }
    };

    Types.prototype.createNullEndString = function(value) {
        var buffer = this.binaryUtils.stringToArrayBuffer(value);
        return this.createNullEndValue(buffer);
    };

    Types.prototype.getNullEndString = function(buffer, offset) {
        var view = new Uint8Array(buffer);
        for (var pos = offset; pos < view.length; pos++) {
            if (view[pos] === 0) {
                break;
            }
        }
        var targetBuffer = new Uint8Array(view.subarray(offset, pos));
        var result = this.binaryUtils.arrayBufferToString(targetBuffer.buffer);
        return {result: result, nextPosition: pos + 1};
    };

    Types.prototype.getFixedLengthString = function(buffer, offset, length) {
        var array = new Uint8Array(buffer);
        var targetBuffer = new Uint8Array(array.subarray(offset, offset + length));
        var result = this.binaryUtils.arrayBufferToString(targetBuffer.buffer);
        return result;
    };

    Types.prototype.getLengthEncodedString = function(buffer, offset) {
        var lengthResult = this.getLengthEncodedInteger(buffer, offset);
        if (lengthResult.result === null) {
            return {result: null, nextPosition: lengthResult.nextPosition};
        } else {
            var result = this.getFixedLengthString(
                buffer, lengthResult.nextPosition, lengthResult.result);
            return {result: result,
                    nextPosition: lengthResult.nextPosition + lengthResult.result};
        }
    };

    Types.prototype.getFixedLengthInteger = function(buffer, offset, length) {
        var source = new Uint8Array(buffer);
        var subarray = source.subarray(offset, offset + length);
        var copied = new Uint8Array(4);
        copied.set(subarray, 0);
        var view = new DataView(copied.buffer, 0, 4);
        var result = view.getUint32(0, true);
        return result;
    };

    Types.prototype.getLengthEncodedInteger = function(buffer, offset) {
        var array = new Uint8Array(buffer);
        var first = array[offset];
        if (first == 0xFB) {
            return {result: null, nextPosition: offset + 1};
        } else if (first <= 0xFA) {
            return {result: first, nextPosition: offset + 1};
        }
        var length = 0;
        if (first == 0xFC) {
            length = 2;
        } else if (first == 0xFD) {
            length = 3;
        } else {
            length = 8;
        }
        var subarray = array.subarray(offset + 1, offset + 1 + length);
        var resultBuffer = new ArrayBuffer(8);
        var resultArray = new Uint8Array(resultBuffer);
        for (var i = 0; i < subarray.length; i++) {
            resultArray[i] = subarray[i];
        }
        var resultView = new DataView(resultBuffer);
        var result = resultView.getInt32(0, true); // Currently 64bit not supported
        return {result: result, nextPosition: offset + 1 + length};
    };

    // Export

    MySQL.Types = Types;

})(MySQL.BinaryUtils);
