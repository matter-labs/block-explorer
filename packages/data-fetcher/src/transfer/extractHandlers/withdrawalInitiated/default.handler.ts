import { type Log, type Block } from "ethers";
import { BlockchainService } from "../../../blockchain/blockchain.service";
import { Transfer } from "../../interfaces/transfer.interface";
import { ExtractTransferHandler } from "../../interfaces/extractTransferHandler.interface";
import { TransferType } from "../../transfer.service";
import { TokenType } from "../../../token/token.service";
import { unixTimeToDate } from "../../../utils/date";
import parseLog from "../../../utils/parseLog";
import { isBaseToken } from "../../../utils/token";
import { BASE_TOKEN_ADDRESS, CONTRACT_INTERFACES, ETH_L1_ADDRESS } from "../../../constants";

export const defaultWithdrawalInitiatedHandler: ExtractTransferHandler = {
  matches: (): boolean => true,
  extract: async (log: Log, blockchainService: BlockchainService, block: Block): Promise<Transfer> => {
    // The legacy WithdrawalInitiated event has no single authoritative emitter (the canonical shared bridge
    // plus deployment-specific custom token bridges), so authenticate against the trusted bridge set
    // rather than indexing any contract's ABI-shaped log as a real bridge withdrawal.
    const trustedBridgeAddresses = await blockchainService.getTrustedLegacyBridgeAddresses();
    if (!trustedBridgeAddresses.has(log.address.toLowerCase())) {
      return null;
    }
    const parsedLog = parseLog(CONTRACT_INTERFACES.L2_SHARED_BRIDGE, log);
    if (!parsedLog) {
      return null;
    }

    const tokenAddress =
      parsedLog.args.l2Token === ETH_L1_ADDRESS ? BASE_TOKEN_ADDRESS : parsedLog.args.l2Token.toLowerCase();

    return {
      from: parsedLog.args.l2Sender.toLowerCase(),
      to: parsedLog.args.l1Receiver.toLowerCase(),
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      amount: parsedLog.args.amount,
      tokenAddress,
      type: TransferType.Withdrawal,
      tokenType: isBaseToken(tokenAddress) ? TokenType.BaseToken : TokenType.ERC20,
      isFeeOrRefund: false,
      logIndex: log.index,
      transactionIndex: log.transactionIndex,
      timestamp: unixTimeToDate(block.timestamp),
    };
  },
};
