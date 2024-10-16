import { utils, types } from "zksync-ethers";
import { Transfer } from "../../interfaces/transfer.interface";
import { ExtractTransferHandler } from "../../interfaces/extractTransferHandler.interface";
import { TransferType } from "../../transfer.service";
import { TokenType } from "../../../token/token.service";
import { unixTimeToDate } from "../../../utils/date";
import parseLog from "../../../utils/parseLog";
import { isBaseToken } from "../../../utils/token";
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
    }
    // if transactionDetails is null it means that this transfer comes from a block with
    // no transactions and it is a reward to an operator address, so it's a transfer and not a refund
    else if (parsedLog.args.from === utils.BOOTLOADER_FORMAL_ADDRESS && transactionDetails) {
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
      tokenType: isBaseToken(tokenAddress) ? TokenType.BaseToken : TokenType.ERC20,
      isFeeOrRefund: [TransferType.Fee, TransferType.Refund].includes(transferType),
      logIndex: log.index,
      transactionIndex: log.transactionIndex,
      timestamp: transactionDetails?.receivedAt || unixTimeToDate(blockDetails.timestamp),
    };
  },
};
