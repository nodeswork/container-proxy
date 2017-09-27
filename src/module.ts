import * as http          from 'http';

import * as kiws          from '@nodeswork/kiws';
import * as logger        from '@nodeswork/logger';

import { RouterProvider } from './providers';

const PORT = process.env.PORT || 80;
const LOG  = logger.getLogger();

@kiws.Module({
  providers: [
    RouterProvider,
  ],
})
export class ContainerProxyModule {

  private server: http.Server;

  constructor(
    private router: RouterProvider,
  ) {
    this.server = http.createServer((req, res) => {
      this.router.route(req, res);
    });
    this.server.listen(PORT);
    LOG.info('server is start', { url: `http://localhost:${PORT}` });
  }
}
