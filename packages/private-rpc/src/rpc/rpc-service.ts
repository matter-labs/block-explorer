import { ExternalRpcError, PasstroughError } from '@/errors';
import { z } from 'zod';
import { Address } from 'viem';
import { delegateCall } from '@/rpc/delegate-call';
import { Authorizer } from '@/permissions/authorizer';

export type JSONLike =
  | {
      [key: string]: JSONLike;
    }
  | string
  | number
  | null
  | boolean
  | JSONLike[];

const rpcReqSchema = z.object({
  id: z.union([z.number(), z.string()]),
  jsonrpc: z.literal('2.0'),
  method: z.string(),
  params: z.array(z.any()),
});

type RpcResponse =
  | {
      jsonrpc: '2.0';
      id: number | string;
      result: JSONLike;
    }
  | {
      jsonrpc: '2.0';
      id: number | string | null;
      error: {
        code: number;
        message: string;
        data?: unknown;
      };
    };

export type RequestContext = {
  authorizer: Authorizer;
  targetRpcUrl: string;
  currentUser: Address;
};

export interface MethodHandler {
  name: string;

  handle(
    context: RequestContext,
    method: string,
    params: unknown[],
    id: number | string,
  ): Promise<JSONLike>;
}

function hasProperty<T, P extends string>(
  obj: T,
  prop: P,
): obj is T & Record<P, unknown> {
  return typeof obj === 'object' && obj !== null && prop in obj;
}

function getErrorCode(err: unknown) {
  if (hasProperty(err, 'code') && typeof err.code === 'number') {
    return err.code;
  }
  return -32000;
}

function getErrorMessage(err: unknown) {
  if (hasProperty(err, 'message') && typeof err.message === 'string') {
    return err.message;
  }
  return '';
}

function getErrorData(err: unknown) {
  if (hasProperty(err, 'data')) {
    const stringifiedData = JSON.stringify(err.data);
    if (stringifiedData !== undefined) {
      err.data = JSON.parse(stringifiedData);
    }
    return err.data;
  }
}

export class RpcCallHandler {
  private handlers: Record<string, MethodHandler>;
  private context: RequestContext;

  constructor(handlers: MethodHandler[], context: RequestContext) {
    this.context = context;
    this.handlers = handlers.reduce<Record<string, MethodHandler>>(
      (acum, current) => {
        acum[current.name] = current;
        return acum;
      },
      {},
    );
  }

  async handle(rawBody: unknown): Promise<RpcResponse> {
    const parsed = rpcReqSchema.safeParse(rawBody);
    if (parsed.error) {
      return {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32600, message: 'Invalid Request' },
      };
    }

    try {
      const { method, params, id } = parsed.data;
      return {
        jsonrpc: '2.0',
        id: parsed.data.id,
        result: await this.tryCall(method, params, id),
      };
    } catch (e) {
      if (e instanceof PasstroughError) {
        return {
          jsonrpc: '2.0',
          id: parsed.data.id,
          error: e.error as any,
        };
      }
      if (e instanceof ExternalRpcError) {
        return {
          jsonrpc: '2.0',
          id: parsed.data.id,
          error: {
            code: e.getErrorCode(),
            message: e.getErrorMessage(),
            data: e.getErrorData(),
          },
        };
      } else {
        return {
          jsonrpc: '2.0',
          id: parsed.data.id,
          error: {
            code: getErrorCode(e),
            message: getErrorMessage(e),
            data: getErrorData(e),
          },
        };
      }
    }
  }

  private async tryCall(
    method: string,
    params: unknown[],
    id: number | string,
  ): Promise<JSONLike> {
    const handler = this.handlers[method] || this.defaultHandler();
    return handler.handle(this.context, method, params, id);
  }

  private defaultHandler(): MethodHandler {
    return {
      name: '',
      handle: (context, method, params, id) =>
        delegateCall(context.targetRpcUrl, method, params, id),
    };
  }
}
