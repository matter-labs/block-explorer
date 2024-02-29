export enum Buffer {
  greeterL2 = "./buffer/greeterL2.txt",
  executeGreeterTx = "./buffer/executeGreeterTx.txt",
  NFTtoL1 = "./buffer/NFTtoL1.txt",
  NFTtoL2 = "./buffer/NFTtoL2.txt",
  L1 = "./buffer/L1.txt",
  L2 = "./buffer/L2.txt",
  L2deposited = "./buffer/L2deposited.txt",
  paymaster = "./buffer/paymaster.txt",
  paymasterDeployTx = "./buffer/paymasterDeployTx.txt",
  paymasterTx = "./buffer/paymasterTx.txt",
  addressMultiTransferETH = "./buffer/multiTransferETH.txt",
  txMultiTransferETH = "./buffer/txMultiTransferETH.txt",
  txMultiTransferCustomTokenI = "./buffer/txMultiTransferCustomTokenI.txt",
  txMultiTransferCustomTokenII = "./buffer/txMultiTransferCustomTokenII.txt",
  addressMultiCallMiddle = "./buffer/multiCallMiddle.txt",
  addressMultiCallCaller = "./buffer/multiCallCaller.txt",
  addressMultiCallRoot = "./buffer/multiCallRoot.txt",
  txMultiCallMiddle = "./buffer/txMultiCallMiddle.txt",
  txMultiCallCaller = "./buffer/txMultiCallCaller.txt",
  txMultiCallRoot = "./buffer/txmultiCallRoot.txt",
  txUseMultiCallContracts = "./buffer/txUseMultiCallContracts.txt",
  txEthTransfer = "./buffer/txEthTransfer.txt",
  txERC20Withdraw = "./buffer/txERC20Withdraw.txt",
  txERC20WithdrawOtherAddress = "./buffer/txERC20WithdrawOtherAddress.txt",
  txEthWithdraw = "./buffer/txEthWithdraw.txt",
  txEthWithdrawOtherAddress = "./buffer/txEthWithdrawOtherAddress.txt",
  txERC20Transfer = "./buffer/txERC20Transfer.txt",
  emptyWalletPrivateKey = "./buffer/emptyWalletPrivateKey.txt",
  emptyWalletAddress = "./buffer/emptyWalletAddress.txt",
  failedState = "./buffer/failedState.txt",
  customToken = "./buffer/customToken.txt",
}

export enum Logger {
  deposit = "DEPOSIT",
  withdraw = "WITHDRAW",
  transfer = "TRANSFER",
  txHashStartsWith = "0x",
  textSeparator = "======================= ",
  txFailedState = "FAILED STATE",
}

export enum Token {
  CUST_Address = "0x0928008B245A76E105E02C522b5d309c0887ecA5",
  customL2TokenName = "L2 ERC20 token",
  customL2TokenSymbol = "L2",
  customL2TokenDecimals = 18,
  ETHER_PULL_Address = "0x0000000000000000000000000000000000008001",
  ETHER_Address = "0x0000000000000000000000000000000000000000",
  ETHER_ERC20_Address = "0x000000000000000000000000000000000000800A",
}

export enum TransactionsType {
  fee = "fee",
  transfer = "transfer",
  refund = "refund",
  withdrawal = "withdrawal",
}

export enum TransactionsStatus {
  failed = "failed",
}

export enum Wallets {
  mainWalletAddress = "0x586607935E1462ab762F438E0A7b2968A4158975",
  secondWalletAddress = "0x26A4c5Dfe2cA3c9E7E8C417B689F41b6b5745C37",
  richWalletAddress = "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
  mainWalletPrivateKey = "0x06ac1584dd1cf69f97a784b2b7812cd0c65a867ec997add028cdf56483c1c299",
  secondWalletPrivateKey = "e14e6e0b3b610411cf15c3a5aa3252cac9e0a40a9bbe67ceb3b5d506f56576fd",
  richWalletPrivateKey = "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110",
}

export enum BlockExplorer {
  baseUrl = "http://localhost:3010",
  localNetwork = "/?network=local",
}

export enum CustomValue {
  txSumEth = 0.000009,
}
