import { JSONLike, MethodHandler, RequestContext } from '@/rpc/rpc-service';
import {
  Hex,
  isAddressEqual,
  parseTransaction,
  recoverTransactionAddress,
} from 'viem';
import { z } from 'zod';
import { hexSchema } from '@/schemas/hex';
import { delegateCall } from '@/rpc/delegate-call';
import { addressSchema } from '@/schemas/address';

function extractSelector(calldata: Hex): Hex {
  return calldata.substring(0, 10) as Hex;
}

const callReqSchema = z
  .object({
    from: addressSchema.optional(),
    to: addressSchema,
    data: hexSchema.optional(),
    input: hexSchema.optional(),
  })
  .passthrough();

const blockVarianteSchema = z.union([
  hexSchema,
  z.literal('earliest'),
  z.literal('latest'),
  z.literal('safe'),
  z.literal('finalized'),
  z.literal('pending'),
]);

const eth_call: MethodHandler = {
  name: 'eth_call',
  async handle(
    context: RequestContext,
    method: string,
    params: unknown[],
    id: number | string,
  ): Promise<JSONLike> {
    const call = callReqSchema.parse(params[0]);
    const blockVariant = blockVarianteSchema.optional().parse(params[1]);

    if (
      call.from === undefined ||
      !isAddressEqual(call.from, context.currentUser)
    ) {
      throw new Error('Wrong caller');
    }

    const data = call.data || call.input;
    if (
      data &&
      !context.authorizer.checkContractRead(
        call.to,
        extractSelector(data),
        context.currentUser,
      )
    ) {
      throw new Error('Unhautorized');
    }

    return await delegateCall(
      context.targetRpcUrl,
      method,
      [call, blockVariant],
      id,
    );
  },
};

const whoAmI = {
  name: 'who_am_i',
  async handle(
    context: RequestContext,
    _method: string,
    _params: unknown[],
    _id: number | string,
  ) {
    return context.currentUser;
  },
};

const zks_sendRawTransactionWithDetailedOutput = {
  name: 'zks_sendRawTransactionWithDetailedOutput',
  async handle(
    context: RequestContext,
    method: string,
    params: unknown[],
    id: number | string,
  ) {
    const rawTx = hexSchema.parse(params[0]);
    const tx = parseTransaction(rawTx);
    const address = await recoverTransactionAddress({
      serializedTransaction: rawTx as any,
    });

    if (!isAddressEqual(address, context.currentUser)) {
      throw new Error('Wrong caller');
    }

    if (!tx.to) {
      throw new Error('no target');
    }

    if (
      tx.data &&
      !context.authorizer.checkContractWrite(
        tx.to,
        extractSelector(tx.data),
        context.currentUser,
      )
    ) {
      throw new Error('Unauthorized');
    }

    return delegateCall(context.targetRpcUrl, method, [rawTx], id);
  },
};

const eth_sendRawTransaction = {
  ...zks_sendRawTransactionWithDetailedOutput,
  name: 'eth_sendRawTransaction',
};

export const allHandlers = [
  eth_call,
  whoAmI,
  zks_sendRawTransactionWithDetailedOutput,
  eth_sendRawTransaction,
];
