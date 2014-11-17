(function() {
    "use strict";

    // Constructor

    var Hasher = function() {
    };

    // Public methods

    Hasher.prototype.sha1ToWordArray = function(source) {
        return CryptoJS.SHA1(source);
    };

    Hasher.prototype.sha1ToUint8Array = function(source) {
        var wordArray = this.sha1ToWordArray(source);
        return this.wordArrayToUnit8Array(wordArray);
    };

    Hasher.prototype.sha1Uint8ArrayToUint8Array = function(source) {
        var words = this.uint8ArrayToWords(source);
        var sourceWordArray = CryptoJS.lib.WordArray.create(words, source.length);
        return this.sha1ToUint8Array(sourceWordArray);
    };

    Hasher.prototype.uint8ArrayToWords = function(typedArray) {
        var typedArrayByteLength = typedArray.length;
        var words = [];
        for (var i = 0; i < typedArrayByteLength; i++) {
            words[i >>> 2] |= typedArray[i] << (24 - (i % 4) * 8);
        }
        return words;
    };

    Hasher.prototype.wordArrayToUnit8Array = function(wordArray) {
        var buffer = new ArrayBuffer(wordArray.sigBytes);
        var view = new DataView(buffer, 0, buffer.byteLength);
        for (var i = 0; i < wordArray.words.length; i++) {
            view.setInt32(i * 4, wordArray.words[i], false);
        }
        return new Uint8Array(buffer);
    };

    // Export

    MySQL.Hasher = Hasher;

})();
