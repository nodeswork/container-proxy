var http       = require('http'),
    httpProxy  = require('http-proxy')
    ip         = require('ip'),
    url        = require('url');

var proxy = httpProxy.createProxyServer({});

const SUB_NET    = process.env.SUB_NET,
      NAM_HOST   = process.env.NAM_HOST;

if (NAM_HOST == null) {
  console.error('NAM_HOST is not specified.');
  process.exit(1);
}

var subnet;

if (SUB_NET != null) {
  subnet = ip.cidrSubnet(SUB_NET);
}

var server = http.createServer(function(req, res) {
  const targetUrl = new url.URL(req.url);
  const hostname  =targetUrl.hostname;
  var target;

  if (subnet && subnet.contains(hostname)) {
    target = hostname;
  } else {
    target = NAM_HOST;
  }

  console.log('headers', req.headers);
  console.log('url', req.url);
  console.log('method', req.method);

  proxy.web(req, res, { target });
});

server.listen(8080);

// Listen for the `error` event on `proxy`.
proxy.on('error', function (err, req, res) {
  console.error(err);
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });

  res.end('Something went wrong. And we are reporting a custom error message.');
});
