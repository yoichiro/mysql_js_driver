(function() {
    "use strict";

    var MySQL = {};

    if ("undefined" == typeof module) {
        window.MySQL = MySQL;
    } else {
        module.exports = MySQL;
    }
})();
