Off-The-Record
==============

Secure, undocumented communication server

```javascript
var OffTheRecord = require('./lib/otr'),
    server;

server = new OffTheRecord();

server.on('ready', function () {
    console.log('off-the-record server is running!');
});

server.start();
```
