import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { TestProxy, testResponseSchema } from './util/test-proxy-target.js';
import { TestSession } from './util/test-session.js';

describe('/blocks', () => {
  const backgroundApp = new TestProxy();
  beforeAll(async () => {
    await backgroundApp.start();
  });

  afterAll(async () => {
    await backgroundApp.stop();
  });

  beforeEach(() => {
    backgroundApp.reset();
  });

  const secret = Buffer.alloc(32).fill(0).toString('hex');
  const testSession = () => {
    const app = buildApp(secret, 'development', backgroundApp.url(), false, [
      '*',
    ]);
    return new TestSession(app);
  };

  describe('GET /batches', () => {
    it('it bypass the request ot the explorer', async () => {
      const session = testSession();
      const { status, body } = await session.getJson(
        '/batches',
        testResponseSchema,
      );
      expect(status).toEqual(200);
      expect(body.url).toEqual('/batches');
    });
  });

  describe('GET /batches/:batchNumber', () => {
    const batchNumber = 40;
    it('it bypass the request ot the explorer', async () => {
      const session = testSession();
      const url = `/batches/${batchNumber}`;
      const { status, body } = await session.getJson(url, testResponseSchema);
      expect(status).toEqual(200);
      expect(body.url).toEqual(url);
    });
  });
});
