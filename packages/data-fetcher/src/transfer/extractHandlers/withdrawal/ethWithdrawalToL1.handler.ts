import { utils, types } from "zksync-web3";
import { Transfer } from "../../interfaces/transfer.interface";
import { ExtractTransferHandler } from "../../interfaces/extractTransferHandler.interface";
import { TransferType } from "../../transfer.service";
import { TokenType } from "../../../token/token.service";
import { unixTimeToDate } from "../../../utils/date";
import parseLog from "../../../utils/parseLog";
import { CONTRACT_INTERFACES } from "../../../constants";

export const ethWithdrawalToL1Handler: ExtractTransferHandler = {
  matches: (log: types.Log): boolean => log.address.toLowerCase() === utils.L2_ETH_TOKEN_ADDRESS,
  extract: (
    log: types.Log,
    blockDetails: types.BlockDetails,
    transactionDetails?: types.TransactionDetails
  ): Transfer => {
    const parsedLog = parseLog(CONTRACT_INTERFACES.ETH_TOKEN, log);
    return {
      from: parsedLog.args._l2Sender.toLowerCase(),
      to: parsedLog.args._l1Receiver.toLowerCase(),
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      amount: parsedLog.args._amount,
      tokenAddress: utils.L2_ETH_TOKEN_ADDRESS,
      type: TransferType.Withdrawal,
      tokenType: TokenType.ETH,
      isFeeOrRefund: false,
      logIndex: log.logIndex,
      transactionIndex: log.transactionIndex,
      timestamp: transactionDetails?.receivedAt || unixTimeToDate(blockDetails.timestamp),
    };
  },
};
