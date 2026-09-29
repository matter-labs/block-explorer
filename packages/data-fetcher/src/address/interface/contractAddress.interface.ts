export interface ContractAddress {
  address: string;
  blockNumber: number;
  transactionHash: string;
  creatorAddress: string;
  deployerAddress?: string;
  logIndex: number;
  bytecode?: string;
  isEvmLike: boolean;
}
