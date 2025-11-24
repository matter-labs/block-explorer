import { type Log, type Block } from "ethers";
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
  extract: async (log: Log, _, block: Block): Promise<Transfer> => {
    const parsedLog = parseLog(CONTRACT_INTERFACES.L2_SHARED_BRIDGE, log);

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
