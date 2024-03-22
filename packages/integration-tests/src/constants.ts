import * as path from "path";

export enum Buffer {
  greeterL2 = "greeterL2.txt",
  executeGreeterTx = "executeGreeterTx.txt",
  NFTtoL1 = "NFTtoL1.txt",
  NFTtoL2 = "NFTtoL2.txt",
  L1 = "L1.txt",
  L2 = "L2.txt",
  L2deposited = "L2deposited.txt",
  paymaster = "paymaster.txt",
  paymasterDeployTx = "paymasterDeployTx.txt",
  paymasterTx = "paymasterTx.txt",
  addressMultiTransferETH = "multiTransferETH.txt",
  txMultiTransferETH = "txMultiTransferETH.txt",
  txMultiTransferCall = "txMultiTransferCall.txt",
  txMultiTransferCustomTokenI = "txMultiTransferCustomTokenI.txt",
  txMultiTransferCustomTokenII = "txMultiTransferCustomTokenII.txt",
  addressMultiCallMiddle = "multiCallMiddle.txt",
  addressMultiCallCaller = "multiCallCaller.txt",
  addressMultiCallRoot = "multiCallRoot.txt",
  txMultiCallMiddle = "txMultiCallMiddle.txt",
  txMultiCallCaller = "txMultiCallCaller.txt",
  txMultiCallRoot = "txmultiCallRoot.txt",
  txUseMultiCallContracts = "txUseMultiCallContracts.txt",
  txEthTransfer = "txEthTransfer.txt",
  txERC20Withdraw = "txERC20Withdraw.txt",
  txERC20WithdrawOtherAddress = "txERC20WithdrawOtherAddress.txt",
  txEthWithdraw = "txEthWithdraw.txt",
  txEthWithdrawOtherAddress = "txEthWithdrawOtherAddress.txt",
  txERC20Transfer = "txERC20Transfer.txt",
  emptyWalletPrivateKey = "emptyWalletPrivateKey.txt",
  emptyWalletAddress = "emptyWalletAddress.txt",
  failedState = "failedState.txt",
  customToken = "customToken.txt",
  txEthDeposit = "txEthDeposit.txt",
  txERC20Deposit = "txERC20Deposit.txt",
}

export const Path = {
  playbookRoot: path.join("src", "playbook"),
  absolutePathToBufferFiles: path.join(__dirname, "..", "src", "playbook", "buffer"),
};

export enum Logger {
  deposit = "DEPOSIT",
  withdraw = "WITHDRAW",
  transfer = "TRANSFER",
  txHashStartsWith = "0x",
  textSeparator = "======================= ",
  txFailedState = "FAILED STATE",
}

export enum Token {
  customL2TokenName = "L2 ERC20 token",
  customL2TokenSymbol = "L2",
  customL2TokenDecimals = 18,
  pullAddressETH = "0x0000000000000000000000000000000000008001",
  addressETH = "0x0000000000000000000000000000000000000000",
  ERC20AddressETH = "0x000000000000000000000000000000000000800A",
}

export enum TransactionsType {
  fee = "fee",
  transfer = "transfer",
  refund = "refund",
  withdrawal = "withdrawal",
}

export enum TransactionStatus {
  failed = "failed",
}

export enum Wallets {
  mainWalletAddress = "0x586607935E1462ab762F438E0A7b2968A4158975",
  secondaryWalletAddress = "0x26A4c5Dfe2cA3c9E7E8C417B689F41b6b5745C37",
  richWalletAddress = "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
  mainWalletPrivateKey = "0x06ac1584dd1cf69f97a784b2b7812cd0c65a867ec997add028cdf56483c1c299",
  secondaryWalletPrivateKey = "e14e6e0b3b610411cf15c3a5aa3252cac9e0a40a9bbe67ceb3b5d506f56576fd",
  richWalletPrivateKey = "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110",
}

export enum BlockExplorer {
  baseUrl = "http://localhost:3010",
  localNetwork = "/?network=local",
}

export enum Values {
  txSumETH = "0.000009",
}

export enum IncorrectValues {
  incorrectAddressFormat = "0xE4ce1da467a7Ca37727eb7e19857e5167DE25966123",
}
