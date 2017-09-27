import * as url                 from 'url';

import * as logger              from '@nodeswork/logger';
import * as applet              from '@nodeswork/applet';

import { ContainerProxyModule } from './module';

const LOG        = logger.getLogger();
const SUB_NET    = process.env.SUB_NET;
const NAM_HOST   = process.env.NAM_HOST;

if (NAM_HOST == null) {
  LOG.error('NAM_HOST is not specified.');
  process.exit(1);
}

applet.bootstrap(ContainerProxyModule, { noStart: true });
