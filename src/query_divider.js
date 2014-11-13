(function() {
    "use strict";

    // Constructor

    var ParseError = function(message) {
        this.message = message;
    };

    ParseError.prototype = new Error();

    ParseError.prototype.name = "ParseError";

    // Export

    MySQL.ParseError = ParseError;

})();

(function(ParseError) {

    var DEBUG = false;
    var DELIMITER = "delimiter ";

    // Constructor

    var QueryDivider = function() {
        this.result = [];
        this.stateMap = {
            query: this.query.bind(this),
            lineStart: this.lineStart.bind(this),
            escapedQuery: this.escapedQuery.bind(this),
            sharpComment: this.sharpComment.bind(this),
            maybeDashComment: this.maybeDashComment.bind(this),
            dashComment: this.dashComment.bind(this),
            maybeInlineCommentStart: this.maybeInlineCommentStart.bind(this),
            inlineComment: this.inlineComment.bind(this),
            maybeInlineCommentEnd: this.maybeInlineCommentEnd.bind(this),
            maybeDelimiterDef: this.maybeDelimiterDef.bind(this),
            delimiterDef: this.delimiterDef.bind(this),
            delimiterDefEnd: this.delimiterDefEnd.bind(this),
            maybeDelimiter: this.maybeDelimiter.bind(this),
            singleStringLeteral: this.singleStringLeteral.bind(this),
            escapedSingleStringLeteral: this.escapedSingleStringLeteral.bind(this),
            maybeSingleStringLeteralEnd: this.maybeSingleStringLeteralEnd.bind(this),
            doubleStringLeteral: this.doubleStringLeteral.bind(this),
            escapedDoubleStringLeteral: this.escapedDoubleStringLeteral.bind(this),
            maybeDoubleStringLeteralEnd: this.maybeDoubleStringLeteralEnd.bind(this)
        };
        this.currentState = this.stateMap.lineStart;
        this.buffer = [];
        this.maybeDashCommentCount = 0;
        this.maybeDelimiterDefBuffer = [];
        this.maybeDelimiterDefCount = 0;
        this.delimiterDefCandidate = [];
        this.delimiter = ";";
        this.maybeDelimiterCount = 0;
        this.skipDelimiterCheck = false;
    };

    // Private methods

    var _appendBufferToResult = function() {
        var joined = this.buffer.join("");
        var candidate = _trim.call(this, joined);
        if (candidate) {
            this.result.push(joined);
        }
        this.buffer = [];
    };

    var _trim = function(str) {
        return str.replace(/^[ 　\t\r\n]+|[ 　\t\r\n]+$/g, "");
    };

    // Public methods

    QueryDivider.prototype.parse = function(query) {
        try {
            this.evaluate(query);
            _appendBufferToResult.call(this);
            this.result[this.result.length - 1] += this.maybeDelimiterDefBuffer.join("");
            return {
                success: true,
                result: this.result
            };
        } catch(e) {
            if (e instanceof ParseError) {
                return {
                    success: false,
                    error: e
                };
            } else {
                throw e;
            }
        }
    };

    QueryDivider.prototype.evaluate = function(query) {
        var pos = 0;
        while(pos < query.length) {
            var ch = query.charAt(pos);
            var incr = this.currentState(query, ch, pos);
            pos += incr;
        }
    };

    QueryDivider.prototype.lineStart = function(query, ch, pos) {
        if (DEBUG) {
            console.log("lineStart: " + ch);
        }
        if (ch === ' ') {
            this.buffer.push(ch);
            return 1;
        } else if (ch === 'd' || ch === 'D') {
            this.currentState = this.stateMap.maybeDelimiterDef;
            this.maybeDelimiterDefBuffer = [ch];
            this.maybeDelimiterDefCount = 0;
            return 1;
        } else {
            this.currentState = this.stateMap.query;
            return 0;
        }
    };

    QueryDivider.prototype.query = function(query, ch, pos) {
        if (DEBUG) {
            console.log("query: " + ch + " [delimiter=" + this.delimiter + "]");
        }
        var skipDelimiterCheck = this.skipDelimiterCheck;
        this.skipDelimiterCheck = false;
        if (ch === '\\') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.escapedQuery;
            return 1;
        } else if (!skipDelimiterCheck && ch === this.delimiter.charAt(0) && this.delimiter.length === 1) {
            _appendBufferToResult.call(this);
            return 1;
        } else if (!skipDelimiterCheck && ch === this.delimiter.charAt(0)) {
            this.currentState = this.stateMap.maybeDelimiter;
            this.maybeDelimiterCount = 0;
            return 1;
        } else if (ch === '#') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.sharpComment;
            return 1;
        } else if (ch === '-') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.maybeDashComment;
            this.maybeDashCommentCount = 0;
            return 1;
        } else if (ch === '/') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.maybeInlineCommentStart;
            return 1;
        } else if (ch === '\n') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.lineStart;
            return 1;
        } else if (ch === '\'') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.singleStringLeteral;
            return 1;
        } else if (ch === '"') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.doubleStringLeteral;
            return 1;
        } else {
            this.buffer.push(ch);
            return 1;
        }
    };

    QueryDivider.prototype.escapedQuery = function(query, ch, pos) {
        if (DEBUG) {
            console.log("escapedQuery: " + ch);
        }
        this.buffer.push(ch);
        this.currentState = this.stateMap.query;
        return 1;
    };

    QueryDivider.prototype.sharpComment = function(query, ch, pos) {
        if (DEBUG) {
            console.log("sharpComment: " + ch);
        }
        if (ch === '\n') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.lineStart;
            return 1;
        } else {
            this.buffer.push(ch);
            return 1;
        }
    };

    QueryDivider.prototype.maybeDashComment = function(query, ch, pos) {
        if (DEBUG) {
            console.log("maybeDashComment: " + ch);
        }
        if (this.maybeDashCommentCount === 0 && ch === '-') {
            this.buffer.push(ch);
            this.maybeDashCommentCount++;
            return 1;
        } else if (this.maybeDashCommentCount === 1 && ch === ' ') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.dashComment;
            return 1;
        } else if (this.maybeDashCommentCount === 1 && ch === '\n') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.lineStart;
            return 1;
        } else {
            this.buffer.push(ch);
            this.currentState = this.stateMap.query;
            return 1;
        }
    };

    QueryDivider.prototype.dashComment = function(query, ch, pos) {
        if (DEBUG) {
            console.log("dashComment: " + ch);
        }
        if (ch === '\n') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.lineStart;
            return 1;
        } else {
            this.buffer.push(ch);
            return 1;
        }
    };

    QueryDivider.prototype.maybeInlineCommentStart = function(query, ch, pos) {
        if (DEBUG) {
            console.log("maybeInlineCommentStart: " + ch);
        }
        if (ch === '*') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.inlineComment;
            return 1;
        } else {
            this.buffer.push(ch);
            this.currentState = this.stateMap.query;
            return 1;
        }
    };

    QueryDivider.prototype.inlineComment = function(query, ch, pos) {
        if (DEBUG) {
            console.log("inlineComment: " + ch);
        }
        if (ch === '*') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.maybeInlineCommentEnd;
            return 1;
        } else {
            this.buffer.push(ch);
            return 1;
        }
    };

    QueryDivider.prototype.maybeInlineCommentEnd = function(query, ch, pos) {
        if (DEBUG) {
            console.log("maybeInlineCommentEnd: " + ch);
        }
        if (ch === '*') {
            this.buffer.push(ch);
            return 1;
        } else if (ch === '/') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.query;
            return 1;
        } else {
            this.buffer.push(ch);
            this.currentState = this.stateMap.inlineComment;
            return 1;
        }
    };

    QueryDivider.prototype.maybeDelimiterDef = function(query, ch, pos) {
        if (DEBUG) {
            console.log("maybeDelimiterDef: " + ch);
        }
        this.maybeDelimiterDefCount++;
        if (ch.toLowerCase() === DELIMITER.charAt(this.maybeDelimiterDefCount).toLowerCase()) {
            if ((this.maybeDelimiterDefCount + 1) === DELIMITER.length) {
                this.currentState = this.stateMap.delimiterDef;
                this.delimiterDefCandidate = [];
                this.maybeDelimiterDefBuffer = [];
                return 1;
            } else {
                this.maybeDelimiterDefBuffer.push(ch);
                return 1;
            }
        } else {
            this.buffer = this.buffer.concat(this.maybeDelimiterDefBuffer);
            this.buffer.push(ch);
            this.maybeDelimiterDefBuffer = [];
            this.currentState = this.stateMap.query;
            return 1;
        }
    };

    QueryDivider.prototype.delimiterDef = function(query, ch, pos) {
        if (DEBUG) {
            console.log("delimiterDef: " + ch);
        }
        if (ch === ' ') {
            if (this.delimiterDefCandidate.length === 0) {
                return 1;
            } else {
                this.delimiter = this.delimiterDefCandidate.join("");
                this.currentState = this.stateMap.delimiterDefEnd;
                _appendBufferToResult.call(this);
                return 1;
            }
        } else if (ch === '\n') {
            if (this.delimiterDefCandidate.length === 0) {
                throw new ParseError("Delimiter not defined at " + pos);
            } else {
                this.delimiter = this.delimiterDefCandidate.join("");
                this.currentState = this.stateMap.lineStart;
                _appendBufferToResult.call(this);
                return 1;
            }
        } else {
            this.delimiterDefCandidate.push(ch);
            return 1;
        }
    };

    QueryDivider.prototype.delimiterDefEnd = function(query, ch, pos) {
        if (DEBUG) {
            console.log("delimiterEnd: " + ch);
        }
        if (ch === '\n') {
            this.currentState = this.stateMap.lineStart;
            return 1;
        } else {
            return 1;
        }
    };

    QueryDivider.prototype.maybeDelimiter = function(query, ch, pos) {
        if (DEBUG) {
            console.log("maybeDelimiter: " + ch);
        }
        this.maybeDelimiterCount++;
        if (ch === this.delimiter.charAt(this.maybeDelimiterCount)) {
            if ((this.maybeDelimiterCount + 1) === this.delimiter.length) {
                _appendBufferToResult.call(this);
                this.currentState = this.stateMap.query;
                return 1;
            } else {
                return 1;
            }
        } else {
            this.currentState = this.stateMap.query;
            this.skipDelimiterCheck = true;
            return this.maybeDelimiterCount * -1;
        }
    };

    QueryDivider.prototype.singleStringLeteral = function(query, ch, pos) {
        if (DEBUG) {
            console.log("singleStringLeteral: " + ch);
        }
        if (ch === '\\') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.escapedSingleStringLeteral;
            return 1;
        } else if (ch === '\'') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.maybeSingleStringLeteralEnd;
            return 1;
        } else {
            this.buffer.push(ch);
            return 1;
        }
    };

    QueryDivider.prototype.maybeSingleStringLeteralEnd = function(query, ch, pos) {
        if (DEBUG) {
            console.log("maybeSingleStringLeteralEnd: " + ch);
        }
        if (ch === '\'') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.singleStringLeteral;
            return 1;
        } else {
            // Re-evaluate as "query" state
            this.currentState = this.stateMap.query;
            return 0;
        }
    };

    QueryDivider.prototype.escapedSingleStringLeteral = function(query, ch, pos) {
        if (DEBUG) {
            console.log("escapedSingleStringLeteral: " + ch);
        }
        this.buffer.push(ch);
        this.currentState = this.stateMap.singleStringLeteral;
        return 1;
    };

    QueryDivider.prototype.doubleStringLeteral = function(query, ch, pos) {
        if (DEBUG) {
            console.log("doubleStringLeteral: " + ch);
        }
        if (ch === '\\') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.escapedDoubleStringLeteral;
            return 1;
        } else if (ch === '"') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.maybeDoubleStringLeteralEnd;
            return 1;
        } else {
            this.buffer.push(ch);
            return 1;
        }
    };

    QueryDivider.prototype.maybeDoubleStringLeteralEnd = function(query, ch, pos) {
        if (DEBUG) {
            console.log("maybeDoubleStringLeteralEnd: " + ch);
        }
        if (ch === '"') {
            this.buffer.push(ch);
            this.currentState = this.stateMap.doubleStringLeteral;
            return 1;
        } else {
            // Re-evaluate as "query" state
            this.currentState = this.stateMap.query;
            return 0;
        }
    };

    QueryDivider.prototype.escapedDoubleStringLeteral = function(query, ch, pos) {
        if (DEBUG) {
            console.log("escapedDoubleStringLeteral: " + ch);
        }
        this.buffer.push(ch);
        this.currentState = this.stateMap.doubleStringLeteral;
        return 1;
    };

    QueryDivider.prototype.setDebug = function(debug) {
        DEBUG = debug;
    };

    // Export

    MySQL.QueryDivider = QueryDivider;

})(MySQL.ParseError);
