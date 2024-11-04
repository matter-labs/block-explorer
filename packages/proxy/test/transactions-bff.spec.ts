import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { privateKeyToAccount } from 'viem/accounts';
import { TestProxy } from './util/test-proxy-target.js';
import { TestSession } from './util/test-session.js';
import { z } from 'zod';
import { bytesToHex, zeroAddress } from 'viem';

describe('/transactions', () => {
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
  const privateKey =
    '0x4f31daab592fe9e35cd47c5fb2db635a25956a9b2023fb6d450e9919f433a262';
  const account = privateKeyToAccount(privateKey);
  const address = account.address;
  const testInstance = () =>
    buildApp(secret, 'development', 'http://localhost:9191', false, []);

  describe('GET /transactions', () => {
    it('when user is logged in returns transactions where user is source', async () => {
      backgroundApp.addTransaction(address, zeroAddress, '0x01');
      backgroundApp.addTransaction(address, zeroAddress, '0x02');

      const app = testInstance();
      const session = await TestSession.loggedIn(app, privateKey);

      const { status, body } = await session.getJson('/transactions', z.any());

      expect(status).toEqual(200);
      expect(body.items).toHaveLength(2);
      expect(body.items.map((i: any) => i.hash)).toEqual(
        expect.arrayContaining(['0x01', '0x02']),
      );
    });

    it('filters out transactions where user is not source or address', async () => {
      const anotherAddress = bytesToHex(Buffer.alloc(20).fill(1));
      const someOtherAddress = bytesToHex(Buffer.alloc(20).fill(2));
      backgroundApp.addTransaction(anotherAddress, someOtherAddress, '0x01');
      backgroundApp.addTransaction(someOtherAddress, anotherAddress, '0x02');

      const app = testInstance();
      const session = await TestSession.loggedIn(app, privateKey);

      const { status, body } = await session.getJson('/transactions', z.any());

      expect(status).toEqual(200);
      expect(body.items).toHaveLength(0);
    });

    it('when user is logged in returns transactions where user is target', async () => {
      backgroundApp.addTransaction(zeroAddress, address, '0x01');
      backgroundApp.addTransaction(zeroAddress, address, '0x02');

      const app = testInstance();
      const session = await TestSession.loggedIn(app, privateKey);

      const { status, body } = await session.getJson('/transactions', z.any());

      expect(status).toEqual(200);
      expect(body.items).toHaveLength(2);
      expect(body.items.map((i: any) => i.hash)).toEqual(
        expect.arrayContaining(['0x01', '0x02']),
      );
    });

    it('when user is logged in filters only right transactions', async () => {
      const anotherAddress = bytesToHex(Buffer.alloc(20).fill(1));
      const someOtherAddress = bytesToHex(Buffer.alloc(20).fill(2));
      backgroundApp.addTransaction(anotherAddress, someOtherAddress, '0x01');
      backgroundApp.addTransaction(anotherAddress, address, '0x02');
      backgroundApp.addTransaction(someOtherAddress, anotherAddress, '0x03');
      backgroundApp.addTransaction(address, someOtherAddress, '0x04');

      const app = testInstance();
      const session = await TestSession.loggedIn(app, privateKey);

      const { status, body } = await session.getJson('/transactions', z.any());

      expect(status).toEqual(200);
      expect(body.items).toHaveLength(2);
      expect(body.items.map((i: any) => i.hash)).toEqual(
        expect.arrayContaining(['0x02', '0x04']),
      );
    });

    it('when no user logged in returns empty array', async () => {
      backgroundApp.addTransaction(zeroAddress, address, '0x01');

      const app = testInstance();
      const session = new TestSession(app);

      const { status, body } = await session.getJson('/transactions', z.any());

      expect(status).toEqual(200);
      expect(body.items).toHaveLength(0);
    });
  });
});
