MySQL JavaScript Driver
=======================

What's this?
------------

This project provides a library to connect, login and execute a query to MySQL.

How to use
----------

(1) Load this library with a script tag like the following:

```html
<script type="text/javascript" src="mysql_js_driver_[VERSION_NUMBER].min.js"></script>
```

(2) Create a client and set an implementation object to communicate with a socket like the following:

```javascript
var client = new MySQL.Client();
// Socket communication with Chrome Socket API (chrome.sockets.tcp)
client.setSocketImpl(new MySQL.ChromeSocket2());
```

(3-1) Connect and login to MySQL server

```javascript
client.login(
  "YOUR_MYSQL_HOSTNAME", "YOUR_MYSQL_PORT_NUMBER",
  "YOUR_USERNAME", "YOUR_PASSWORD",
  function(initialHandshakeRequest, result) {
    if (result.isSuccess()) {
      var serverVersion = initialHandshakeRequest.serverVersion;
      var protocolVersion = initialHandshakeRequest.protocolVersion;
      // do something...
    } else {
      var errorMessage = result.errorMessage;
      // do something...
    }
  }, function(errorCode) { // Error returned from MySQL server
    // do something...
  }, function(result) { // Cannot connect to MySQL server
    // do something...
  });
```

(3-2) Connect and login to MySQL server with SSL

```javascript
var ca = ...; // CA Certificate string in PEM format
client.loginWithSSL(
  "YOUR_MYSQL_HOSTNAME", "YOUR_MYSQL_PORT_NUMBER",
  "YOUR_USERNAME", "YOUR_PASSWORD",
  ca, true, // true means to check whether CN === host name.
  function(initialHandshakeRequest, result) {
    if (result.isSuccess()) {
      var serverVersion = initialHandshakeRequest.serverVersion;
      var protocolVersion = initialHandshakeRequest.protocolVersion;
      // do something...
    } else {
      var errorMessage = result.errorMessage;
      // do something...
    }
  }, function(errorCode) { // Error returned from MySQL server
    // do something...
  }, function(result) { // Cannot connect to MySQL server
    // do something...
  });
```

(4) Execute query (if the result set is returned)

```javascript
var query = "SELECT * FROM foo WHERE...";
client.query(query, function(columnDefinitions, resultsetRows) {
  for (var i = 0; i < columnDefinitions.length; i++) {
    var catalog = columnDefinitions[i].catalog;
    var schema = columnDefinitions[i].schema
    var table = columnDefinitions[i].table;
    var orgTable = columnDefinitions[i].orgTable;
    var name = columnDefinitions[i].name;
    var orgName = columnDefinitions[i].orgName;
    // do something...
  }
  for (i = 0; i < resultsetRows.length; i++) {
    var values = resultsetRows[i].values;
    for (var j = 0; j < values.length; j++) {
      var value = values[j];
      // do something...
    }
  }
}, function(result) {
  // Never called.
}, function(result) { // Server returned error.
  var errorMessage = result.errorMessage;
  // do something...
}, function(result) { // Cannot send query.
  // do something...
}
```

(5) Execute query (if the result set is not returned)

```javascript
var query = "UPDATE foo SET bar = baz WHERE ...";
client.query(query, function(columnDefinitions, resultsetRows) {
  // Never called.
}, function(result) {
  var affectedRows = result.affectedRows;
  var lastInsertId = result.lastInsertId;
  // do something...
}, function(result) { // Server returned error.
  var errorMessage = result.errorMessage;
  // do something...
}, function(result) { // Cannot send query.
  // do something...
}
```

(6) Logout from MySQL server

```javascript
client.logout(function(result) {
  // do something...
});
```

How to build
------------

```
$ git clone https://github.com/yoichiro/mysql_js_driver
$ cd mysql_js_driver
$ npm install
$ grunt
```

Dependent libraries
-------------------

* [encoding.js](http://code.google.com/p/stringencoding/)
* [crypto-js](https://code.google.com/p/crypto-js/)
* [Forge](https://github.com/digitalbazaar/forge)
