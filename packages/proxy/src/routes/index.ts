import { addressRoutes } from './address.js';
import type { FastifyApp } from '../app.js';
import authRoutes from './auth.js';
import { blocksRoutes } from './blocks-bff.js';
import { batchRoutes } from './batches-bff.js';
import { statsRoutes } from './stats-bff.js';
import { transationsRoutes } from './transactions-bff.js';
import { tokenRoutes } from './token-bff.js';
import { apiRoutes } from './api-routes.js';

export const allRoutes = (app: FastifyApp) => {
  app.register(addressRoutes, { prefix: '/address' });
  app.register(authRoutes, { prefix: '/auth' });
  app.register(blocksRoutes, { prefix: '/blocks' });
  app.register(batchRoutes, { prefix: '/batches' });
  app.register(statsRoutes, { prefix: '/stats' });
  app.register(transationsRoutes, { prefix: '/transactions' });
  app.register(tokenRoutes, { prefix: '/token' });
  app.register(apiRoutes, { prefix: '/api' });
};
