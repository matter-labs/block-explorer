import { utils, types } from "zksync-web3";
import { Transfer } from "../../interfaces/transfer.interface";
import { ExtractTransferHandler } from "../../interfaces/extractTransferHandler.interface";
import { TransferType } from "../../../entities/transfer.entity";
import { TokenType } from "../../../entities/token.entity";
import { unixTimeToDate } from "../../../utils/date";
import parseLog from "../../../utils/parseLog";
import { CONTRACT_INTERFACES } from "../../../constants";

export const defaultTransferHandler: ExtractTransferHandler = {
  matches: (log: types.Log): boolean => log.topics.length === 3,
  extract: (
    log: types.Log,
    blockDetails: types.BlockDetails,
    transactionDetails?: types.TransactionDetails
  ): Transfer => {
    const parsedLog = parseLog(CONTRACT_INTERFACES.ERC20, log);

    let transferType: TransferType = TransferType.Transfer;
    if (parsedLog.args.to === utils.BOOTLOADER_FORMAL_ADDRESS) {
      transferType = TransferType.Fee;
    } else if (parsedLog.args.from === utils.BOOTLOADER_FORMAL_ADDRESS) {
      transferType = TransferType.Refund;
    }

    const tokenAddress = log.address.toLowerCase();

    return {
      from: parsedLog.args.from.toLowerCase(),
      to: parsedLog.args.to.toLowerCase(),
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      amount: parsedLog.args.value,
      tokenAddress,
      type: transferType,
      tokenType: tokenAddress === utils.L2_ETH_TOKEN_ADDRESS ? TokenType.ETH : TokenType.ERC20,
      isFeeOrRefund: [TransferType.Fee, TransferType.Refund].includes(transferType),
      logIndex: log.logIndex,
      transactionIndex: log.transactionIndex,
      timestamp: transactionDetails?.receivedAt || unixTimeToDate(blockDetails.timestamp),
    };
  },
};
