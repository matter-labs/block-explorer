import { ExternalRpcError, PasstroughError } from '@/errors';
import { JSONLike } from '@/rpc/rpc-service';

export async function delegateCall(
  url: string,
  method: string,
  params: unknown[] = [],
  id: number | string,
): Promise<JSONLike> {
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });

  if (!res.ok) {
    const errorBody = await res.json();
    throw new ExternalRpcError(
      errorBody?.error?.code,
      errorBody?.error?.message,
      errorBody?.error?.data,
    );
  }

  const body = await res.json();

  if (body.error) {
    throw new PasstroughError(body.error);
  }

  if (body.result === undefined) {
    throw new ExternalRpcError(-32000, 'Error', undefined);
  }

  return body?.result;
}
