'use strict';

var https = require('https')
  , http = require('http')
  , fs = require('fs')
  , crypto = require('crypto')
  , connect = require('connect')
  , vhost = require('vhost')

  // connect / express app
  , app = connect()

  // SSL Server
  , secureContexts = {}
  , secureOpts
  , secureServer
  , securePort = 4443

  // force SSL upgrade server
  , server
  , port = 4080

  // the ssl domains I have
  , domains = ['aj.the.dj', 'ballprovo.com']
  ;

require('ssl-root-cas/latest')
  .inject()
  .addFile(__dirname + '/ssl/Geotrust Cross Root CA.txt')
  .addFile(__dirname + '/ssl/Rapid SSL CA.txt')
  ;

function getAppContext(domain) {
  // Really you'd want to do this:
  // return require(__dirname + '/' + domain + '/app.js');

  // But for this demo we'll do this:
  return connect().use('/', function (req, res) {
    console.log('req.vhost', JSON.stringify(req.vhost));
    res.end('<html><body><h1>Welcome to ' + domain + '!</h1></body></html>');
  });
}

domains.forEach(function (domain) {
  secureContexts[domain] = crypto.createCredentials({
    key:  fs.readFileSync(__dirname + '/' + domain + '/ssl/server.key')
  , cert: fs.readFileSync(__dirname + '/' + domain + '/ssl/server.crt')
  }).context;

  app.use(vhost('*.' + domain, getAppContext(domain)));
  app.use(vhost(domain, getAppContext(domain)));
});

// fallback / default domain
app.use('/', function (req, res) {
  res.end('<html><body><h1>Hello World</h1></body></html>');
});

//provide a SNICallback when you create the options for the https server
secureOpts = {
  //SNICallback is passed the domain name, see NodeJS docs on TLS
  SNICallback: function (domain) {
    console.log('SNI:', domain);
    return secureContexts[domain];
  }
  // fallback / default domain
  , key:  fs.readFileSync(__dirname + '/aj.the.dj/ssl/server.key')
  , cert: fs.readFileSync(__dirname + '/aj.the.dj/ssl/server.crt')
};

secureServer = https.createServer(secureOpts, app).listen(securePort, function(){
  console.log("Listening on https://localhost:" + secureServer.address().port);
});

server = http.createServer(function (req, res) {
  res.setHeader(
    'Location'
  , 'https://' + req.headers.host.replace(/:\d+/, ':' + securePort)
  );
  res.statusCode = 302;
  res.end();
}).listen(port, function(){
  console.log("Listening on http://localhost:" + server.address().port);
});
