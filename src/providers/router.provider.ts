import * as _             from 'underscore';
import * as http          from 'http';
import * as httpProxy     from 'http-proxy';
import * as os            from 'os';
import * as url           from 'url';

import * as kiws          from '@nodeswork/kiws';
import * as applet        from '@nodeswork/applet';
import * as logger        from '@nodeswork/logger';
import * as sbase         from '@nodeswork/sbase';
import { NodesworkError } from '@nodeswork/utils';

const LOG               = logger.getLogger();
const SUB_NET                  = process.env.SUB_NET;
const NAM_HOST                 = process.env.NAM_HOST;
const NA_PREFIX                = 'na-';
const HOSTNAME                 = os.hostname();
const proxy                    = httpProxy.createProxyServer({});
const FORWARDED_TO_HEADER_KEY  = sbase.constants.headers.request
  .NODESWORK_FORWARDED_TO.toLowerCase();
const BAD_HEADER_ERROR         = NodesworkError.badRequest(
  `Unkown header ${sbase.constants.headers.request.NODESWORK_FORWARDED_TO}`
);

@kiws.Injectable()
export class RouterProvider {

  private appCallback: (
    req: http.IncomingMessage, res: http.ServerResponse,
  ) => void;
  private producer: string;

  constructor(
    private koa:         kiws.KoaService,
    private appletInfo:  applet.AppletInfoService,
  ) {
    this.appCallback = this.koa.app.callback();
    this.producer    = this.appletInfo.getAppletInfo().producer;
  }

  public route(req: http.IncomingMessage, res: http.ServerResponse) {
    const startTime = Date.now();

    LOG.info('Route request', {
      url:      req.url,
      headers:  req.headers,
      method:   req.method,
    });

    let forwarededTo = req.headers[FORWARDED_TO_HEADER_KEY];
    console.log(forwarededTo);

    if (_.isArray(forwarededTo)) {
      forwarededTo = forwarededTo[0];
    }

    if (forwarededTo == null) {
      return this.appCallback(req, res);
    }

    const processingError = (e: Error) => {
      LOG.error('processing error', {
        url: req.url,
        headers: req.headers,
        method: req.method,
        error: e,
      });

      const error = NodesworkError.cast(e);

      const headers: any = {
        'Content-Type': 'application/json',
      };
      headers[sbase.constants.headers.response.NODESWORK_PRODUCER] =
        this.producer;
      headers[sbase.constants.headers.response.NODESWORK_PRODUCER_HOST] =
        HOSTNAME;
      headers[sbase.constants.headers.response.NODESWORK_PRODUCER_DURATION] =
        Date.now() - startTime;
      res.writeHead(error.meta.responseCode, headers);
      res.end(JSON.stringify(error.toJSON({ cause: true })));
    }

    try {
      const requestUrl = url.parse(req.url);
      req.url = requestUrl.path;

      var target;
      if (forwarededTo.startsWith('na-')) {
        target = `http://${forwarededTo}`;
      } else if (forwarededTo === 'nam') {
        target = NAM_HOST;
      } else {
        throw BAD_HEADER_ERROR;
      }
      console.log('target', target);

      proxy.web(req, res, { target }, (err) => {
        processingError(err);
      });

    } catch (e) {
      processingError(e);
    }
  }
}
