var http       = require('http'),
    httpProxy  = require('http-proxy')
    url        = require('url');

var proxy = httpProxy.createProxyServer({});

const SUB_NET    = process.env.SUB_NET,
      NAM_HOST   = process.env.NAM_HOST,
      PORT       = process.env.PORT || 80;

if (NAM_HOST == null) {
  console.error('NAM_HOST is not specified.');
  process.exit(1);
}

var server = http.createServer(function(req, res) {
  if (req.url === '/sstats') {
    res.writeHead(200, {
      'Context-Type': 'application/json'
    });
    res.end('{"status":"ok"}');
    return;
  }

  try {
    const targetUrl = new url.URL(req.url);
    const hostname  = targetUrl.hostname;
    var target;

    console.log('headers', req.headers);
    console.log('url', req.url);
    console.log('method', req.method);
    if (req.headers['x-route-to'] === 'INTERNAL' && hostname.startsWith('na-')) {
      target = req.url;
    } else {
      target = NAM_HOST;
    }
    console.log('target', target);

    proxy.web(req, res, { target });
  } catch (e) {
    console.error(e);
    res.writeHead(404, {
      'Content-Type': 'text/plain'
    });
    res.end('Could not locate the destination, we are reporting a custom error message.');
  }
});

server.listen(PORT);

// Listen for the `error` event on `proxy`.
proxy.on('error', function (err, req, res) {
  console.error(err);
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });

  res.end('Something went wrong. And we are reporting a custom error message.');
});
