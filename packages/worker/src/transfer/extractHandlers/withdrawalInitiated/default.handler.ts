import { utils, types } from "zksync-web3";
import { Transfer } from "../../interfaces/transfer.interface";
import { ExtractTransferHandler } from "../../interfaces/extractTransferHandler.interface";
import { TransferType } from "../../../entities/transfer.entity";
import { unixTimeToDate } from "../../../utils/date";
import parseLog from "../../../utils/parseLog";
import { CONTRACT_INTERFACES } from "../../../constants";

export const defaultWithdrawalInitiatedHandler: ExtractTransferHandler = {
  matches: (): boolean => true,
  extract: (
    log: types.Log,
    blockDetails: types.BlockDetails,
    transactionDetails?: types.TransactionDetails
  ): Transfer => {
    const parsedLog = parseLog(CONTRACT_INTERFACES.L2_BRIDGE, log);

    return {
      from: parsedLog.args.l2Sender.toLowerCase(),
      to: parsedLog.args.l1Receiver.toLowerCase(),
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      amount: parsedLog.args.amount,
      tokenAddress:
        parsedLog.args.l2Token === utils.ETH_ADDRESS
          ? utils.L2_ETH_TOKEN_ADDRESS
          : parsedLog.args.l2Token.toLowerCase(),
      type: TransferType.Withdrawal,
      isFeeOrRefund: false,
      logIndex: log.logIndex,
      transactionIndex: log.transactionIndex,
      timestamp: transactionDetails?.receivedAt || unixTimeToDate(blockDetails.timestamp),
    };
  },
};
