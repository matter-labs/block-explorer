import { ref } from "vue";

import { $fetch, FetchError } from "ohmyfetch";

import useContext from "./useContext";

import type { TransactionLogEntry } from "./useEventLog";
import type { Hash, NetworkOrigin } from "@/types";
import type { types } from "zksync-ethers";

import { numberToHexString } from "@/utils/formatters";

export type TransactionStatus = "included" | "committed" | "proved" | "verified" | "failed" | "indexing";
type TokenInfo = {
  address: Hash;
  decimals: number;
  l1Address?: Hash;
  l2Address: Hash;
  name?: string;
  symbol: string;
  usdPrice?: number;
  liquidity?: number;
  iconURL?: string;
};

export type TokenTransfer = {
  amount: string | null;
  from: Hash;
  to: Hash;
  type: "fee" | "transfer" | "withdrawal" | "deposit" | "refund" | "mint";
  fromNetwork: NetworkOrigin;
  toNetwork: NetworkOrigin;
  tokenInfo?: TokenInfo;
};

export type TransactionDetails = types.TransactionDetails & {
  gasPerPubdata: string | null;
};

export type FeeData = {
  amountPaid: Hash;
  isPaidByPaymaster: boolean;
  paymasterAddress?: Hash;
  refunds: TokenTransfer[];
  amountRefunded: Hash;
};

export type TransactionItem = {
  hash: Hash;
  blockHash: Hash;
  blockNumber: number;
  value: string;
  data: {
    contractAddress: Hash;
    calldata: string;
    sighash: string;
    value: string;
  };
  from: string;
  to: string;
  ethCommitTxHash: Hash | null;
  ethExecuteTxHash: Hash | null;
  ethProveTxHash: Hash | null;
  fee: Hash;
  indexInBlock?: number;
  isL1Originated: boolean;
  nonce: null | number;
  receivedAt: string;
  feeData: FeeData;
  gasPrice: string;
  gasLimit: string;
  gasUsed: string;
  gasPerPubdata: string | null;
  maxFeePerGas: string | null;
  maxPriorityFeePerGas: string | null;
  status: TransactionStatus;
  l1BatchNumber: number | null;
  isL1BatchSealed: boolean;
  error?: string | null;
  revertReason?: string | null;
  logs: TransactionLogEntry[];
  transfers: TokenTransfer[];
};

export function getTransferNetworkOrigin(transfer: Api.Response.Transfer, sender: "from" | "to") {
  if (sender === "from") {
    return transfer.type === "deposit" ? "L1" : "L2";
  } else {
    return transfer.type === "withdrawal" ? "L1" : "L2";
  }
}

export default (context = useContext()) => {
  const transaction = ref(<null | TransactionItem>null);
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);

  const getFromBlockchainByHash = async (hash: string): Promise<TransactionItem | null> => {
    const provider = context.getL2Provider();
    try {
      const [transactionData, transactionDetails, transactionReceipt] = await Promise.all([
        provider.getTransaction(hash),
        provider.getTransactionDetails(hash),
        provider.getTransactionReceipt(hash),
      ]);
      if (!transactionData || !transactionDetails || !transactionReceipt) {
        return null;
      }
      if (transactionDetails.status === "pending") {
        return null;
      }
      const gasPerPubdata = (<TransactionDetails>transactionDetails).gasPerPubdata;
      return {
        hash: transactionData.hash,
        blockHash: transactionData.blockHash!,
        blockNumber: transactionData.blockNumber!,
        data: {
          contractAddress: transactionData.to!,
          calldata: transactionData.data,
          sighash: transactionData.data.slice(0, 10),
          value: transactionData.value.toString(),
        },
        value: transactionData.value.toString(),
        from: transactionData.from,
        to: transactionData.to!,
        ethCommitTxHash: transactionDetails.ethCommitTxHash ?? null,
        ethExecuteTxHash: transactionDetails.ethExecuteTxHash ?? null,
        ethProveTxHash: transactionDetails.ethProveTxHash ?? null,
        fee: transactionDetails.fee.toString(),
        feeData: {
          amountPaid: transactionDetails.fee.toString(),
          isPaidByPaymaster: false,
          refunds: [],
          amountRefunded: numberToHexString(0),
        },
        indexInBlock: transactionReceipt.index,
        isL1Originated: transactionDetails.isL1Originated,
        nonce: transactionData.nonce,
        receivedAt: new Date(transactionDetails.receivedAt).toJSON(),

        status: "indexing",
        l1BatchNumber: transactionData.l1BatchNumber,
        isL1BatchSealed: false,

        logs: transactionReceipt.logs.map((item) => ({
          address: item.address,
          blockNumber: item.blockNumber,
          data: item.data,
          logIndex: item.index.toString(16),
          topics: item.topics as string[],
          transactionHash: item.transactionHash,
          transactionIndex: item.transactionIndex.toString(16),
        })),
        transfers: [],

        gasPrice: transactionData.gasPrice!.toString(),
        gasLimit: transactionData.gasLimit.toString(),
        gasUsed: transactionReceipt.gasUsed.toString(),
        gasPerPubdata: gasPerPubdata ? BigInt(gasPerPubdata).toString() : null,
        maxFeePerGas: transactionData.maxFeePerGas?.toString() ?? null,
        maxPriorityFeePerGas: transactionData.maxPriorityFeePerGas?.toString() ?? null,
      };
    } catch (err) {
      return null;
    }
  };

  const getByHash = async (hash: string) => {
    isRequestPending.value = true;
    isRequestFailed.value = false;

    try {
      const [txResponse, txTransfers, txLogs] = await Promise.all([
        $fetch<Api.Response.Transaction>(`${context.currentNetwork.value.apiUrl}/transactions/${hash}`),
        all<Api.Response.Transfer>(
          new URL(`${context.currentNetwork.value.apiUrl}/transactions/${hash}/transfers?limit=100`)
        ),
        all<Api.Response.Log>(new URL(`${context.currentNetwork.value.apiUrl}/transactions/${hash}/logs?limit=100`)),
      ]);
      transaction.value = mapTransaction(txResponse, txTransfers, txLogs);
    } catch (error) {
      if (error instanceof FetchError && error.response?.status === 404) {
        transaction.value = await getFromBlockchainByHash(hash);
        return;
      }
      transaction.value = null;
      if (!(error instanceof FetchError)) {
        isRequestFailed.value = true;
      }
    } finally {
      isRequestPending.value = false;
    }
  };

  return {
    transaction,
    isRequestPending,
    isRequestFailed,
    getByHash,
  };
};

