import { BigNumber } from "ethers";
import { Transfer } from "../../transfer/transfer.entity";

export const mapTransferListItem = (transfer: Transfer, lastBlockNumber: number) => ({
  blockNumber: transfer.blockNumber.toString(),
  timeStamp: Math.floor(new Date(transfer.timestamp).getTime() / 1000).toString(),
  hash: transfer.transactionHash,
  nonce: transfer.transaction?.nonce.toString(),
  blockHash: transfer.transaction?.blockHash,
  transactionIndex: transfer.transaction?.transactionIndex.toString(),
  from: transfer.from,
  to: transfer.to,
  value: transfer.amount || undefined,
  tokenID: transfer.fields?.tokenId,
  tokenName: transfer.token?.name,
  tokenSymbol: transfer.token?.symbol,
  tokenDecimal: transfer.token?.decimals?.toString(),
  gas: transfer.transaction?.gasLimit,
  gasPrice: transfer.transaction?.gasPrice,
  input: transfer.transaction?.data,
  contractAddress: transfer.tokenAddress,
  cumulativeGasUsed: transfer.transaction?.transactionReceipt.cumulativeGasUsed,
  gasUsed: transfer.transaction?.transactionReceipt.gasUsed,
  confirmations: (lastBlockNumber - transfer.blockNumber).toString(),
  fee: transfer.transaction?.fee ? BigNumber.from(transfer.transaction.fee).toString() : undefined,
  l1BatchNumber: transfer.transaction?.l1BatchNumber.toString(),
  transactionType: transfer.transaction?.type.toString(),
});
