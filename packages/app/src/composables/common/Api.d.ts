declare namespace Api {
  namespace Response {
    type Collection<T> = {
      items: T[];
      meta: {
        currentPage: number;
        itemCount: number;
        itemsPerPage: number;
        totalItems: number;
        totalPages: number;
      };
      links: {
        first: string;
        last: string;
        next: string;
        previous: string;
      };
    };

    type Token = {
      l2Address: string;
      l1Address: string | null;
      name: string | null;
      symbol: string | null;
      decimals: number;
      usdPrice: number | null;
      liquidity: number | null;
      iconURL: string | null;
    };

    type BatchListItem = {
      number: string;
      timestamp: string;
      rootHash?: string | null;
      executedAt: string | null;
      status: "sealed" | "verified";
      l1TxCount: number;
      l2TxCount: number;
      size: number;
    };

    type BatchDetails = {
      number: string;
      timestamp: string;
      rootHash?: string | null;
      executedAt: string | null;
      status: "sealed" | "verified";
      l1TxCount: number;
      l2TxCount: number;
      size: number;
      commitTxHash: string | null;
      proveTxHash: string | null;
      executeTxHash: string | null;
      committedAt: string | null;
      provenAt: string | null;
      l1GasPrice: string;
      l2FairGasPrice: string;
    };

    type Log = {
      address: string;
      topics: string[];
      data: string;
      blockNumber: number;
      transactionHash: string | null;
      transactionIndex: number;
      logIndex: number;
    };

    type Transaction = {
      hash: string;
      to: string;
      from: string;
      transactionIndex: number;
      data: string;
      value: string;
      fee: string;
      nonce: number;
      blockNumber: number;
      blockHash: string;
      gasPrice: string;
      gasLimit: string;
      gasUsed: string;
      gasPerPubdata: string | null;
      maxFeePerGas: string | null;
      maxPriorityFeePerGas: string | null;
      receivedAt: string;
      commitTxHash: string | null;
      proveTxHash: string | null;
      executeTxHash: string | null;
      isL1Originated: boolean;
      l1BatchNumber: number | null;
      isL1BatchSealed: boolean;
      status: "included" | "committed" | "proved" | "verified" | "failed";
      error: string | null;
      revertReason: string | null;
    };

    type Transfer = {
      from: string;
      to: string;
      blockNumber: number;
      transactionHash: string | null;
      amount: string | null;
      token: Token | null;
      tokenAddress: string;
      type: "deposit" | "transfer" | "withdrawal" | "fee" | "mint" | "refund";
      timestamp: string;
    };

    type TokenAddress = {
      balance: string;
      token: null | Token;
    };

    type Balances = {
      [tokenAddress: string]: TokenAddress;
    };

    type Account = {
      type: "account";
      address: string;
      blockNumber: number;
      balances: Balances;
      sealedNonce: number;
      verifiedNonce: number;
    };

    type Contract = {
      type: "contract";
      address: string;
      blockNumber: number;
      balances: Balances;
      bytecode: string;
      creatorAddress: string;
      creatorTxHash: string;
      createdInBlockNumber: number;
      totalTransactions: number;
    };
  }
}
