import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { privateKeyToAccount } from 'viem/accounts';
import { TestProxy } from './util/test-proxy-target.js';
import { TestSession } from './util/test-session.js';
import { bytesToHex } from 'viem';
import { z } from 'zod';

describe('/address', () => {
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
    buildApp(secret, 'development', 'http://localhost:9191', false, [], '');

  describe('GET /address/:address', () => {
    const anotherAddress = bytesToHex(Buffer.alloc(20).fill(1));

    // This test has to be fixed to include the rpc interaction.
    it.skip('when the address is for a contract and user is not logged in, returns data', async () => {
      backgroundApp.setNextAddress('contract', anotherAddress);

      const app = testInstance();
      const session = new TestSession(app);

      const { body, status } = await session.getJson(
        `/address/${anotherAddress}`,
        z.any(),
      );

      expect(status).toEqual(200);
      expect(body.type).toEqual('contract');
      expect(body.address).toEqual(anotherAddress);
    });

    it('when the address is for an account and user is not logged in, returns error', async () => {
      backgroundApp.setNextAddress('account', anotherAddress);

      const app = testInstance();
      const session = new TestSession(app);

      const { status } = await session.getJson(
        `/address/${anotherAddress}`,
        z.any(),
      );

      expect(status).toEqual(401);
    });

    it('when user logged in and requested address is user address returns address data', async () => {
      backgroundApp.setNextAddress('account', address);

      const app = testInstance();
      const session = await TestSession.loggedIn(app, privateKey);

      const { status, body } = await session.getJson(
        `/address/${address}`,
        z.any(),
      );

      expect(status).toEqual(200);
      expect(body.type).toEqual('account');
      expect(body.address).toEqual(address);
    });

    it('when user logged in and requested address is not user address returns errir', async () => {
      backgroundApp.setNextAddress('account', anotherAddress);

      const app = testInstance();
      const session = await TestSession.loggedIn(app, privateKey);

      const { status } = await session.getJson(
        `/address/${anotherAddress}`,
        z.any(),
      );

      expect(status).toEqual(403);
    });

    it('when user is not logged in returns Unauthorized', async () => {
      const app = testInstance();
      const res = await app.inject({
        method: 'GET',
        url: `/address/${address}`,
      });

      expect(res.statusCode).toEqual(401);
      expect(res.json()).toEqual({ error: 'User not authenticated' });
    });
  });

  describe('GET /address/:address/logs', () => {
    const contractAddress = '0xe846c6fcf817734ca4527b28ccb4aea2b6663c79';

    it('it returns logs indexed to current user address', async () => {
      backgroundApp?.addLog(contractAddress, [address], '0x01');

      const app = testInstance();
      const session = await TestSession.loggedIn(app, privateKey);
      const res = await session.getStr(`/address/${contractAddress}/logs`);
      const json = JSON.parse(res);
      expect(json.items.length).toEqual(1);
      expect(json.items[0].data).toEqual('0x01');
    });

    it('it returns skips logs not indexed to the user', async () => {
      backgroundApp?.addLog(contractAddress, [contractAddress], '0x01');

      const app = testInstance();
      const session = await TestSession.loggedIn(app, privateKey);
      const res = await session.getStr(`/address/${contractAddress}/logs`);
      const json = JSON.parse(res);
      expect(json.items.length).toEqual(0);
      expect(json.meta).toEqual({
        totalItems: 0,
        itemCount: 0,
        itemsPerPage: 10,
        totalPages: 0,
        currentPage: 1,
      });
    });

    it('accepts logs indexed in other than the first position to the current user', async () => {
      backgroundApp?.addLog(contractAddress, ['0x01', address], '0x01');

      const app = testInstance();
      const session = await TestSession.loggedIn(app, privateKey);
      const res = await session.getStr(`/address/${contractAddress}/logs`);
      const json = JSON.parse(res);
      expect(json.items.length).toEqual(1);
    });

    it('it adjusts sizes to only the logs returned and preserves order', async () => {
      backgroundApp?.addLog(contractAddress, ['0x01', address], '0x01');
      backgroundApp?.addLog(contractAddress, [address], '0x02');
      backgroundApp?.addLog(contractAddress, [contractAddress], '0x03');
      backgroundApp?.addLog(contractAddress, [contractAddress], '0x04');
      backgroundApp?.addLog(
        contractAddress,
        ['0x01', '0x02', '0x03', address],
        '0x05',
      );

      const app = testInstance();
      const session = await TestSession.loggedIn(app, privateKey);
      const res = await session.getStr(`/address/${contractAddress}/logs`);
      const json = JSON.parse(res);
      expect(json.items.length).toEqual(3);
      expect(json.items[0].data).toEqual('0x01');
      expect(json.items[1].data).toEqual('0x02');
      expect(json.items[2].data).toEqual('0x05');

      expect(json.meta).toEqual({
        totalItems: 3,
        itemCount: 3,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      });
    });
  });

  describe('GET /address/:address/transfers', () => {
    const anotherAddress = '0xe846c6fcf817734ca4527b28ccb4aea2b6663c79';
    const someOtherAddress = '0xB5638358c20522Fba34B5e8840e501f8a7C0F41c';
    it('returns transfers that were sent from current user', async () => {
      backgroundApp?.addTransfer(address, anotherAddress, 1);

      const app = testInstance();
      const session = await TestSession.loggedIn(app, privateKey);
      const res = await session.getStr(`/address/${anotherAddress}/transfers`);
      const json = JSON.parse(res);
      expect(json.items.length).toEqual(1);
    });

    it('returns transfers that were sent to current user', async () => {
      backgroundApp?.addTransfer(anotherAddress, address, 1);

      const app = testInstance();
      const session = await TestSession.loggedIn(app, privateKey);
      const res = await session.getStr(`/address/${anotherAddress}/transfers`);
      const json = JSON.parse(res);
      expect(json.items.length).toEqual(1);
    });

    it('filters out transaction were user was not part', async () => {
      backgroundApp?.addTransfer(anotherAddress, someOtherAddress, 1);

      const app = testInstance();
      const session = await TestSession.loggedIn(app, privateKey);
      const res = await session.getStr(`/address/${anotherAddress}/transfers`);
      const json = JSON.parse(res);
      expect(json.items.length).toEqual(0);
    });
  });
});
