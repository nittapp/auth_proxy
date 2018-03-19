var Imap = require('imap');
var ldap = require('ldapjs');
var https = require('https');
var fs = require('fs');
var qs = require('querystring');
var config = require("./config");

var ldapurl = 'ldap://10.0.0.39:389';
var imaphost = "10.0.0.173";
var imapport = 143;
var domain = 'octa.edu';

var getUserInfo = function(username, callback){
  var client = ldap.createClient({
    url: ldapurl
  });
  var server = config.username;
  var password = config.password;
  var cn = server+'@'+domain;
  client.bind(cn,password,function(err){ if(err) console.log(err); });

  if(/^\d{9}/.test(username) == false) return callback(new Error("Invalid roll number"));
  var opts = {
    scope: 'sub',
    filter: "(cn=" + username + ")",
  };
  var DN = "dc=octa,dc=edu";
  client.search(DN, opts, function(err, res) {
    if (err){
      callback(err);
    }else{
      res.on('searchEntry', function(entry) {
        var ret = Object.assign({}, entry.object);
	ret = {
	  name: ret.displayName,
	  rollNumber: cn,
          department: ret.dn.match(/OU=([^,]+),DC=octa/)[1],
	};
        callback(null,ret);
        client.unbind(function (err) {});
      });
      res.on('error', function(err) {
        console.error('error: ' + err.message);
        client.unbind(function (err) {});
      });
    }
  });
};

var authenticate=function(username, password, callback){
  if(!password) return callback(new Error("Password required"));
  var client = ldap.createClient({
    url: ldapurl
  });

  console.log("Trying ldap login");
  var cn = username+'@'+domain;
  client.bind(cn,password,function(err){
    if (err){
      console.log(err);
      console.log("Trying Imap Login");
      var imap = new Imap({
        user: username,
        password: password,
        host: imaphost,
        port: imapport,
        tls: false
      });
      imap.once('ready', function() {
        imap.end();
        console.log("Authenticated");
        getUserInfo(username, callback);
      });
      imap.once('error', function(err) {
        console.log(err);
        callback(err);
      });
      imap.connect();
    }else{
      client.unbind(function (err) {});
      console.log("Authenticated");
      getUserInfo(username, callback);
    }
  });
};

var options = {
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-crt.pem'),
  ca: fs.readFileSync('ca-crt.pem'), 
  requestCert: true,
  rejectUnauthorized: true,
};

var server = https.createServer(options, function(req, res) {
  console.log("got request!");
  if (req.method != 'POST') {
    console.error("Only POST methods accepted. Given", req.method);
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  var body = '';
  req.on('data', function(data) {
    body += data;
    if (body.length > 1000) {
      console.error("Body too large. Body gotten so far:", body);
      res.writeHead(413);
      res.end("Body too large");
      req.connection.destroy();
    }
  });
  req.on('end', function() {
    try {
      body = JSON.parse(body);
      if (!body.username) throw new Error("Username not passed");
      if (!body.password) throw new Error("Password not passed");
    } catch(e) {
      console.error("Reject request, body not in JSON or username/password missing", e, body);
      res.writeHead(400);
      res.end("Bad request");
      return;
    }

    authenticate(body.username, body.password, function(err, userInfo) {
      if(err) {
        res.writeHead(401);
	res.end("Invalid credentials");
	return;
      }

      var reply = JSON.stringify(userInfo);
      res.writeHead(200, {
        'Content-Length': reply.length,
	'Content-Type': 'application/json',
      });
      res.end(reply);
    });
  });
});

server.listen(3142, function() {
  console.log("Auth proxy listening on port 3142");
});
