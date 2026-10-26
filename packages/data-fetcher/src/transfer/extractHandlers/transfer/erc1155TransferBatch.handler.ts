import { type Log, type Block } from "ethers";
import { Transfer } from "../../interfaces/transfer.interface";
import { ExtractTransferHandler } from "../../interfaces/extractTransferHandler.interface";
import { TransferType } from "../../transfer.service";
import { TokenType } from "../../../token/token.service";
import { unixTimeToDate } from "../../../utils/date";
import parseLog from "../../../utils/parseLog";
import { CONTRACT_INTERFACES, ETH_L1_ADDRESS } from "../../../constants";

// A batch event is split into one transfer per token id, so they are stored and displayed the same way as single transfers.
export const erc1155TransferBatchHandler: ExtractTransferHandler<Transfer[]> = {
  matches: (log: Log): boolean => log.topics.length === 4,
  extract: async (log: Log, _, block: Block): Promise<Transfer[]> => {
    const parsedLog = parseLog(CONTRACT_INTERFACES.ERC1155, log);
    if (!parsedLog) {
      return null;
    }

    // args are accessed by index as `values` name is shadowed by the Result.values() method
    const ids: bigint[] = parsedLog.args[3];
    const values: bigint[] = parsedLog.args[4];
    // The standard requires ids and values to be of the same length, a log violating it cannot be interpreted.
    if (ids.length !== values.length) {
      return null;
    }

    let type = TransferType.Transfer;
    let from = parsedLog.args.from;

    if (parsedLog.args.from === ETH_L1_ADDRESS) {
      type = TransferType.Mint;
      from = parsedLog.args.to;
    }

    return ids.map((id, index) => ({
      from: from.toLowerCase(),
      to: parsedLog.args.to.toLowerCase(),
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      amount: values[index],
      fields: {
        tokenId: id,
        operator: parsedLog.args.operator.toLowerCase(),
      },
      tokenAddress: log.address.toLowerCase(),
      type,
      tokenType: TokenType.ERC1155,
      isFeeOrRefund: false,
      logIndex: log.index,
      transactionIndex: log.transactionIndex,
      timestamp: unixTimeToDate(block.timestamp),
    }));
  },
};
