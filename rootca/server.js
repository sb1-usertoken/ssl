'use strict';

var https = require('https')
  , fs = require('fs')
  , connect = require('connect')
  , app = connect()
  , sslOptions
  , server
  , port = 4080
  ;

require('ssl-root-cas/latest')
  .inject()
  .addFile(__dirname + '/ssl/Geotrust Cross Root CA.txt')
  .addFile(__dirname + '/ssl/Rapid SSL CA.txt')
  ;

sslOptions = {
  key: fs.readFileSync('./ssl/server.key')
, cert: fs.readFileSync('./ssl/server.crt')
};

app.use('/', function (req, res) {
  res.end('<html><body><h1>Hello World</h1></body></html>');
});

server = https.createServer(sslOptions, app).listen(port, function(){
  console.log('Listening on https://' + server.address().address + ':' + server.address().port);
});
