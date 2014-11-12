describe("MySQL.QueryDivider", function() {

    var target;

    beforeEach(function() {
        target = new MySQL.QueryDivider();
        // target.setDebug(true);
    });

    it("can parse multi-statements", function() {
        var source = "a#aaa\nb-- bbb\nc/*d*/e;f/*;*/g;h\ni";
        var actual = target.parse(source);
        expect(true).toEqual(actual.success);
        expect("a#aaa\nb-- bbb\nc/*d*/e").toEqual(actual.result[0]);
        expect("f/*;*/g").toEqual(actual.result[1]);
        expect("h\ni").toEqual(actual.result[2]);
    });

    it("can parse multi-statements with delimiter command", function() {
        var source = "delimiter //\na//b/*//*/c//#//\n-- //\nd";
        var actual = target.parse(source);
        expect(true).toEqual(actual.success);
        expect("a").toEqual(actual.result[0]);
        expect("b/*//*/c").toEqual(actual.result[1]);
        expect("#//\n-- //\nd").toEqual(actual.result[2]);
    });

    it("can parse query including a part of delimiter def", function() {
        var source = "select\n *\n from\n description\n order by abc";
        var actual = target.parse(source);
        expect(true).toEqual(actual.success);
        expect("select\n *\n from\n description\n order by abc").toEqual(actual.result[0]);
    });

    it("can parse query including a single string leteral", function() {
        var source = "select\n *\n from\n description\n where\n foo = 'a\\'b''c;d\"ef'";
        var actual = target.parse(source);
        expect(true).toEqual(actual.success);
        expect("select\n *\n from\n description\n where\n foo = 'a\\'b''c;d\"ef'").toEqual(actual.result[0]);
    });

    it("can parse query including a double string leteral", function() {
        var source = "select\n *\n from\n description\n where\n foo = \"a\\\"b\"\"c;d'ef\"";
        var actual = target.parse(source);
        expect(true).toEqual(actual.success);
        expect("select\n *\n from\n description\n where\n foo = \"a\\\"b\"\"c;d'ef\"").toEqual(actual.result[0]);
    });

});
