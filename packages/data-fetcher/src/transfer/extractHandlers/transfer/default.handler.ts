import { type Log, type Block } from "ethers";
import { Transfer } from "../../interfaces/transfer.interface";
import { ExtractTransferHandler } from "../../interfaces/extractTransferHandler.interface";
import { TransferType } from "../../transfer.service";
import { TokenType } from "../../../token/token.service";
import { unixTimeToDate } from "../../../utils/date";
import parseLog from "../../../utils/parseLog";
import { isBaseToken } from "../../../utils/token";
import { CONTRACT_INTERFACES, BOOTLOADER_FORMAL_ADDRESS } from "../../../constants";

export const defaultTransferHandler: ExtractTransferHandler = {
  matches: (log: Log): boolean => log.topics.length === 3,
  extract: async (log: Log, _, block: Block): Promise<Transfer> => {
    const parsedLog = parseLog(CONTRACT_INTERFACES.ERC20, log);

    let transferType: TransferType = TransferType.Transfer;
    if (parsedLog.args.to === BOOTLOADER_FORMAL_ADDRESS) {
      transferType = TransferType.Fee;
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
      timestamp: unixTimeToDate(block.timestamp),
    };
  },
};
