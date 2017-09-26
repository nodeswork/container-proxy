var http       = require('http'),
    httpProxy  = require('http-proxy')
    url        = require('url'),
    logger     = require('@nodeswork/logger');

var proxy = httpProxy.createProxyServer({});

const SUB_NET    = process.env.SUB_NET,
      NAM_HOST   = process.env.NAM_HOST,
      PORT       = process.env.PORT || 80,
      LOG        = logger.getLogger();

if (NAM_HOST == null) {
  LOG.error('NAM_HOST is not specified.');
  process.exit(1);
}

proxy.on('proxyRes', function (proxyRes, req, res) {
  LOG.log('RAW Response from the target', { headers: proxyRes.headers });
});

var server = http.createServer(function(req, res) {
  const toApplet  = req.headers['x-to-applet'];

  LOG.info('Receive request', {
    url: req.url,
    headers: req.headers,
    method: req.method,
  });

  if (req.url === '/sstats' && toApplet == null ) {
    res.writeHead(200, {
      'Context-Type': 'application/json; charset=utf-8'
    });
    res.end('{"status":"ok"}');
    return;
  }

  try {
    var target;
    if (toApplet && toApplet.startsWith('na-')) {
      target = `http://${toApplet}`;
    } else {
      target = NAM_HOST;
    }
    proxy.web(req, res, { target });
  } catch (e) {
    LOG.error('processing error', {
      url: req.url,
      headers: req.headers,
      method: req.method,
      error: e,
    });
    res.writeHead(404, {
      'Content-Type': 'text/plain'
    });
    res.end('Could not locate the destination, we are reporting a custom error message.');
  }
});

server.listen(PORT);

// Listen for the `error` event on `proxy`.
proxy.on('error', function (err, req, res) {
  LOG.error('Outer error', err);
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });

  res.end('Something went wrong. And we are reporting a custom error message.');
});
