import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mock } from "jest-mock-extended";
import { AbiCoder, Interface, Log, Block, TransactionReceipt } from "ethers";
//import { types } from "zksync-ethers";
import { BlockchainService } from "../blockchain/blockchain.service";
import { TransferService, TransferType } from "./transfer.service";
import { L2_ASSET_ROUTER_ADDRESS } from "../constants";
// import { TokenType } from "../token/token.service";

// import * as ethDepositNoFee from "../../test/transactionReceipts/eth/deposit-no-fee.json";
// import * as ethDepositZeroValue from "../../test/transactionReceipts/eth/deposit-zero-value.json";
// import * as ethDeposit from "../../test/transactionReceipts/eth/deposit.json";
// import * as ethDepositToDifferentAddress from "../../test/transactionReceipts/eth/deposit-to-different-address.json";
// import * as ethTransfer from "../../test/transactionReceipts/eth/transfer.json";
// import * as ethTransferToZeroAddress from "../../test/transactionReceipts/eth/transfer-to-zero-address.json";
// import * as ethWithdrawal from "../../test/transactionReceipts/eth/withdrawal.json";
// import * as ethWithdrawalZeroValue from "../../test/transactionReceipts/eth/withdrawal-zero-value.json";
// import * as ethWithdrawalToDifferentAddress from "../../test/transactionReceipts/eth/withdrawal-to-different-address.json";

// import * as erc20BridgeDepositFromL1 from "../../test/transactionReceipts/erc20/bridge-deposit-from-l1.json";
// import * as erc20BridgeDepositFromL1ToDifferentAddress from "../../test/transactionReceipts/erc20/bridge-deposit-from-l1-to-different-address.json";
// import * as erc20DeployToL2 from "../../test/transactionReceipts/erc20/deploy-l2.json";
// import * as erc20Transfer from "../../test/transactionReceipts/erc20/transfer.json";
// import * as erc20Withdrawal from "../../test/transactionReceipts/erc20/withdrawal.json";

// import * as failedErc20Transfer from "../../test/transactionReceipts/failedTx/erc20-transfer-to-zero-address.json";
// import * as txWithNoLogs from "../../test/transactionReceipts/tx-with-no-logs.json";

// import * as greeterDeployToL2 from "../../test/transactionReceipts/greeter/deploy-to-l2.json";
// import * as greeterSetGreeting from "../../test/transactionReceipts/greeter/exec-set-greeting.json";

// import * as multiTransfer from "../../test/transactionReceipts/multiTransfer/eth-usdc-erc20-transfer.json";
// import * as multiTransferThroughPaymaster from "../../test/transactionReceipts/multiTransfer/eth-usdc-erc20-through-paymaster.json";
// import * as multiEthTransfer from "../../test/transactionReceipts/multiTransfer/multi-eth-transfer.json";

// import * as subCallsToOtherContracts from "../../test/transactionReceipts/nestedContractsCalls/sub-calls-to-other-contracts.json";

// import * as nftDeploy from "../../test/transactionReceipts/nft/deploy-l2.json";
// import * as nftMint from "../../test/transactionReceipts/nft/mint.json";
// import * as nftApprove from "../../test/transactionReceipts/nft/approve.json";
// import * as nftTransfer from "../../test/transactionReceipts/nft/transfer.json";

// import * as paymasterTransfer from "../../test/transactionReceipts/paymasters/transfer.json";

// import * as preApprovedErc20Deposit from "../../test/transactionReceipts/pre-approved-erc20/deposit.json";
// import * as preApprovedErc20Withdrawal from "../../test/transactionReceipts/pre-approved-erc20/withdrawal.json";
// import * as preApprovedErc20WithdrawalToDifferentAddress from "../../test/transactionReceipts/pre-approved-erc20/withdrawal-to-diff-address.json";
// import * as preApprovedErc20Transfer from "../../test/transactionReceipts/pre-approved-erc20/transfer.json";

// import * as noMatchingHandlers from "../../test/transactionReceipts/no-matching-handlers.json";
// import * as addressOutOfRange from "../../test/transactionReceipts/address-out-of-range.json";
// import * as logParsingError from "../../test/transactionReceipts/log-parsing-error.json";
// import * as noDepositAfterFee from "../../test/transactionReceipts/no-deposit-after-fee.json";
// import * as feeWithNoDeposits from "../../test/transactionReceipts/fee-with-no-deposits.json";
// import * as blockWithNoTxsLogs from "../../test/logs/block-with-no-txs-logs.json";

jest.mock("../logger", () => ({
  default: {
    log: jest.fn(),
    error: jest.fn(),
  },
}));

//const toTxReceipt = (receipt: any): types.TransactionReceipt => receipt as types.TransactionReceipt;

// Test utils for legacy/Asset Router transfer deduplication: independent bridge actions in one
// transaction must be preserved, while a genuine double-emit collapses into a single record.

const abi = AbiCoder.defaultAbiCoder();

const iface = new Interface([
  "event WithdrawalInitiated(address indexed l2Sender, address indexed l1Receiver, address indexed l2Token, uint256 amount)",
  "event WithdrawalInitiatedAssetRouter(uint256 chainId, address indexed l2Sender, bytes32 indexed assetId, bytes assetData)",
  "event FinalizeDeposit(address indexed l1Sender, address indexed l2Receiver, address indexed l2Token, uint256 amount)",
  "event DepositFinalizedAssetRouter(uint256 indexed chainId, bytes32 indexed assetId, bytes assetData)",
]);

const TX_HASH = "0x9cf4c8deca577bda1adcd4285e2f284321594737bcbe71bbd9baec1838e566ca";
// Trusted legacy custom bridge (Lido wstETH bridge from the report).
const LEGACY_BRIDGE = "0xE1D6A50E7101c8f8db77352897Ee3f1AC53f782B";

const SENDER = "0x1111111111111111111111111111111111111111";
const RECEIVER = "0x2222222222222222222222222222222222222222";

const TOKEN_LEGACY = "0x703b52f2b28febcb60e1372858af5b18849fe867"; // e.g. wstETH
const TOKEN_ASSET_ROUTER = "0xa0806da7835a4e63db2ce44a2b622ef8b73b5db5"; // e.g. STORJ

const ASSET_ID_AR = "0x" + "a1".repeat(32);
const ASSET_ID_DUP = "0x" + "b2".repeat(32);

const EXTRA_ADDRESS = "0x3333333333333333333333333333333333333333";

let logIndexCounter = 0;
function makeLog(eventName: string, values: unknown[], address: string): Log {
  const { data, topics } = iface.encodeEventLog(eventName, values);
  return mock<Log>({
    transactionIndex: 0,
    blockNumber: 1,
    transactionHash: TX_HASH,
    address,
    topics: [...topics],
    data,
    index: logIndexCounter++,
    blockHash: "0x" + "0".repeat(64),
  });
}

const legacyWithdrawalLog = (l2Token: string, amount: bigint) =>
  makeLog("WithdrawalInitiated", [SENDER, RECEIVER, l2Token, amount], LEGACY_BRIDGE);

const assetRouterWithdrawalLog = (assetId: string, amount: bigint) =>
  makeLog(
    "WithdrawalInitiatedAssetRouter",
    [BigInt(1), SENDER, assetId, abi.encode(["uint256", "address", "address"], [amount, RECEIVER, EXTRA_ADDRESS])],
    L2_ASSET_ROUTER_ADDRESS
  );

const legacyDepositLog = (l2Token: string, amount: bigint) =>
  makeLog("FinalizeDeposit", [SENDER, RECEIVER, l2Token, amount], LEGACY_BRIDGE);

const assetRouterDepositLog = (assetId: string, amount: bigint) =>
  makeLog(
    "DepositFinalizedAssetRouter",
    [
      BigInt(1),
      assetId,
      abi.encode(["address", "address", "uint256", "uint256"], [SENDER, RECEIVER, BigInt(0), amount]),
    ],
    L2_ASSET_ROUTER_ADDRESS
  );

