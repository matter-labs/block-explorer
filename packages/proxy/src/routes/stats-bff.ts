import type { FastifyApp } from '../app.js';
import { buildUrl } from '../utils/url.js';
import { pipeGetRequest } from '../services/block-explorer.js';

export function statsRoutes(app: FastifyApp) {
  app.get('/', async (_req, reply) => {
    const targetUrl = buildUrl(`${app.conf.proxyTarget}/stats`, {});
    return pipeGetRequest(targetUrl, reply);
  });
}
