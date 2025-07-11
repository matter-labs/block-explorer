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
    // called contract address if any
    contractAddress: Hash | null;
    calldata: string;
    sighash: string;
    value: string;
  };
  from: string;
  to: string | null;
  ethCommitTxHash: Hash | null;
  ethExecuteTxHash: Hash | null;
  ethProveTxHash: Hash | null;
  commitChainId: number | null;
  proveChainId: number | null;
  executeChainId: number | null;
  // Gateway Ethereum transaction hashes (when Era -> Gateway -> Ethereum)
  gatewayEthCommitTxHash: Hash | null;
  gatewayEthExecuteTxHash: Hash | null;
  gatewayEthProveTxHash: Hash | null;
  gatewayEthCommitChainId: number | null;
  gatewayEthProveChainId: number | null;
  gatewayEthExecuteChainId: number | null;
  // Gateway transaction status to determine Ethereum status correctly
  gatewayStatus: TransactionStatus | null;
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
  // If transaction is EVM-like (destination address is not present)
  isEvmLike: boolean;
  // Deployed contract address if any
  contractAddress: string | null;
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

  // Helper function to check if current network supports Gateway and if transaction uses Gateway settlement
  const shouldFetchEthereumData = (tx: TransactionItem): boolean => {
    if (!context.currentNetwork.value.settlementChains?.length) {
      return false;
    }

    // Find Gateway settlement chain
    const gatewayChain = context.currentNetwork.value.settlementChains.find((chain) => chain.name === "Gateway");

    if (!gatewayChain) {
      return false;
    }

    // Check if transaction uses Gateway settlement (any of the chainIds match Gateway)
    return (
      tx.commitChainId === gatewayChain.chainId ||
      tx.proveChainId === gatewayChain.chainId ||
      tx.executeChainId === gatewayChain.chainId
    );
  };

  // Helper function to get Gateway API URL from settlement chain configuration
  const getGatewayApiUrl = (gatewayChain: any): string => {
    // If apiUrl is configured, use it directly (preferred approach)
    if (gatewayChain.apiUrl) {
      return gatewayChain.apiUrl;
    }

    // Fallback: derive from explorer URL for backward compatibility
    const explorerUrl = gatewayChain.explorerUrl;
    try {
      const url = new URL(explorerUrl);

      // Only allow zksync.io domains
      if (!url.hostname.endsWith(".zksync.io")) {
        throw new Error(`Unsupported domain: ${url.hostname}`);
      }

      // Known URL mappings for Gateway
      if (url.hostname === "sepolia.gateway.explorer.zksync.io") {
        return "https://block-explorer.era-gateway-testnet.zksync.dev";
      } else if (url.hostname === "gateway.explorer.zksync.io") {
        return "https://block-explorer-api.era-gateway-mainnet.zksync.dev";
      }

      throw new Error(`No API URL configured for Gateway chain: ${explorerUrl}`);
    } catch (error) {
      console.warn("Failed to get Gateway API URL:", error);
      throw new Error(`Invalid Gateway configuration: ${explorerUrl}`);
    }
  };

  // Function to fetch Ethereum transaction data from Gateway API
  const fetchEthereumDataFromGateway = async (tx: TransactionItem): Promise<Partial<TransactionItem> | null> => {
    try {
      if (!context.currentNetwork.value.settlementChains?.length) {
        return null;
      }

      const gatewayChain = context.currentNetwork.value.settlementChains.find((chain) => chain.name === "Gateway");

      if (!gatewayChain || !tx.ethCommitTxHash) {
        return null;
      }

      let gatewayApiUrl: string;
      try {
        gatewayApiUrl = getGatewayApiUrl(gatewayChain);
      } catch (error) {
        console.warn("Failed to get Gateway API URL:", error);
        return null;
      }

      // Fetch Gateway transaction data using the Era transaction's commit hash
      const gatewayTxResponse = await $fetch<Api.Response.Transaction>(
        `${gatewayApiUrl}/transactions/${tx.ethCommitTxHash}`
      );

      // Find Ethereum settlement chain from current network's settlementChains
      const ethereumChain = context.currentNetwork.value.settlementChains.find((chain) => chain.name === "Ethereum");

      if (!ethereumChain) {
        return null;
      }

      return {
        gatewayEthCommitTxHash: gatewayTxResponse.commitTxHash,
        gatewayEthProveTxHash: gatewayTxResponse.proveTxHash,
        gatewayEthExecuteTxHash: gatewayTxResponse.executeTxHash,
        gatewayEthCommitChainId: ethereumChain.chainId,
        gatewayEthProveChainId: ethereumChain.chainId,
        gatewayEthExecuteChainId: ethereumChain.chainId,
        // Include the Gateway transaction status to determine Ethereum status correctly
        gatewayStatus: gatewayTxResponse.status,
      };
    } catch (error) {
      console.warn("Failed to fetch Ethereum data from Gateway API:", error);
      return null;
    }
  };

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
      const tx = {
        hash: transactionData.hash,
        blockHash: transactionData.blockHash!,
        blockNumber: transactionData.blockNumber!,
        data: {
          contractAddress: transactionData.to,
          calldata: transactionData.data,
          sighash: transactionData.data.slice(0, 10),
          value: transactionData.value.toString(),
        },
        value: transactionData.value.toString(),
        from: transactionData.from,
        to: transactionData.to,
        ethCommitTxHash: transactionDetails.ethCommitTxHash ?? null,
        ethExecuteTxHash: transactionDetails.ethExecuteTxHash ?? null,
        ethProveTxHash: transactionDetails.ethProveTxHash ?? null,
        // Setting chain ids to null initially as API doesn't return them for transaction.
        commitChainId: null,
        proveChainId: null,
        executeChainId: null,
        // Gateway Ethereum transaction hashes (initially null, will be fetched separately)
        gatewayEthCommitTxHash: null,
        gatewayEthExecuteTxHash: null,
        gatewayEthProveTxHash: null,
        gatewayEthCommitChainId: null,
        gatewayEthProveChainId: null,
        gatewayEthExecuteChainId: null,
        gatewayStatus: null,
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

        status: "indexing" as TransactionStatus,
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
        isEvmLike: !transactionData.to,
        contractAddress: transactionReceipt.contractAddress,
      };

      // Fetch batch to get commit/prove/execute chain ids if at least commit tx hash present
      if (tx.ethCommitTxHash && tx.l1BatchNumber !== null) {
        const batchDetails = (await provider.getL1BatchDetails(tx.l1BatchNumber)) as types.BatchDetails & {
          commitChainId: null;
          proveChainId: null;
          executeChainId: null;
        };
        if (batchDetails) {
          tx.commitChainId = batchDetails.commitChainId;
          tx.proveChainId = batchDetails.proveChainId;
          tx.executeChainId = batchDetails.executeChainId;
        }
      }
      return tx;
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

      // Fetch Ethereum data from Gateway if transaction uses Gateway settlement
      if (transaction.value && shouldFetchEthereumData(transaction.value)) {
        const ethereumData = await fetchEthereumDataFromGateway(transaction.value);
        if (ethereumData) {
          transaction.value = { ...transaction.value, ...ethereumData };
        }
      }
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
    commitChainId: transaction.commitChainId ?? null,
    proveChainId: transaction.proveChainId ?? null,
    executeChainId: transaction.executeChainId ?? null,
    // Gateway Ethereum transaction hashes (not available from API yet, will be fetched separately)
    gatewayEthCommitTxHash: null,
    gatewayEthExecuteTxHash: null,
    gatewayEthProveTxHash: null,
    gatewayEthCommitChainId: null,
    gatewayEthProveChainId: null,
    gatewayEthExecuteChainId: null,
    gatewayStatus: null,
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
    logs: logs.map((log) => ({
      address: log.address,
      blockNumber: log.blockNumber,
      data: log.data,
      logIndex: log.logIndex.toString(),
      topics: log.topics as string[],
      transactionHash: log.transactionHash || "",
      transactionIndex: log.transactionIndex.toString(),
    })),
    transfers: mapTransfers(transfers),
    gasPrice: transaction.gasPrice,
    gasLimit: transaction.gasLimit,
    gasUsed: transaction.gasUsed,
    gasPerPubdata: transaction.gasPerPubdata,
    maxFeePerGas: transaction.maxFeePerGas,
    maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
    isEvmLike: !transaction.to,
    contractAddress: transaction.contractAddress,
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
