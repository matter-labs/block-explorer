import { types } from "zksync-ethers";
import { Transfer } from "../../interfaces/transfer.interface";
import { ExtractTransferHandler } from "../../interfaces/extractTransferHandler.interface";
import { TransferType } from "../../transfer.service";
import { TokenType } from "../../../token/token.service";
import { unixTimeToDate } from "../../../utils/date";
import parseLog from "../../../utils/parseLog";
import { BASE_TOKEN_ADDRESS, CONTRACT_INTERFACES } from "../../../constants";
export const ethMintFromL1Handler: ExtractTransferHandler = {
  matches: (log: types.Log): boolean => log.address.toLowerCase() === BASE_TOKEN_ADDRESS,
  extract: (
    log: types.Log,
    blockDetails: types.BlockDetails,
    transactionDetails?: types.TransactionDetails
  ): Transfer => {
    const parsedLog = parseLog(CONTRACT_INTERFACES.ETH_TOKEN, log);

    return {
      from: parsedLog.args.account.toLowerCase(),
      to: parsedLog.args.account.toLowerCase(),
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      amount: parsedLog.args.amount,
      tokenAddress: BASE_TOKEN_ADDRESS,
      type: TransferType.Deposit,
      tokenType: TokenType.BaseToken,
      isFeeOrRefund: false,
      logIndex: log.index,
      transactionIndex: log.transactionIndex,
      timestamp: transactionDetails?.receivedAt || unixTimeToDate(blockDetails.timestamp),
    };
  },
};
