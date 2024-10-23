import { utils, types } from "zksync-ethers";
import { Transfer } from "../../interfaces/transfer.interface";
import { ExtractTransferHandler } from "../../interfaces/extractTransferHandler.interface";
import { TransferType } from "../../transfer.service";
import { TokenType } from "../../../token/token.service";
import { unixTimeToDate } from "../../../utils/date";
import parseLog from "../../../utils/parseLog";
import { CONTRACT_INTERFACES } from "../../../constants";

export const erc721TransferHandler: ExtractTransferHandler = {
  matches: (log: types.Log): boolean => log.topics.length === 4,
  extract: (
    log: types.Log,
    blockDetails: types.BlockDetails,
    transactionDetails?: types.TransactionDetails
  ): Transfer => {
    const parsedLog = parseLog(CONTRACT_INTERFACES.ERC721, log);

    let type = TransferType.Transfer;
    let from = parsedLog.args.from;

    if (parsedLog.args.from === utils.ETH_ADDRESS) {
      type = TransferType.Mint;
      from = parsedLog.args.to;
    }

    return {
      from: from.toLowerCase(),
      to: parsedLog.args.to.toLowerCase(),
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      amount: parsedLog.args.value,
      fields: {
        tokenId: parsedLog.args[2],
      },
      tokenAddress: log.address.toLowerCase(),
      type,
      tokenType: TokenType.ERC721,
      isFeeOrRefund: false,
      logIndex: log.index,
      transactionIndex: log.transactionIndex,
      timestamp: transactionDetails?.receivedAt || unixTimeToDate(blockDetails.timestamp),
    };
  },
};