export function mapTransaction(
  transaction: Api.Response.Transaction,
  transfers: Api.Response.Transfer[],
  logs: Api.Response.Log[]
): TransactionItem {
  const fees = mapTransfers(filterFees(transfers));
  const refunds = mapTransfers(filterRefunds(transfers));
  const paymasterFee = fees.find((fee) => fee.from !== transaction.from);
  const paymasterAddress = paymasterFee?.from;
  const isPaidByPaymaster = !transaction.isL1Originated && !!paymasterFee;
  return {
    hash: transaction.hash,
    blockHash: transaction.blockHash,
    blockNumber: transaction.blockNumber,
    data: {
      contractAddress: transaction.to,
      calldata: transaction.data,
      sighash: transaction.data.slice(0, 10),
      value: transaction.value,
    },
    value: transaction.value,
    from: transaction.from,
    to: transaction.to,
    ethCommitTxHash: transaction.commitTxHash ?? null,
    ethExecuteTxHash: transaction.executeTxHash ?? null,
    ethProveTxHash: transaction.proveTxHash ?? null,
    fee: transaction.fee,
    feeData: {
      amountPaid: transaction.fee!,
      isPaidByPaymaster,
      paymasterAddress: isPaidByPaymaster ? paymasterAddress : undefined,
      refunds,
      amountRefunded: sumAmounts(mapTransfers(filterRefunds(transfers))),
    },
    indexInBlock: transaction.transactionIndex,
    // initiatorAddress: Hash;
    isL1Originated: transaction.isL1Originated,
    nonce: transaction.nonce,
    receivedAt: transaction.receivedAt,

    status: transaction.status,
    l1BatchNumber: transaction.l1BatchNumber,
    isL1BatchSealed: transaction.isL1BatchSealed,
    error: transaction.error,
    revertReason: transaction.revertReason,

    logs: logs.map((item) => ({
      address: item.address,
      blockNumber: item.blockNumber,
      data: item.data,
      logIndex: item.logIndex.toString(16),
      topics: item.topics,
      transactionHash: item.transactionHash!,
      transactionIndex: item.transactionIndex.toString(16),
    })),

    transfers: mapTransfers(filterTransfers(transfers)),

    gasPrice: transaction.gasPrice,
    gasLimit: transaction.gasLimit,
    gasUsed: transaction.gasUsed,
    gasPerPubdata: transaction.gasPerPubdata,
    maxFeePerGas: transaction.maxFeePerGas,
    maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
  };
}

function mapTransfers(transfers: Api.Response.Transfer[]): TokenTransfer[] {
  return transfers.map((item) => ({
    amount: item.amount,
    from: item.from,
    to: item.to,
    fromNetwork: getTransferNetworkOrigin(item, "from"),
    toNetwork: getTransferNetworkOrigin(item, "to"),
    type: item.type,
    tokenInfo: {
      address: item.tokenAddress,
      l1Address: item.token?.l1Address,
      l2Address: item.tokenAddress,
      decimals: item.token?.decimals || 0,
      name: item.token?.name,
      symbol: item.token?.symbol,
      usdPrice: item.token?.usdPrice,
      liquidity: item.token?.liquidity,
      iconURL: item.token?.iconURL,
    } as TokenInfo,
  }));
}

function sumAmounts(balanceChanges: TokenTransfer[]) {
  const total = balanceChanges.reduce((acc, cur) => acc + BigInt(cur.amount || 0), BigInt(0));
  return numberToHexString(total) as Hash;
}

export function filterRefunds(transfers: Api.Response.Transfer[]) {
  return transfers.filter((item) => item.type === "refund");
}

export function filterFees(transfers: Api.Response.Transfer[]) {
  return transfers.filter((item) => item.type === "fee");
}

export function filterTransfers(transfers: Api.Response.Transfer[]) {
  return transfers.filter((item) => item.type !== "fee" && item.type !== "refund");
}

async function all<T>(url: URL): Promise<T[]> {
  const collection: T[] = [];
  const limit = 100;
  url.searchParams.set("page", "1");
  url.searchParams.set("limit", limit.toString());
  for (let page = 1; page < 100; page++) {
    url.searchParams.set("page", page.toString());
    const response = await $fetch<Api.Response.Collection<T>>(url.toString());

    if (!response.items.length) {
      break;
    }
    collection.push(...response.items);

    if (limit > response.items.length) {
      break;
    }
  }

  return collection;
}
