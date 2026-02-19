export interface InternalTransaction {
  transactionHash: string;
  blockNumber: number;
  from: string;
  to?: string;
  value: string;
  gas?: string;
  gasUsed?: string;
  input?: string;
  output?: string;
  type: string;
  callType?: string;
  traceAddress: string;
  traceIndex: number;
  error?: string;
  timestamp: string;
}
