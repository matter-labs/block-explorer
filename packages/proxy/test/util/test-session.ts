import type { FastifyApp } from '../../src/app.js';
import { privateKeyToAccount } from 'viem/accounts';
import type { Hex } from 'viem';
import { SiweMessage } from 'siwe';
import { z, ZodTypeAny } from 'zod';

export interface Cookie {
  name: string;
  value: string;
  expires?: Date;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;

  [name: string]: unknown;
}

export class TestSession {
  private app: FastifyApp;
  private cookie: Record<string, string>;

  constructor(app: FastifyApp) {
    this.app = app;
    this.cookie = {};
  }

  static async loggedIn(
    app: FastifyApp,
    privateKey: Hex,
  ): Promise<TestSession> {
    const session = new TestSession(app);
    const nonce = await session.getStr('/auth/nonce');
    const account = privateKeyToAccount(privateKey);
    const message = new SiweMessage({
      domain: 'localhost',
      address: account.address,
      statement: 'Sign in with Ethereum',
      uri: 'http://localhost:3000',
      version: '1',
      chainId: 1,
      nonce: nonce,
    });

    const msgStr = message.prepareMessage();
    const signature = await account.signMessage({ message: msgStr });

    await session.postStr('/auth/verify', { message: msgStr, signature });

    return session;
  }

  async getStr(url: string): Promise<string> {
    const res = await this.app.inject({
      method: 'GET',
      url,
      cookies: this.cookie,
    });
    this.updateCookies(res.cookies);
    return res.body;
  }

  async postStr(url: string, body: string | object): Promise<string> {
    const res = await this.app.inject({
      method: 'POST',
      url,
      cookies: this.cookie,
      payload: body,
    });
    this.updateCookies(res.cookies);
    return res.body;
  }

  private updateCookies(cookies: Cookie[]) {
    const newCookies = cookies.reduce<Record<string, string>>((a, b) => {
      a[b.name] = b.value;
      return a;
    }, {});
    this.cookie = { ...this.cookie, ...newCookies };
  }

  async getJson<Z extends ZodTypeAny>(
    url: string,
    schema: Z,
  ): Promise<{ status: number; body: z.infer<Z> }> {
    const res = await this.app.inject({
      method: 'GET',
      url,
      cookies: this.cookie,
    });
    this.updateCookies(res.cookies);
    return {
      status: res.statusCode,
      body: schema.parse(JSON.parse(res.body)),
    };
  }
}