describe("TransferService", () => {
  let transferService: TransferService;
  let blockchainServiceMock: BlockchainService;

  beforeEach(async () => {
    blockchainServiceMock = mock<BlockchainService>();
    const app = await Test.createTestingModule({
      providers: [
        TransferService,
        {
          provide: BlockchainService,
          useValue: blockchainServiceMock,
        },
        {
          provide: ConfigService,
          useValue: mock<ConfigService>({
            get: jest.fn().mockReturnValue(new Set<string>()),
          }),
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());

    transferService = app.get<TransferService>(TransferService);
  });

  it("transferService is defined (mock test)", () => {
    expect(transferService).toBeDefined();
  });
  // describe("getTransfers", () => {
  //   const receivedAt = new Date();
  //   const blockDetails = mock<types.BlockDetails>();
  //   blockDetails.timestamp = new Date().getTime() / 1000;
  //   const transactionDetails = mock<types.TransactionDetails>({
  //     initiatorAddress: "0xA38EDFcc55164a59e0f33918D13a2d559BC11df8",
  //   });
  //   transactionDetails.receivedAt = receivedAt;

  //   it("returns an empty array if no logs are specified", async () => {
  //     const transfers = await transferService.getTransfers([], null, null);
  //     expect(transfers).toStrictEqual([]);
  //   });

  //   describe("eth", () => {
  //     describe("deposit with no fee", () => {
  //       const txReceipt = toTxReceipt(ethDepositNoFee);
  //       it.only("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x6f05b59d3b20000"),
  //             blockNumber: 215276,
  //             from: "0xd206eaf6819007535e893410cfa01885ce40e99a",
  //             to: "0xd206eaf6819007535e893410cfa01885ce40e99a",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x7cc7cc0326af164b15de04de3b153a7a55afb14a7897298a0a84f9507d483d1d",
  //             type: "deposit",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 1,
  //             transactionIndex: 1,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x6f05b59d3b20000"),
  //             blockNumber: 215276,
  //             from: "0xd206eaf6819007535e893410cfa01885ce40e99a",
  //             to: "0xd754ff5e8a6f257e162f72578a4bb0493c0681d8",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x7cc7cc0326af164b15de04de3b153a7a55afb14a7897298a0a84f9507d483d1d",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 2,
  //             transactionIndex: 1,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0"),
  //             blockNumber: 215276,
  //             from: "0xd206eaf6819007535e893410cfa01885ce40e99a",
  //             to: "0xd206eaf6819007535e893410cfa01885ce40e99a",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x7cc7cc0326af164b15de04de3b153a7a55afb14a7897298a0a84f9507d483d1d",
  //             type: "deposit",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 2,
  //             transactionIndex: 1,
  //             timestamp: receivedAt,
  //           },
  //         ];

  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("deposit", () => {
  //       const txReceipt = toTxReceipt(ethDeposit);

  //       it("returns deposit, transfer, fee and refund transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             from: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             to: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             transactionHash: "0xad909404d4390c350281c9e896cfadc528d071cb87c62f4ed026016fd4694d77",
  //             blockNumber: 7485644,
  //             amount: BigInt("0x2386f26fc10000"),
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             type: "deposit",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 0,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             from: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             to: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             transactionHash: "0xad909404d4390c350281c9e896cfadc528d071cb87c62f4ed026016fd4694d77",
  //             blockNumber: 7485644,
  //             amount: BigInt("0x2386f26fc10000"),
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 1,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             from: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             to: "0x0000000000000000000000000000000000008001",
  //             transactionHash: "0xad909404d4390c350281c9e896cfadc528d071cb87c62f4ed026016fd4694d77",
  //             blockNumber: 7485644,
  //             amount: BigInt("0x0141b56ff62900"),
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 2,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             from: "0x0000000000000000000000000000000000008001",
  //             to: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             transactionHash: "0xad909404d4390c350281c9e896cfadc528d071cb87c62f4ed026016fd4694d77",
  //             blockNumber: 7485644,
  //             amount: BigInt("0x29eb1faec300"),
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             type: "refund",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 3,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];

  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("deposit to different address", () => {
  //       const txReceipt = toTxReceipt(ethDepositToDifferentAddress);

  //       it("returns deposit, transfer, fee and refund transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             from: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             to: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             transactionHash: "0x90b20334a21b92843b5d0a2127a0fb3f9aa9661e1ead7a7a4bc27c5ce1e8584a",
  //             blockNumber: 7483775,
  //             amount: BigInt("0x11c37937e08000"),
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             type: "deposit",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 0,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             from: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             to: "0xc62a6e5d98b3a0de9ec4a930fbb354443e92e9e0",
  //             transactionHash: "0x90b20334a21b92843b5d0a2127a0fb3f9aa9661e1ead7a7a4bc27c5ce1e8584a",
  //             blockNumber: 7483775,
  //             amount: BigInt("0x11c37937e08000"),
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 1,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             from: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             to: "0x0000000000000000000000000000000000008001",
  //             transactionHash: "0x90b20334a21b92843b5d0a2127a0fb3f9aa9661e1ead7a7a4bc27c5ce1e8584a",
  //             blockNumber: 7483775,
  //             amount: BigInt("0x0150b5fa93bf00"),
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 2,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             from: "0x0000000000000000000000000000000000008001",
  //             to: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             transactionHash: "0x90b20334a21b92843b5d0a2127a0fb3f9aa9661e1ead7a7a4bc27c5ce1e8584a",
  //             blockNumber: 7483775,
  //             amount: BigInt("0xdb01bc43a500"),
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             type: "refund",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 3,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];

  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("zero value deposit", () => {
  //       const txReceipt = toTxReceipt(ethDepositZeroValue);

  //       it("returns fee and refund transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             from: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             to: "0x0000000000000000000000000000000000008001",
  //             transactionHash: "0x7d7bd680763ab90fed0097cd75ae468ce01b7cfb64b4e2c74f9e47e3ba73f937",
  //             blockNumber: 7485219,
  //             amount: BigInt("0x010425b6917e00"),
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 0,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             from: "0x0000000000000000000000000000000000008001",
  //             to: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             transactionHash: "0x7d7bd680763ab90fed0097cd75ae468ce01b7cfb64b4e2c74f9e47e3ba73f937",
  //             blockNumber: 7485219,
  //             amount: BigInt("0x7c948f3acf00"),
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             type: "refund",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 1,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];

  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("transfer", () => {
  //       const txReceipt = toTxReceipt(ethTransfer);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x018034d06a6900"),
  //             blockNumber: 3226848,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0xc697e19d80645ec37df566e1227edad4652d010e43c508bbd04efbaeb47e2c48",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 0,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x2386f26fc10000"),
  //             blockNumber: 3226848,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0xc9593dc3dcad5f3804aaa5af12a9d74d0c00e4b0",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0xc697e19d80645ec37df566e1227edad4652d010e43c508bbd04efbaeb47e2c48",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 1,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];

  //         const txDetails = mock<types.TransactionDetails>({ isL1Originated: false });
  //         txDetails.receivedAt = receivedAt;

  //         const transfers = await transferService.getTransfers(txReceipt.logs, blockDetails, [], txDetails, txReceipt);
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("transfer to zero address", () => {
  //       const txReceipt = toTxReceipt(ethTransferToZeroAddress);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x017e3f22499e00"),
  //             blockNumber: 4144647,
  //             from: "0xd2229549f09af28dd0c21b1ade77f739aa8406b5",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x4ae2d3cf9b7e4d25b4323f7e8715521172bda4dfc88cfaf6b40c8cf80165b985",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 5,
  //             transactionIndex: 1,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x01"),
  //             blockNumber: 4144647,
  //             from: "0xd2229549f09af28dd0c21b1ade77f739aa8406b5",
  //             to: "0x0000000000000000000000000000000000000000",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x4ae2d3cf9b7e4d25b4323f7e8715521172bda4dfc88cfaf6b40c8cf80165b985",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 6,
  //             transactionIndex: 1,
  //             timestamp: receivedAt,
  //           },
  //         ];

  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("withdrawal", () => {
  //       const txReceipt = toTxReceipt(ethWithdrawal);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x119f17fe16000"),
  //             blockNumber: 264367,
  //             from: "0xd754ff5e8a6f257e162f72578a4bb0493c0681d8",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x69d3dcb5822096bab259dbba2a1b42bdfd6d1e5c4169196893cf1998ab2ca85f",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 19,
  //             transactionIndex: 5,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x16345785d8a0000"),
  //             blockNumber: 264367,
  //             from: "0xd754ff5e8a6f257e162f72578a4bb0493c0681d8",
  //             to: "0x000000000000000000000000000000000000800a",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x69d3dcb5822096bab259dbba2a1b42bdfd6d1e5c4169196893cf1998ab2ca85f",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 20,
  //             transactionIndex: 5,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x16345785d8a0000"),
  //             blockNumber: 264367,
  //             from: "0xd754ff5e8a6f257e162f72578a4bb0493c0681d8",
  //             to: "0xd754ff5e8a6f257e162f72578a4bb0493c0681d8",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x69d3dcb5822096bab259dbba2a1b42bdfd6d1e5c4169196893cf1998ab2ca85f",
  //             type: "withdrawal",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 22,
  //             transactionIndex: 5,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x326ecef5b300"),
  //             blockNumber: 264367,
  //             from: "0x0000000000000000000000000000000000008001",
  //             to: "0xd754ff5e8a6f257e162f72578a4bb0493c0681d8",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x69d3dcb5822096bab259dbba2a1b42bdfd6d1e5c4169196893cf1998ab2ca85f",
  //             type: "refund",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 23,
  //             transactionIndex: 5,
  //             timestamp: receivedAt,
  //           },
  //         ];

  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("withdrawal to different address", () => {
  //       const txReceipt = toTxReceipt(ethWithdrawalToDifferentAddress);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x119f17fe16000"),
  //             blockNumber: 258521,
  //             from: "0xd754ff5e8a6f257e162f72578a4bb0493c0681d8",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x33bfd18a0aea94ba39742a9a1df595462322ecbbb25c0f767a0bf6acb41dfb2f",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 40,
  //             transactionIndex: 7,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x429d069189e0000"),
  //             blockNumber: 258521,
  //             from: "0xd754ff5e8a6f257e162f72578a4bb0493c0681d8",
  //             to: "0x000000000000000000000000000000000000800a",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x33bfd18a0aea94ba39742a9a1df595462322ecbbb25c0f767a0bf6acb41dfb2f",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 41,
  //             transactionIndex: 7,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x429d069189e0000"),
  //             blockNumber: 258521,
  //             from: "0xd754ff5e8a6f257e162f72578a4bb0493c0681d8",
  //             to: "0xd206eaf6819007535e893410cfa01885ce40e99a",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x33bfd18a0aea94ba39742a9a1df595462322ecbbb25c0f767a0bf6acb41dfb2f",
  //             type: "withdrawal",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 43,
  //             transactionIndex: 7,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x2d8c82046f00"),
  //             blockNumber: 258521,
  //             from: "0x0000000000000000000000000000000000008001",
  //             to: "0xd754ff5e8a6f257e162f72578a4bb0493c0681d8",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x33bfd18a0aea94ba39742a9a1df595462322ecbbb25c0f767a0bf6acb41dfb2f",
  //             type: "refund",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 44,
  //             transactionIndex: 7,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("zero value withdrawal", () => {
  //       const txReceipt = toTxReceipt(ethWithdrawalZeroValue);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             from: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             to: "0x0000000000000000000000000000000000008001",
  //             transactionHash: "0x6424dd7b1d52f9d8f6ea8300f1bf1eab65246f71f00fd3197e49c6423c9a59bf",
  //             blockNumber: 7508823,
  //             amount: BigInt("0xb782effd8200"),
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 0,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             from: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             to: "0xc62a6e5d98b3a0de9ec4a930fbb354443e92e9e0",
  //             transactionHash: "0x6424dd7b1d52f9d8f6ea8300f1bf1eab65246f71f00fd3197e49c6423c9a59bf",
  //             blockNumber: 7508823,
  //             amount: BigInt("0x00"),
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             type: "withdrawal",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 2,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             from: "0x0000000000000000000000000000000000008001",
  //             to: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             transactionHash: "0x6424dd7b1d52f9d8f6ea8300f1bf1eab65246f71f00fd3197e49c6423c9a59bf",
  //             blockNumber: 7508823,
  //             amount: BigInt("0x71e06f110780"),
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             type: "refund",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 3,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("zero value withdrawal", () => {
  //       const txReceipt = toTxReceipt(ethWithdrawalToDifferentAddress);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x119f17fe16000"),
  //             blockNumber: 258521,
  //             from: "0xd754ff5e8a6f257e162f72578a4bb0493c0681d8",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x33bfd18a0aea94ba39742a9a1df595462322ecbbb25c0f767a0bf6acb41dfb2f",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 40,
  //             transactionIndex: 7,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x429d069189e0000"),
  //             blockNumber: 258521,
  //             from: "0xd754ff5e8a6f257e162f72578a4bb0493c0681d8",
  //             to: "0x000000000000000000000000000000000000800a",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x33bfd18a0aea94ba39742a9a1df595462322ecbbb25c0f767a0bf6acb41dfb2f",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 41,
  //             transactionIndex: 7,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x429d069189e0000"),
  //             blockNumber: 258521,
  //             from: "0xd754ff5e8a6f257e162f72578a4bb0493c0681d8",
  //             to: "0xd206eaf6819007535e893410cfa01885ce40e99a",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x33bfd18a0aea94ba39742a9a1df595462322ecbbb25c0f767a0bf6acb41dfb2f",
  //             type: "withdrawal",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 43,
  //             transactionIndex: 7,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x2d8c82046f00"),
  //             blockNumber: 258521,
  //             from: "0x0000000000000000000000000000000000008001",
  //             to: "0xd754ff5e8a6f257e162f72578a4bb0493c0681d8",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x33bfd18a0aea94ba39742a9a1df595462322ecbbb25c0f767a0bf6acb41dfb2f",
  //             type: "refund",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 44,
  //             transactionIndex: 7,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });
  //   });

  //   describe("pre-approved ERC20", () => {
  //     describe("deposit", () => {
  //       const txReceipt = toTxReceipt(preApprovedErc20Deposit);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x989680"),
  //             blockNumber: 3221037,
  //             from: "0x0000000000000000000000000000000000000000",
  //             to: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             tokenAddress: "0x852a4599217e76aa725f0ada8bf832a1f57a8a91",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0x25f9bd9de8260b53e2765cddb6aaafce5256fca647434c72559f0a0fb77bd715",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 0,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x989680"),
  //             blockNumber: 3221037,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             tokenAddress: "0x852a4599217e76aa725f0ada8bf832a1f57a8a91",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0x25f9bd9de8260b53e2765cddb6aaafce5256fca647434c72559f0a0fb77bd715",
  //             type: "deposit",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 2,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("transfer", () => {
  //       const txReceipt = toTxReceipt(preApprovedErc20Transfer);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x018083f408d000"),
  //             blockNumber: 3226875,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0xf8835220234eecd1a6dfd4dc1be8594e6f076d73107497b665a97a6d694320ad",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 0,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x989680"),
  //             blockNumber: 3226875,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0xc9593dc3dcad5f3804aaa5af12a9d74d0c00e4b0",
  //             tokenAddress: "0x852a4599217e76aa725f0ada8bf832a1f57a8a91",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0xf8835220234eecd1a6dfd4dc1be8594e6f076d73107497b665a97a6d694320ad",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 1,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("withdrawal", () => {
  //       const txReceipt = toTxReceipt(preApprovedErc20Withdrawal);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x0277b0afc08300"),
  //             blockNumber: 3226739,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x37f670de38b93e28c3ecf5ede9b4c96a4d26f2aa6c53bb6ffc7a040f559d8abb",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 0,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x989680"),
  //             blockNumber: 3226739,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x0000000000000000000000000000000000000000",
  //             tokenAddress: "0x852a4599217e76aa725f0ada8bf832a1f57a8a91",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0x37f670de38b93e28c3ecf5ede9b4c96a4d26f2aa6c53bb6ffc7a040f559d8abb",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 1,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x989680"),
  //             blockNumber: 3226739,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             tokenAddress: "0x852a4599217e76aa725f0ada8bf832a1f57a8a91",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0x37f670de38b93e28c3ecf5ede9b4c96a4d26f2aa6c53bb6ffc7a040f559d8abb",
  //             type: "withdrawal",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 4,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("withdrawal to different address", () => {
  //       const txReceipt = toTxReceipt(preApprovedErc20WithdrawalToDifferentAddress);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x027673d9c05b00"),
  //             blockNumber: 3226822,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x85dc1a3b141cdc67ed5f787c688d9ea8976363c875b5c4d3347cac69bcd23108",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 0,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x989680"),
  //             blockNumber: 3226822,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x0000000000000000000000000000000000000000",
  //             tokenAddress: "0x852a4599217e76aa725f0ada8bf832a1f57a8a91",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0x85dc1a3b141cdc67ed5f787c688d9ea8976363c875b5c4d3347cac69bcd23108",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 1,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x989680"),
  //             blockNumber: 3226822,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0xc9593dc3dcad5f3804aaa5af12a9d74d0c00e4b0",
  //             tokenAddress: "0x852a4599217e76aa725f0ada8bf832a1f57a8a91",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0x85dc1a3b141cdc67ed5f787c688d9ea8976363c875b5c4d3347cac69bcd23108",
  //             type: "withdrawal",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 4,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });
  //   });

  //   describe("Greeter", () => {
  //     describe("deploy to L2", () => {
  //       const txReceipt = toTxReceipt(greeterDeployToL2);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x01baa818335500"),
  //             blockNumber: 3230131,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x7ec71b1d5369b830af3f7af4b1ef0f04e62cc3775b1c090434a93493d1b68632",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 2,
  //             transactionIndex: 1,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("execute SetGreeting function", () => {
  //       const txReceipt = toTxReceipt(greeterSetGreeting);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x0134b578f8b200"),
  //             blockNumber: 3230534,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0xaa4f89b2adc9ae0fc50d058ebc7d75ddd54b0d83c307474b09989def4a0f2fbe",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 2,
  //             transactionIndex: 1,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });
  //   });

  //   describe("ERC20", () => {
  //     describe("deploy to L2", () => {
  //       const txReceipt = toTxReceipt(erc20DeployToL2);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x420c98159bd600"),
  //             blockNumber: 3277437,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x55f31c010dc9ae929e192cd9950027e09b647543b3d7b0f866cb74bc7941009d",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 1,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x056bc75e2d63100000"),
  //             blockNumber: 3277437,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             tokenAddress: "0xd144ca8aa2e7dfecd56a3cccba1cd873c8e5db58",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0x55f31c010dc9ae929e192cd9950027e09b647543b3d7b0f866cb74bc7941009d",
  //             type: "mint",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 2,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("bridge deposit from L1", () => {
  //       const txReceipt = toTxReceipt(erc20BridgeDepositFromL1);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x016345785d8a0000"),
  //             blockNumber: 3233097,
  //             from: "0x0000000000000000000000000000000000000000",
  //             to: "0xb7e2355b87ff9ae9b146ca6dcee9c02157937b01",
  //             tokenAddress: "0xdc187378edd8ed1585fb47549cc5fe633295d571",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 11,
  //             transactionIndex: 1,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x016345785d8a0000"),
  //             blockNumber: 3233097,
  //             from: "0xb7e2355b87ff9ae9b146ca6dcee9c02157937b01",
  //             to: "0xb7e2355b87ff9ae9b146ca6dcee9c02157937b01",
  //             tokenAddress: "0xdc187378edd8ed1585fb47549cc5fe633295d571",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
  //             type: "deposit",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 13,
  //             transactionIndex: 1,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("bridge deposit from L1 to different address", () => {
  //       const txReceipt = toTxReceipt(erc20BridgeDepositFromL1ToDifferentAddress);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             from: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             to: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             transactionHash: "0x90b20334a21b92843b5d0a2127a0fb3f9aa9661e1ead7a7a4bc27c5ce1e8584a",
  //             blockNumber: 7483775,
  //             amount: BigInt("0x11c37937e08000"),
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             type: "deposit",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 0,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             from: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             to: "0xc62a6e5d98b3a0de9ec4a930fbb354443e92e9e0",
  //             transactionHash: "0x90b20334a21b92843b5d0a2127a0fb3f9aa9661e1ead7a7a4bc27c5ce1e8584a",
  //             blockNumber: 7483775,
  //             amount: BigInt("0x11c37937e08000"),
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 1,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             from: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             to: "0x0000000000000000000000000000000000008001",
  //             transactionHash: "0x90b20334a21b92843b5d0a2127a0fb3f9aa9661e1ead7a7a4bc27c5ce1e8584a",
  //             blockNumber: 7483775,
  //             amount: BigInt("0x0150b5fa93bf00"),
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 2,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             from: "0x0000000000000000000000000000000000008001",
  //             to: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             transactionHash: "0x90b20334a21b92843b5d0a2127a0fb3f9aa9661e1ead7a7a4bc27c5ce1e8584a",
  //             blockNumber: 7483775,
  //             amount: BigInt("0xdb01bc43a500"),
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             type: "refund",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 3,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("transfer", () => {
  //       const txReceipt = toTxReceipt(erc20Transfer);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x0152d41ffe1400"),
  //             blockNumber: 3615452,
  //             from: "0xd206eaf6819007535e893410cfa01885ce40e99a",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0xbb9c4b21c235ada7be48da89ca574dfb3c1f9126f3b879060ace14e37239053d",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 0,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x0a"),
  //             blockNumber: 3615452,
  //             from: "0xd206eaf6819007535e893410cfa01885ce40e99a",
  //             to: "0xd754ff5e8a6f257e162f72578a4bb0493c0681d8",
  //             tokenAddress: "0x7aa5f26e03b12a78e3ff1c454547701443144c67",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0xbb9c4b21c235ada7be48da89ca574dfb3c1f9126f3b879060ace14e37239053d",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 1,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("withdrawal", () => {
  //       const txReceipt = toTxReceipt(erc20Withdrawal);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             from: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             to: "0x0000000000000000000000000000000000008001",
  //             transactionHash: "0x866cd72b7b677299fba830bf7a9c227e2297256dcba021b97ede26e1ab456b8e",
  //             blockNumber: 7492781,
  //             amount: BigInt("0xc51affb6ed80"),
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 9,
  //             transactionIndex: 3,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             from: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             to: "0x0000000000000000000000000000000000000000",
  //             transactionHash: "0x866cd72b7b677299fba830bf7a9c227e2297256dcba021b97ede26e1ab456b8e",
  //             blockNumber: 7492781,
  //             amount: BigInt("0x055de6a779bbac0000"),
  //             tokenAddress: "0x24a5f3f8b311b053a55c90cfff3bd2ee34c85fc0",
  //             tokenType: TokenType.ERC20,
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 10,
  //             transactionIndex: 3,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             from: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             to: "0xc62a6e5d98b3a0de9ec4a930fbb354443e92e9e0",
  //             transactionHash: "0x866cd72b7b677299fba830bf7a9c227e2297256dcba021b97ede26e1ab456b8e",
  //             blockNumber: 7492781,
  //             amount: BigInt("0x055de6a779bbac0000"),
  //             tokenAddress: "0x24a5f3f8b311b053a55c90cfff3bd2ee34c85fc0",
  //             tokenType: TokenType.ERC20,
  //             type: "withdrawal",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 13,
  //             transactionIndex: 3,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             from: "0x0000000000000000000000000000000000008001",
  //             to: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //             transactionHash: "0x866cd72b7b677299fba830bf7a9c227e2297256dcba021b97ede26e1ab456b8e",
  //             blockNumber: 7492781,
  //             amount: BigInt("0x780bd72ca280"),
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             type: "refund",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 14,
  //             transactionIndex: 3,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });
  //   });

  //   describe("MultiTransfer", () => {
  //     describe("eth, USDC, ERC20 token multi transfer", () => {
  //       const txReceipt = toTxReceipt(multiTransfer);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x04a061c5f0b100"),
  //             blockNumber: 3618694,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x9a9218b64947ffc0e7993c1dd2cbc3377b33c0773a445662e8c833ed17369cf3",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 0,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x0a"),
  //             blockNumber: 3618694,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x08b222f412eb5d141fb32db443f2eed06ae65a24",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x9a9218b64947ffc0e7993c1dd2cbc3377b33c0773a445662e8c833ed17369cf3",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 1,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x05"),
  //             blockNumber: 3618694,
  //             from: "0x08b222f412eb5d141fb32db443f2eed06ae65a24",
  //             to: "0x65ebd487e692d688f2a36fb833729076dc85ed34",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x9a9218b64947ffc0e7993c1dd2cbc3377b33c0773a445662e8c833ed17369cf3",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: true,
  //             logIndex: 7,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x05"),
  //             blockNumber: 3618694,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x65ebd487e692d688f2a36fb833729076dc85ed34",
  //             tokenAddress: "0x2baec5bca9f2052489ed30668f27ab4466f0bcb3",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0x9a9218b64947ffc0e7993c1dd2cbc3377b33c0773a445662e8c833ed17369cf3",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 9,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x05"),
  //             blockNumber: 3618694,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x65ebd487e692d688f2a36fb833729076dc85ed34",
  //             tokenAddress: "0x852a4599217e76aa725f0ada8bf832a1f57a8a91",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0x9a9218b64947ffc0e7993c1dd2cbc3377b33c0773a445662e8c833ed17369cf3",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 11,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x05"),
  //             blockNumber: 3618694,
  //             from: "0x08b222f412eb5d141fb32db443f2eed06ae65a24",
  //             to: "0x65ebd487e692d688f2a36fb833729076dc85ed34",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x9a9218b64947ffc0e7993c1dd2cbc3377b33c0773a445662e8c833ed17369cf3",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: true,
  //             logIndex: 12,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x05"),
  //             blockNumber: 3618694,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x65ebd487e692d688f2a36fb833729076dc85ed34",
  //             tokenAddress: "0x2baec5bca9f2052489ed30668f27ab4466f0bcb3",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0x9a9218b64947ffc0e7993c1dd2cbc3377b33c0773a445662e8c833ed17369cf3",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 14,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x05"),
  //             blockNumber: 3618694,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x65ebd487e692d688f2a36fb833729076dc85ed34",
  //             tokenAddress: "0x852a4599217e76aa725f0ada8bf832a1f57a8a91",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0x9a9218b64947ffc0e7993c1dd2cbc3377b33c0773a445662e8c833ed17369cf3",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 16,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("eth, USDC, ERC20 token multi transfer through Paymaster", () => {
  //       const txReceipt = toTxReceipt(multiTransferThroughPaymaster);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x0b2cf038c49e00"),
  //             blockNumber: 3619009,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x0265d9a5af8af5fe070933e5e549d8fef08e09f4",
  //             tokenAddress: "0x2baec5bca9f2052489ed30668f27ab4466f0bcb3",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0xeae0368e1457fa55da486ffc772cc654d3d5b95faa220fa971ff73077fccd370",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 6,
  //             transactionIndex: 2,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x0b2cf038c49e00"),
  //             blockNumber: 3619009,
  //             from: "0x0265d9a5af8af5fe070933e5e549d8fef08e09f4",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0xeae0368e1457fa55da486ffc772cc654d3d5b95faa220fa971ff73077fccd370",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 7,
  //             transactionIndex: 2,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x0a"),
  //             blockNumber: 3619009,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x08b222f412eb5d141fb32db443f2eed06ae65a24",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0xeae0368e1457fa55da486ffc772cc654d3d5b95faa220fa971ff73077fccd370",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 8,
  //             transactionIndex: 2,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x05"),
  //             blockNumber: 3619009,
  //             from: "0x08b222f412eb5d141fb32db443f2eed06ae65a24",
  //             to: "0x65ebd487e692d688f2a36fb833729076dc85ed34",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0xeae0368e1457fa55da486ffc772cc654d3d5b95faa220fa971ff73077fccd370",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: true,
  //             logIndex: 14,
  //             transactionIndex: 2,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x05"),
  //             blockNumber: 3619009,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x65ebd487e692d688f2a36fb833729076dc85ed34",
  //             tokenAddress: "0x2baec5bca9f2052489ed30668f27ab4466f0bcb3",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0xeae0368e1457fa55da486ffc772cc654d3d5b95faa220fa971ff73077fccd370",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 16,
  //             transactionIndex: 2,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x05"),
  //             blockNumber: 3619009,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x65ebd487e692d688f2a36fb833729076dc85ed34",
  //             tokenAddress: "0x852a4599217e76aa725f0ada8bf832a1f57a8a91",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0xeae0368e1457fa55da486ffc772cc654d3d5b95faa220fa971ff73077fccd370",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 18,
  //             transactionIndex: 2,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x05"),
  //             blockNumber: 3619009,
  //             from: "0x08b222f412eb5d141fb32db443f2eed06ae65a24",
  //             to: "0x65ebd487e692d688f2a36fb833729076dc85ed34",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0xeae0368e1457fa55da486ffc772cc654d3d5b95faa220fa971ff73077fccd370",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: true,
  //             logIndex: 19,
  //             transactionIndex: 2,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x05"),
  //             blockNumber: 3619009,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x65ebd487e692d688f2a36fb833729076dc85ed34",
  //             tokenAddress: "0x2baec5bca9f2052489ed30668f27ab4466f0bcb3",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0xeae0368e1457fa55da486ffc772cc654d3d5b95faa220fa971ff73077fccd370",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 21,
  //             transactionIndex: 2,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x05"),
  //             blockNumber: 3619009,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x65ebd487e692d688f2a36fb833729076dc85ed34",
  //             tokenAddress: "0x852a4599217e76aa725f0ada8bf832a1f57a8a91",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0xeae0368e1457fa55da486ffc772cc654d3d5b95faa220fa971ff73077fccd370",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 23,
  //             transactionIndex: 2,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("multi eth transfer", () => {
  //       const txReceipt = toTxReceipt(multiEthTransfer);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x0b2cf038c49e00"),
  //             blockNumber: 3601749,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x0265d9a5af8af5fe070933e5e549d8fef08e09f4",
  //             tokenAddress: "0x2baec5bca9f2052489ed30668f27ab4466f0bcb3",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0x8ed4aa94bb4a28ce174e435d60297d765885dff83a543b49ad57adedec99cfe3",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 3,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x0b2cf038c49e00"),
  //             blockNumber: 3601749,
  //             from: "0x0265d9a5af8af5fe070933e5e549d8fef08e09f4",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x8ed4aa94bb4a28ce174e435d60297d765885dff83a543b49ad57adedec99cfe3",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 4,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x2386f26fc10000"),
  //             blockNumber: 3601749,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0xbba0cf82ce98acd455bd34d7a53bb565a31372a6",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x8ed4aa94bb4a28ce174e435d60297d765885dff83a543b49ad57adedec99cfe3",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 5,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x11c37937e08000"),
  //             blockNumber: 3601749,
  //             from: "0xbba0cf82ce98acd455bd34d7a53bb565a31372a6",
  //             to: "0x65ebd487e692d688f2a36fb833729076dc85ed34",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x8ed4aa94bb4a28ce174e435d60297d765885dff83a543b49ad57adedec99cfe3",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: true,
  //             logIndex: 6,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x11c37937e08000"),
  //             blockNumber: 3601749,
  //             from: "0xbba0cf82ce98acd455bd34d7a53bb565a31372a6",
  //             to: "0xc9593dc3dcad5f3804aaa5af12a9d74d0c00e4b0",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x8ed4aa94bb4a28ce174e435d60297d765885dff83a543b49ad57adedec99cfe3",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: true,
  //             logIndex: 7,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });
  //   });

  //   describe("NFT", () => {
  //     describe("deploy to l2", () => {
  //       const txReceipt = toTxReceipt(nftDeploy);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x6e45eb3828c800"),
  //             blockNumber: 3455042,
  //             from: "0xd206eaf6819007535e893410cfa01885ce40e99a",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0xc36a1b2d19085fbeff652e618a1e61d6d386f92cbe51373eac60077bb128b7cb",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 1,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("mint", () => {
  //       const txReceipt = toTxReceipt(nftMint);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x02570592a28a00"),
  //             blockNumber: 3339976,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x30e3abe6ac3a1b47d961213e1b1302377786f5cd537a6cd34dd3cd6473a319d0",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 0,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: undefined,
  //             blockNumber: 3339976,
  //             fields: { tokenId: BigInt("0x01") },
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             tokenAddress: "0x4a80888f58d004c5ef2013d2cf974f00f42dd934",
  //             tokenType: TokenType.ERC721,
  //             transactionHash: "0x30e3abe6ac3a1b47d961213e1b1302377786f5cd537a6cd34dd3cd6473a319d0",
  //             type: "mint",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 1,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("approve", () => {
  //       const txReceipt = toTxReceipt(nftApprove);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x011f05a0378000"),
  //             blockNumber: 3459441,
  //             from: "0xd206eaf6819007535e893410cfa01885ce40e99a",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x4833645ed34e16c9e2ce4d26fee2d730202ab3e76c0cd155557e7bb9344990be",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 0,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });

  //     describe("transfer", () => {
  //       const txReceipt = toTxReceipt(nftTransfer);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x01bbaabf001a00"),
  //             blockNumber: 3459471,
  //             from: "0xd206eaf6819007535e893410cfa01885ce40e99a",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x6bedb809e97f58d987aea7aad4fcfa8a3f5ecc3cde9a97093b2f3a1a170692a0",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 0,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: undefined,
  //             blockNumber: 3459471,
  //             fields: { tokenId: BigInt("0x01") },
  //             from: "0xd206eaf6819007535e893410cfa01885ce40e99a",
  //             to: "0xd754ff5e8a6f257e162f72578a4bb0493c0681d8",
  //             tokenAddress: "0x89bcb56033920b8a654109faeb1f87e0c3358cad",
  //             tokenType: TokenType.ERC721,
  //             transactionHash: "0x6bedb809e97f58d987aea7aad4fcfa8a3f5ecc3cde9a97093b2f3a1a170692a0",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 1,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });
  //   });

  //   describe("Paymasters", () => {
  //     describe("transfer", () => {
  //       const txReceipt = toTxReceipt(paymasterTransfer);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x0b2cf038c49e00"),
  //             blockNumber: 3286895,
  //             from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //             to: "0x0265d9a5af8af5fe070933e5e549d8fef08e09f4",
  //             tokenAddress: "0x2baec5bca9f2052489ed30668f27ab4466f0bcb3",
  //             tokenType: TokenType.ERC20,
  //             transactionHash: "0x191c7e02d6a78b6da6116ea8347f3560627caa4b7fbf766f96eccbd09bacc433",
  //             type: "transfer",
  //             isFeeOrRefund: false,
  //             isInternal: false,
  //             logIndex: 3,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //           {
  //             amount: BigInt("0x0b2cf038c49e00"),
  //             blockNumber: 3286895,
  //             from: "0x0265d9a5af8af5fe070933e5e549d8fef08e09f4",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x191c7e02d6a78b6da6116ea8347f3560627caa4b7fbf766f96eccbd09bacc433",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 4,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });
  //   });

  //   describe("failed transaction", () => {
  //     describe("ERC20 transfer to zero address that fails", () => {
  //       const txReceipt = toTxReceipt(failedErc20Transfer);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x1606ddfd9b8000"),
  //             blockNumber: 3622224,
  //             from: "0xd206eaf6819007535e893410cfa01885ce40e99a",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x2b9153e896c0d2651d2826e8e1a447c5e56a3e060ae7d60c2c0bfbcd966e4880",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 5,
  //             transactionIndex: 1,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });
  //   });

  //   describe("tx with no logs", () => {
  //     it("returns an empty array", async () => {
  //       const txReceipt = toTxReceipt(txWithNoLogs);
  //       const transfers = await transferService.getTransfers(
  //         txReceipt.logs,
  //         blockDetails,
  //         [],
  //         transactionDetails,
  //         txReceipt
  //       );
  //       expect(transfers).toStrictEqual([]);
  //     });
  //   });

  //   describe("nested contract calls", () => {
  //     describe("subcalls to other contracts", () => {
  //       const txReceipt = toTxReceipt(subCallsToOtherContracts);

  //       it("returns proper transfers", async () => {
  //         const expectedTransfers = [
  //           {
  //             amount: BigInt("0x0220aed39b7400"),
  //             blockNumber: 3680310,
  //             from: "0xd206eaf6819007535e893410cfa01885ce40e99a",
  //             to: "0x0000000000000000000000000000000000008001",
  //             tokenAddress: "0x000000000000000000000000000000000000800a",
  //             tokenType: TokenType.BaseToken,
  //             transactionHash: "0x8a7a99459d2278c83a8450cc36c0e5b75bee250a60e4b66dea182325afd8fa07",
  //             type: "fee",
  //             isFeeOrRefund: true,
  //             isInternal: false,
  //             logIndex: 0,
  //             transactionIndex: 0,
  //             timestamp: receivedAt,
  //           },
  //         ];
  //         const transfers = await transferService.getTransfers(
  //           txReceipt.logs,
  //           blockDetails,
  //           [],
  //           transactionDetails,
  //           txReceipt
  //         );
  //         expect(transfers).toStrictEqual(expectedTransfers);
  //       });
  //     });
  //   });

  //   describe("tx with supported event but with no matching handlers", () => {
  //     const txReceipt = toTxReceipt(noMatchingHandlers);

  //     it("returns proper transfers", async () => {
  //       const transfers = await transferService.getTransfers(
  //         txReceipt.logs,
  //         blockDetails,
  //         [],
  //         transactionDetails,
  //         txReceipt
  //       );
  //       expect(transfers).toStrictEqual([
  //         {
  //           amount: BigInt("0xcdab63f37000"),
  //           blockNumber: 166322,
  //           from: "0x088282b61a8cc1014186076698e35bcc92e88b0d",
  //           to: "0x0000000000000000000000000000000000008001",
  //           tokenAddress: "0x000000000000000000000000000000000000800a",
  //           tokenType: TokenType.BaseToken,
  //           transactionHash: "0xb12a02697dd2a0e414cb8f9436c6fb7a8eb82eb403e256644235a0c618ef508d",
  //           type: "fee",
  //           isFeeOrRefund: true,
  //           isInternal: false,
  //           logIndex: 3,
  //           transactionIndex: 1,
  //           timestamp: receivedAt,
  //         },
  //         {
  //           amount: BigInt("0x01"),
  //           blockNumber: 166322,
  //           from: "0x0000000000000000000000000000000000000000",
  //           to: "0x7869cd51c2483169e1ce06fa6912e7d1e3bf629b",
  //           tokenAddress: "0x6267080b2265a09371cc2763756dbacdaf09856e",
  //           tokenType: TokenType.ERC20,
  //           transactionHash: "0xb12a02697dd2a0e414cb8f9436c6fb7a8eb82eb403e256644235a0c618ef508d",
  //           type: "transfer",
  //           isFeeOrRefund: false,
  //           isInternal: false,
  //           logIndex: 4,
  //           transactionIndex: 1,
  //           timestamp: receivedAt,
  //         },
  //         {
  //           amount: BigInt("0x54c81f943900"),
  //           blockNumber: 166322,
  //           from: "0x0000000000000000000000000000000000008001",
  //           to: "0x088282b61a8cc1014186076698e35bcc92e88b0d",
  //           tokenAddress: "0x000000000000000000000000000000000000800a",
  //           tokenType: TokenType.BaseToken,
  //           transactionHash: "0xb12a02697dd2a0e414cb8f9436c6fb7a8eb82eb403e256644235a0c618ef508d",
  //           type: "refund",
  //           isFeeOrRefund: true,
  //           isInternal: false,
  //           logIndex: 6,
  //           transactionIndex: 1,
  //           timestamp: receivedAt,
  //         },
  //       ]);
  //     });
  //   });

  //   describe("when tx contains transfer logs with some args of type address which are out of range", () => {
  //     it("returns proper transfers", async () => {
  //       const txReceipt = toTxReceipt(addressOutOfRange);
  //       const transfers = await transferService.getTransfers(
  //         txReceipt.logs,
  //         blockDetails,
  //         [],
  //         transactionDetails,
  //         txReceipt
  //       );
  //       expect(transfers).toStrictEqual([
  //         {
  //           blockNumber: 4985412,
  //           fields: { tokenId: BigInt("0x15") },
  //           from: "0x76ff48d4bd33b4d5943bc82b8ee9ccaf079bcaaf",
  //           logIndex: 5,
  //           timestamp: receivedAt,
  //           to: "0x76ff48d4bd33b4d5943bc82b8ee9ccaf079bcaaf",
  //           tokenAddress: "0x39c4bdfac23d10180e01c09bedfa0a508d4ad4d3",
  //           tokenType: TokenType.ERC721,
  //           transactionHash: "0x52cdf727855ce9310b69a75d84fa23662d451e2dbcea64f3b277db12d78ab9ef",
  //           transactionIndex: 1,
  //           type: "mint",
  //           isFeeOrRefund: false,
  //           isInternal: false,
  //           amount: undefined,
  //         },
  //         {
  //           blockNumber: 4985412,
  //           fields: { tokenId: BigInt("0x015ef3c4") },
  //           from: "0x38686aa0f4e8fc2fd2910272671b26ff9c53c73a",
  //           logIndex: 6,
  //           timestamp: receivedAt,
  //           to: "0x38686aa0f4e8fc2fd2910272671b26ff9c53c73a",
  //           tokenAddress: "0x6dd28c2c5b91dd63b4d4e78ecac7139878371768",
  //           tokenType: TokenType.ERC721,
  //           transactionHash: "0x52cdf727855ce9310b69a75d84fa23662d451e2dbcea64f3b277db12d78ab9ef",
  //           transactionIndex: 1,
  //           type: "mint",
  //           isFeeOrRefund: false,
  //           isInternal: false,
  //           amount: undefined,
  //         },
  //         {
  //           blockNumber: 4985412,
  //           fields: { tokenId: BigInt("0x016ef3c4") },
  //           from: "0x38686aa0f4e8fc2fd2910272671b26ff9c53c73a",
  //           logIndex: 7,
  //           timestamp: receivedAt,
  //           to: "0x48686aa0f4e8fc2fd2910272671b26ff9c53c73a",
  //           tokenAddress: "0x6dd28c2c5b91dd63b4d4e78ecac7139878371768",
  //           tokenType: TokenType.ERC721,
  //           transactionHash: "0x52cdf727855ce9310b69a75d84fa23662d451e2dbcea64f3b277db12d78ab9ef",
  //           transactionIndex: 1,
  //           type: "transfer",
  //           isFeeOrRefund: false,
  //           isInternal: false,
  //           amount: undefined,
  //         },
  //       ]);
  //     });
  //   });

  //   describe("when tx contains transfer log which fails to be parsed", () => {
  //     it("throws an error", async () => {
  //       const txReceipt = toTxReceipt(logParsingError);
  //       await expect(
  //         transferService.getTransfers(txReceipt.logs, blockDetails, [], transactionDetails, txReceipt)
  //       ).rejects.toThrowError();
  //     });
  //   });

  //   describe("when there is no deposit after fee", () => {
  //     const txReceipt = toTxReceipt(noDepositAfterFee);

  //     it("returns 0 refund refunds", async () => {
  //       const expectedTransfers = [
  //         {
  //           from: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //           to: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //           transactionHash: "0xad909404d4390c350281c9e896cfadc528d071cb87c62f4ed026016fd4694d77",
  //           blockNumber: 7485644,
  //           amount: BigInt("0x2386f26fc10000"),
  //           tokenAddress: "0x000000000000000000000000000000000000800a",
  //           tokenType: TokenType.BaseToken,
  //           type: "deposit",
  //           isFeeOrRefund: false,
  //           isInternal: false,
  //           logIndex: 0,
  //           transactionIndex: 0,
  //           timestamp: receivedAt,
  //         },
  //         {
  //           from: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //           to: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //           transactionHash: "0xad909404d4390c350281c9e896cfadc528d071cb87c62f4ed026016fd4694d77",
  //           blockNumber: 7485644,
  //           amount: BigInt("0x2386f26fc10000"),
  //           tokenAddress: "0x000000000000000000000000000000000000800a",
  //           tokenType: TokenType.BaseToken,
  //           type: "transfer",
  //           isFeeOrRefund: false,
  //           isInternal: false,
  //           logIndex: 1,
  //           transactionIndex: 0,
  //           timestamp: receivedAt,
  //         },
  //         {
  //           from: "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28",
  //           to: "0x0000000000000000000000000000000000008001",
  //           transactionHash: "0xad909404d4390c350281c9e896cfadc528d071cb87c62f4ed026016fd4694d77",
  //           blockNumber: 7485644,
  //           amount: BigInt("0x0141b56ff62900"),
  //           tokenAddress: "0x000000000000000000000000000000000000800a",
  //           tokenType: TokenType.BaseToken,
  //           type: "fee",
  //           isFeeOrRefund: true,
  //           isInternal: false,
  //           logIndex: 2,
  //           transactionIndex: 0,
  //           timestamp: receivedAt,
  //         },
  //       ];

  //       const transfers = await transferService.getTransfers(
  //         txReceipt.logs,
  //         blockDetails,
  //         [],
  //         transactionDetails,
  //         txReceipt
  //       );
  //       expect(transfers).toStrictEqual(expectedTransfers);
  //     });
  //   });

  //   describe("when there are no deposits except fee", () => {
  //     const txReceipt = toTxReceipt(feeWithNoDeposits);

  //     it("returns fee with initiator address", async () => {
  //       const expectedTransfers = [
  //         {
  //           from: "0xA38EDFcc55164a59e0f33918D13a2d559BC11df8",
  //           to: "0x0000000000000000000000000000000000008001",
  //           transactionHash: "0xad909404d4390c350281c9e896cfadc528d071cb87c62f4ed026016fd4694d77",
  //           blockNumber: 7485644,
  //           amount: BigInt("0x0141b56ff62900"),
  //           tokenAddress: "0x000000000000000000000000000000000000800a",
  //           tokenType: TokenType.BaseToken,
  //           type: "fee",
  //           isFeeOrRefund: true,
  //           isInternal: false,
  //           logIndex: 2,
  //           transactionIndex: 0,
  //           timestamp: receivedAt,
  //         },
  //       ];

  //       const transfers = await transferService.getTransfers(
  //         txReceipt.logs,
  //         blockDetails,
  //         [],
  //         transactionDetails,
  //         txReceipt
  //       );
  //       expect(transfers).toStrictEqual(expectedTransfers);
  //     });
  //   });

  //   describe("when no transaction data is passed", () => {
  //     const txReceipt = toTxReceipt(greeterDeployToL2);

  //     it("returns proper transfers", async () => {
  //       const expectedTransfers = [
  //         {
  //           amount: BigInt("0x01baa818335500"),
  //           blockNumber: 3230131,
  //           from: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
  //           to: "0x0000000000000000000000000000000000008001",
  //           tokenAddress: "0x000000000000000000000000000000000000800a",
  //           tokenType: TokenType.BaseToken,
  //           transactionHash: "0x7ec71b1d5369b830af3f7af4b1ef0f04e62cc3775b1c090434a93493d1b68632",
  //           type: "fee",
  //           isFeeOrRefund: true,
  //           isInternal: false,
  //           logIndex: 2,
  //           transactionIndex: 1,
  //           timestamp: new Date(blockDetails.timestamp * 1000),
  //         },
  //       ];
  //       const transfers = await transferService.getTransfers(txReceipt.logs, blockDetails);
  //       expect(transfers).toStrictEqual(expectedTransfers);
  //     });
  //   });

  //   describe("block with no transactions", () => {
  //     it("returns proper transfers", async () => {
  //       const blockDate = new Date();
  //       blockDetails.timestamp = blockDate.getTime() / 1000;

  //       const expectedTransfers = [
  //         {
  //           amount: BigInt("0xf22ec29c9c4980"),
  //           blockNumber: 6711853,
  //           from: "0x0000000000000000000000000000000000008001",
  //           isFeeOrRefund: false,
  //           isInternal: true,
  //           logIndex: 0,
  //           timestamp: blockDate,
  //           to: "0xa9232040bf0e0aea2578a5b2243f2916dbfc0a69",
  //           tokenAddress: "0x000000000000000000000000000000000000800a",
  //           tokenType: "BASETOKEN",
  //           transactionHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
  //           transactionIndex: 0,
  //           type: "transfer",
  //         },
  //       ];

  //       const transfers = await transferService.getTransfers(
  //         blockWithNoTxsLogs as unknown as types.Log[],
  //         blockDetails
  //       );
  //       expect(transfers).toStrictEqual(expectedTransfers);
  //     });
  //   });
  //});

  describe("legacy/Asset Router deduplication", () => {
    let dedupTransferService: TransferService;
    let blockchainService: ReturnType<typeof mock<BlockchainService>>;
    let configService: ReturnType<typeof mock<ConfigService>>;
    let block: Block;
    let receipt: TransactionReceipt;

    const withTrustedBridges = (addresses: string[]) => {
      const trusted = new Set(addresses.map((a) => a.toLowerCase()));
      configService.get.mockImplementation((key: string) => (key === "trustedBridgeAddresses" ? trusted : undefined));
    };

    beforeEach(() => {
      logIndexCounter = 0;
      blockchainService = mock<BlockchainService>();
      blockchainService.getTokenAddressByAssetId.mockImplementation(async (assetId: string) => {
        if (assetId.toLowerCase() === ASSET_ID_AR.toLowerCase()) return TOKEN_ASSET_ROUTER;
        if (assetId.toLowerCase() === ASSET_ID_DUP.toLowerCase()) return TOKEN_LEGACY;
        return EXTRA_ADDRESS;
      });
      configService = mock<ConfigService>();
      // Both the legacy Lido bridge and the Asset Router are trusted.
      withTrustedBridges([LEGACY_BRIDGE, L2_ASSET_ROUTER_ADDRESS]);
      dedupTransferService = new TransferService(blockchainService, configService);
      block = mock<Block>({ timestamp: 1700000000 });
      receipt = mock<TransactionReceipt>({ type: 2, from: SENDER, to: RECEIVER });
    });

    describe("independent legacy + Asset Router withdrawals in one transaction", () => {
      it("keeps both when the legacy withdrawal is emitted first", async () => {
        const logs = [
          legacyWithdrawalLog(TOKEN_LEGACY, BigInt(100)),
          assetRouterWithdrawalLog(ASSET_ID_AR, BigInt(200)),
        ];
        const transfers = await dedupTransferService.getTransfers(logs, block, [], receipt);
        const withdrawals = transfers.filter((t) => t.type === TransferType.Withdrawal);
        expect(withdrawals).toHaveLength(2);
        expect(withdrawals.map((t) => t.tokenAddress).sort()).toEqual([TOKEN_ASSET_ROUTER, TOKEN_LEGACY].sort());
      });

      it("keeps both when the Asset Router withdrawal is emitted first (reversed order)", async () => {
        const logs = [
          assetRouterWithdrawalLog(ASSET_ID_AR, BigInt(200)),
          legacyWithdrawalLog(TOKEN_LEGACY, BigInt(100)),
        ];
        const transfers = await dedupTransferService.getTransfers(logs, block, [], receipt);
        const withdrawals = transfers.filter((t) => t.type === TransferType.Withdrawal);
        expect(withdrawals).toHaveLength(2);
        expect(withdrawals.map((t) => t.tokenAddress).sort()).toEqual([TOKEN_ASSET_ROUTER, TOKEN_LEGACY].sort());
      });
    });

    describe("genuine double-emit of a single logical action", () => {
      it("collapses a legacy FinalizeDeposit and its identical DepositFinalizedAssetRouter into one record", async () => {
        // Emission order on-chain: the Asset Router event precedes the legacy event.
        const logs = [assetRouterDepositLog(ASSET_ID_DUP, BigInt(100)), legacyDepositLog(TOKEN_LEGACY, BigInt(100))];
        const transfers = await dedupTransferService.getTransfers(logs, block, [], receipt);
        const deposits = transfers.filter((t) => t.type === TransferType.Deposit);
        expect(deposits).toHaveLength(1);
        // The Asset Router record is the one kept (it carries chainId).
        expect(deposits[0].chainId).toBe("1");
        expect(deposits[0].tokenAddress).toBe(TOKEN_LEGACY);
        expect(deposits[0].amount).toBe(BigInt(100));
      });

      it("collapses regardless of log order", async () => {
        const logs = [legacyDepositLog(TOKEN_LEGACY, BigInt(100)), assetRouterDepositLog(ASSET_ID_DUP, BigInt(100))];
        const transfers = await dedupTransferService.getTransfers(logs, block, [], receipt);
        expect(transfers.filter((t) => t.type === TransferType.Deposit)).toHaveLength(1);
      });
    });

    describe("same-family transfers are never deduplicated against each other", () => {
      it("keeps two Asset Router withdrawals with identical fields", async () => {
        const logs = [
          assetRouterWithdrawalLog(ASSET_ID_AR, BigInt(200)),
          assetRouterWithdrawalLog(ASSET_ID_AR, BigInt(200)),
        ];
        const transfers = await dedupTransferService.getTransfers(logs, block, [], receipt);
        expect(transfers.filter((t) => t.type === TransferType.Withdrawal)).toHaveLength(2);
      });
    });

    describe("untrusted legacy emitter", () => {
      it("does not index the legacy withdrawal and does not suppress the Asset Router withdrawal", async () => {
        // Only the Asset Router is trusted; the legacy Lido bridge is not.
        withTrustedBridges([L2_ASSET_ROUTER_ADDRESS]);
        const logs = [
          legacyWithdrawalLog(TOKEN_LEGACY, BigInt(100)),
          assetRouterWithdrawalLog(ASSET_ID_AR, BigInt(200)),
        ];
        const transfers = await dedupTransferService.getTransfers(logs, block, [], receipt);
        const withdrawals = transfers.filter((t) => t.type === TransferType.Withdrawal);
        expect(withdrawals).toHaveLength(1);
        expect(withdrawals[0].tokenAddress).toBe(TOKEN_ASSET_ROUTER);
      });
    });
  });
});
