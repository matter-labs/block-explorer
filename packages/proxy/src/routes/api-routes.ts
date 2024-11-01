import type { FastifyApp } from '../app.js';
import { pipeGetRequest } from '../services/block-explorer.js';

export function apiRoutes(app: FastifyApp) {
  app.get('/', async (req, reply) => {
    const targetUrl = `${app.conf.proxyTarget}${req.url}`;
    return pipeGetRequest(targetUrl, reply);
  });
}
