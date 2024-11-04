export const rpcService = {
  zks_estimateFee(
    txData: {
      from: string;
      to: string;
      gas: string;
      gas_price: string;
      max_fee_per_gas: string;
      max_priority_fee_per_gas: string;
      value: string;
      data: string;
      input: string;
      nonce: string;
      transaction_type: string;
      access_list: string;
      customData: string;
    },
  ) {
    return txData
  },
};
