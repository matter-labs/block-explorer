import {
  Address,
  Hex,
  isAddressEqual,
  parseTransaction,
  recoverTransactionAddress,
} from 'viem';
import { JsonValue } from 'typed-rpc/server';
import { RulesType } from '@/permissions';

class RpcError extends Error {
  private code: number;
  private data: unknown;

  constructor(code: number, message: string, data: unknown) {
    super('rpc error');
    this.code = code;
    this.message = message;
    this.data = data;
  }

  getErrorCode(): number {
    return this.code;
  }

  getErrorMessage(): string {
    return this.message;
  }

  getErrorData(): unknown {
    return this.data;
  }
}

async function doRpcRequest(
  url: string,
  method: string,
  params: unknown[] = [],
): Promise<JsonValue> {
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });

  if (!res.ok) {
    const errorBody = await res.json();
    throw new RpcError(
      errorBody?.error?.code,
      errorBody?.error?.message,
      errorBody?.error?.data,
    );
  }

  const body = await res.json();
  return body?.result;
}

type CallRequest = {
  from: Address;
  to: Address;
  gas: number;
  gas_price: number;
  max_fee_per_gas: number;
  max_priority_fee_per_gas: number;
  value: number;
  data: Hex;
  input: Hex;
  nonce: Hex;
  transaction_type: number;
  access_list: unknown;
  customData: unknown;
};

export class RpcService {
  private currentUser: Address;
  private targetRpc: string;
  private rules: RulesType;

  constructor(currentUser: Address, targetRpc: string, rules: RulesType) {
    this.currentUser = currentUser;
    this.targetRpc = targetRpc;
    this.rules = rules;
  }

  who_am_i() {
    return this.currentUser;
  }

  zks_L1BatchNumber() {
    return doRpcRequest(this.targetRpc, 'zks_L1BatchNumber', []);
  }

  eth_call(call: CallRequest, blockVariant: unknown) {
    if (
      call.from === undefined ||
      !isAddressEqual(call.from, this.currentUser)
    ) {
      throw new Error('Wrong caller');
    }

    if (!this.rules[call.to]?.canRead(this.currentUser, call.data)) {
      throw new Error('Unhautorized');
    }

    return doRpcRequest(this.targetRpc, 'eth_call', [call, blockVariant]);
  }

  async zks_sendRawTransactionWithDetailedOutput(rawTx: Hex) {
    const tx = parseTransaction(rawTx);
    const address = await recoverTransactionAddress({
      serializedTransaction: rawTx as any,
    });

    if (!isAddressEqual(address, this.currentUser)) {
      throw new Error('Wrong caller');
    }

    if (!tx.to || !tx.data) {
      throw new Error('no target or no data');
    }

    if (!this.rules[tx.to]?.canWrite(this.currentUser, tx.data)) {
      throw new Error('Unhautorized');
    }

    return doRpcRequest(
      this.targetRpc,
      'zks_sendRawTransactionWithDetailedOutput',
      [rawTx],
    );
  }

  async eth_sendRawTransaction(rawTx: Hex) {
    const tx = parseTransaction(rawTx);
    const address = await recoverTransactionAddress({
      serializedTransaction: rawTx as any,
    });

    if (!isAddressEqual(address, this.currentUser)) {
      throw new Error('Wrong caller');
    }

    if (!tx.to || !tx.data) {
      throw new Error('no target or no data');
    }

    if (!this.rules[tx.to]?.canWrite(this.currentUser, tx.data)) {
      throw new Error('Unhautorized');
    }

    return doRpcRequest(this.targetRpc, 'eth_sendRawTransaction', [rawTx]);
  }
}
