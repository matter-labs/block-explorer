import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { privateKeyToAccount } from 'viem/accounts';
import { TestProxy, testResponseSchema } from './util/test-proxy-target.js';
import { TestSession } from './util/test-session.js';

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
    buildApp(secret, 'development', 'http://localhost:9191', false, []);

  describe('GET /address/:address', () => {
    it('when user is not logged in returns Unauthorized', async () => {
      const app = testInstance();
      const res = await app.inject({
        method: 'GET',
        url: `/address/${address}`,
      });

      expect(res.statusCode).toEqual(401);
      expect(res.json()).toEqual({ error: 'User not authenticated' });
    });

    it('when user logged in bypass request to main api', async () => {
      const app = testInstance();
      const session = await TestSession.loggedIn(app, privateKey);
      const url = `/address/${address}`;
      const res = await session.getJson(url, testResponseSchema);
      expect(res.body).toEqual({ url });
      expect(res.status).toEqual(200);
    });

    it('when user logged in bypass request to main api twice', async () => {
      const app = testInstance();
      const session = await TestSession.loggedIn(app, privateKey);
      const res = await session.getJson(`/address/${address}`, testResponseSchema);
      const res2 = await session.getJson(`/address/${address}`, testResponseSchema);
      expect(res).toEqual(res2);
    });
  });

  describe('GET /address/:address/logs', () => {
    const contractAddress = '0xe846c6fcf817734ca4527b28ccb4aea2b6663c79';

    it('it returns logs indexed to current user address', async () => {
      backgroundApp?.addAddressLog(contractAddress, [address], '0x01');

      const app = testInstance();
      const session = await TestSession.loggedIn(app, privateKey);
      const res = await session.getStr(`/address/${contractAddress}/logs`);
      const json = JSON.parse(res);
      expect(json.items.length).toEqual(1);
      expect(json.items[0].data).toEqual('0x01');
    });

    it('it returns skips logs not indexed to the user', async () => {
      backgroundApp?.addAddressLog(contractAddress, [contractAddress], '0x01');

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
      backgroundApp?.addAddressLog(contractAddress, ['0x01', address], '0x01');

      const app = testInstance();
      const session = await TestSession.loggedIn(app, privateKey);
      const res = await session.getStr(`/address/${contractAddress}/logs`);
      const json = JSON.parse(res);
      expect(json.items.length).toEqual(1);
    });

    it('it adjusts sizes to only the logs returned and preserves order', async () => {
      backgroundApp?.addAddressLog(contractAddress, ['0x01', address], '0x01');
      backgroundApp?.addAddressLog(contractAddress, [address], '0x02');
      backgroundApp?.addAddressLog(contractAddress, [contractAddress], '0x03');
      backgroundApp?.addAddressLog(contractAddress, [contractAddress], '0x04');
      backgroundApp?.addAddressLog(
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
