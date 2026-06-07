import { AbiCoder } from "ethers";
import { types } from "zksync-ethers";
import { mock } from "jest-mock-extended";
import { BlockchainService } from "../../../blockchain/blockchain.service";
import { TransferType } from "../../transfer.service";
import { TokenType } from "../../../token/token.service";
import { assetRouterWithdrawalInitiatedHandler } from "./assetRouter.handler";
import { BASE_TOKEN_ADDRESS } from "../../../constants";

describe("assetRouterWithdrawalInitiatedHandler", () => {
  const ASSET_ID = "0x0100015e85bd5298f50b3eb55fbabf76b1d2bbd6f9a47e7a8db5dc7d8e2c2a52";
  const L2_SENDER = "0xfb7e0856e44eff812a44a9f47733d7d55c39aa28";
  const RECEIVER = "0xc62a6e5d98b3a0de9ec4a930fbb354443e92e9e0";
  const TOKEN_ADDRESS = "0xdc187378edd8ed1585fb47549cc5fe633295d571";
  const AMOUNT = BigInt("0x016345785d8a0000");
  const CHAIN_ID = BigInt(271);
  const BRIDGE_ADDRESS = "0x0000000000000000000000000000000000010003";

  const encodeAssetData = (amount: bigint, receiver: string): string =>
    AbiCoder.defaultAbiCoder().encode(
      ["uint256", "address", "address"],
      [amount, receiver, "0x0000000000000000000000000000000000000000"]
    );

  const encodeLogData = (chainId: bigint, assetData: string): string =>
    AbiCoder.defaultAbiCoder().encode(["uint256", "bytes"], [chainId, assetData]);

  let log: types.Log;
  let blockDetails: types.BlockDetails;
  let blockchainService: BlockchainService;

  beforeEach(() => {
    log = mock<types.Log>({
      transactionIndex: 1,
      blockNumber: 3233097,
      transactionHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
      address: BRIDGE_ADDRESS,
      topics: [
        "0x55362fc62473cb1255e770af5d5e02ba6ee5bc7ed6969c30eb11ca31b92384dc",
        `0x000000000000000000000000${L2_SENDER.slice(2)}`,
        ASSET_ID,
      ],
      data: encodeLogData(CHAIN_ID, encodeAssetData(AMOUNT, RECEIVER)),
      index: 13,
      blockHash: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
    });
    blockDetails = mock<types.BlockDetails>({
      timestamp: new Date().getTime() / 1000,
    });
    blockchainService = mock<BlockchainService>({
      getTokenAddressByAssetId: jest.fn().mockResolvedValue(TOKEN_ADDRESS),
    });
  });

  describe("matches", () => {
    it("returns true when log address is a trusted bridge address", () => {
      const result = assetRouterWithdrawalInitiatedHandler.matches(log, null, new Set([BRIDGE_ADDRESS]));
      expect(result).toBe(true);
    });

    it("returns false when log address is not a trusted bridge address", () => {
      const result = assetRouterWithdrawalInitiatedHandler.matches(log, null, new Set<string>());
      expect(result).toBe(false);
    });

    it("returns false when no trusted bridge addresses are provided", () => {
      const result = assetRouterWithdrawalInitiatedHandler.matches(log, null);
      expect(result).toBe(false);
    });
  });

  describe("extract", () => {
    it("returns null when log cannot be parsed", async () => {
      log = mock<types.Log>({ ...log, data: "0x", topics: [] });
      const result = await assetRouterWithdrawalInitiatedHandler.extract(log, blockchainService, blockDetails);
      expect(result).toBeNull();
    });

    it("resolves tokenAddress via getTokenAddressByAssetId using assetId from topics", async () => {
      await assetRouterWithdrawalInitiatedHandler.extract(log, blockchainService, blockDetails);
      expect(blockchainService.getTokenAddressByAssetId).toHaveBeenCalledWith(ASSET_ID);
    });

    it("extracts transfer with from populated with lower cased l2Sender", async () => {
      const result = await assetRouterWithdrawalInitiatedHandler.extract(log, blockchainService, blockDetails);
      expect(result.from).toBe(L2_SENDER);
    });

    it("extracts transfer with to populated from lower cased receiver in assetData", async () => {
      const result = await assetRouterWithdrawalInitiatedHandler.extract(log, blockchainService, blockDetails);
      expect(result.to).toBe(RECEIVER);
    });

    it("extracts transfer with amount decoded from assetData", async () => {
      const result = await assetRouterWithdrawalInitiatedHandler.extract(log, blockchainService, blockDetails);
      expect(result.amount).toStrictEqual(AMOUNT);
    });

    it("extracts transfer with tokenAddress populated and lower cased", async () => {
      const result = await assetRouterWithdrawalInitiatedHandler.extract(log, blockchainService, blockDetails);
      expect(result.tokenAddress).toBe(TOKEN_ADDRESS);
      expect(result.tokenType).toBe(TokenType.ERC20);
    });

    it("converts ETH address tokenAddress to base token address", async () => {
      (blockchainService.getTokenAddressByAssetId as jest.Mock).mockResolvedValue(
        "0x0000000000000000000000000000000000000000"
      );
      const result = await assetRouterWithdrawalInitiatedHandler.extract(log, blockchainService, blockDetails);
      expect(result.tokenAddress).toBe(BASE_TOKEN_ADDRESS);
      expect(result.tokenType).toBe(TokenType.BaseToken);
    });

    it("extracts transfer of withdrawal type", async () => {
      const result = await assetRouterWithdrawalInitiatedHandler.extract(log, blockchainService, blockDetails);
      expect(result.type).toBe(TransferType.Withdrawal);
    });

    it("adds isFeeOrRefund as false", async () => {
      const result = await assetRouterWithdrawalInitiatedHandler.extract(log, blockchainService, blockDetails);
      expect(result.isFeeOrRefund).toBe(false);
    });

    it("extracts transfer with populated transactionHash, blockNumber, logIndex, transactionIndex", async () => {
      const result = await assetRouterWithdrawalInitiatedHandler.extract(log, blockchainService, blockDetails);
      expect(result.transactionHash).toBe(log.transactionHash);
      expect(result.blockNumber).toBe(log.blockNumber);
      expect(result.logIndex).toBe(log.index);
      expect(result.transactionIndex).toBe(log.transactionIndex);
    });

    it("extracts transfer with block timestamp when transaction details are missing", async () => {
      const result = await assetRouterWithdrawalInitiatedHandler.extract(log, blockchainService, blockDetails);
      expect(result.timestamp).toEqual(new Date(blockDetails.timestamp * 1000));
    });

    describe("when transaction details are specified", () => {
      const receivedAt = new Date();
      const transactionDetails = mock<types.TransactionDetails>();
      transactionDetails.receivedAt = receivedAt;

      it("extracts transfer with timestamp equal to transaction receivedAt", async () => {
        const result = await assetRouterWithdrawalInitiatedHandler.extract(
          log,
          blockchainService,
          blockDetails,
          transactionDetails
        );
        expect(result.timestamp).toBe(receivedAt);
      });
    });
  });
});
