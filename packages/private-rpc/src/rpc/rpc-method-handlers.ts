import {
  delegateCall,
  JSONLike,
  MethodHandler,
  RequestContext,
} from '@/rpc/rpc-service-2';
import {
  isAddressEqual,
  parseTransaction,
  recoverTransactionAddress,
} from 'viem';
import { z } from 'zod';
import { hexSchema } from '@/db/hex-row';

const callReqSchema = z.object({
  from: hexSchema.optional(),
  to: hexSchema,
  gas: hexSchema.optional(),
  gas_price: hexSchema.optional(),
  max_fee_per_gas: hexSchema.optional(),
  max_priority_fee_per_gas: z.number().optional(),
  value: hexSchema.optional(),
  data: hexSchema.optional(),
  input: hexSchema.optional(),
  nonce: hexSchema.optional(),
  transaction_type: z.number().optional(),
  access_list: z.any().optional(),
  customData: z.any().optional(),
});
// type CallRequest = z.infer<typeof callReqSchema>;

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

    if (call.data === undefined) {
      return delegateCall(
        context.targetRpcUrl,
        method,
        [call, blockVariant],
        id,
      );
    }

    if (
      !context.rules[call.to]?.canRead(context.currentUser, call.data ?? '0x')
    ) {
      throw new Error('Unhautorized');
    }

    const jsonLikePromise = await delegateCall(
      context.targetRpcUrl,
      method,
      [call, blockVariant],
      id,
    );
    return jsonLikePromise;
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

    if (!tx.to || !tx.data) {
      throw new Error('no target or no data');
    }

    if (!context.rules[tx.to]?.canWrite(context.currentUser, tx.data)) {
      throw new Error('Unhautorized');
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
