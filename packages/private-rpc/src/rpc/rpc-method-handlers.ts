import { MethodHandler } from '@/rpc/rpc-service';
import {
  Hex,
  isAddressEqual,
  parseTransaction,
  recoverTransactionAddress,
} from 'viem';
import { z } from 'zod';
import { hexSchema } from '@/schemas/hex';
import { addressSchema } from '@/schemas/address';
import { invalidRequest, response, unauthorized } from './json-rpc';
import { delegateCall } from './delegate-call';

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

const eth_call: MethodHandler = {
  name: 'eth_call',
  async handle(context, method, params, id) {
    const call = callReqSchema.parse(params[0]);

    if (
      call.from === undefined ||
      !isAddressEqual(call.from, context.currentUser)
    ) {
      return unauthorized(id);
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
      return unauthorized(id);
    }

    return delegateCall({ url: context.targetRpcUrl, id, method, params });
  },
};

const whoAmI: MethodHandler = {
  name: 'who_am_i',
  async handle(context, _method, _params, id) {
    return response({ id, result: context.currentUser });
  },
};

const zks_sendRawTransactionWithDetailedOutput: MethodHandler = {
  name: 'zks_sendRawTransactionWithDetailedOutput',
  async handle(context, method, params, id) {
    const rawTx = hexSchema.parse(params[0]);
    const tx = parseTransaction(rawTx);
    const address = await recoverTransactionAddress({
      serializedTransaction: rawTx as any,
    });

    if (!isAddressEqual(address, context.currentUser)) {
      return unauthorized(id, 'Cannot impersonate other users');
    }

    if (!tx.to) {
      return invalidRequest(id);
    }

    if (
      tx.data &&
      !context.authorizer.checkContractWrite(
        tx.to,
        extractSelector(tx.data),
        context.currentUser,
      )
    ) {
      return unauthorized(id);
    }

    return delegateCall({
      url: context.targetRpcUrl,
      id,
      method,
      params: [rawTx],
    });
  },
};

const eth_sendRawTransaction: MethodHandler = {
  ...zks_sendRawTransactionWithDetailedOutput,
  name: 'eth_sendRawTransaction',
};

export const allHandlers = [
  eth_call,
  whoAmI,
  zks_sendRawTransactionWithDetailedOutput,
  eth_sendRawTransaction,
];
