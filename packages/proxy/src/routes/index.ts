import { addressRoutes } from './address.js';
import type { FastifyApp } from '../app.js';
import authRoutes from './auth.js';

export const allRoutes = (app: FastifyApp) => {
  app.register(addressRoutes, { prefix: '/address' });
  app.register(authRoutes, { prefix: '/auth' });
};
