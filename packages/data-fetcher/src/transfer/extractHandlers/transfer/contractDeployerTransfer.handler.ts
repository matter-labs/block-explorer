import { utils, types } from "zksync-ethers";
import { ExtractTransferHandler } from "../../interfaces/extractTransferHandler.interface";
import { Transfer } from "../../interfaces/transfer.interface";
import { ZERO_HASH_64 } from "../../../constants";
import { TransferType } from "../../transfer.service";
import { TokenType } from "../../../token/token.service";
import { unixTimeToDate } from "../../../utils/date";
import parseLog from "../../../utils/parseLog";
import { CONTRACT_INTERFACES } from "../../../constants";

export const contractDeployerTransferHandler: ExtractTransferHandler = {
  matches: (log: types.Log, transactionReceipt: types.TransactionReceipt): boolean =>
    transactionReceipt?.to === utils.CONTRACT_DEPLOYER_ADDRESS &&
    (log.topics.length === 1 || log.topics[1] === ZERO_HASH_64),
  extract: (
    log: types.Log,
    blockDetails: types.BlockDetails,
    transactionDetails?: types.TransactionDetails
  ): Transfer => {
    const parsedLog =
      log.topics.length === 1
        ? parseLog(CONTRACT_INTERFACES.TRANSFER_WITH_NO_INDEXES, log)
        : parseLog(CONTRACT_INTERFACES.ERC20, log);
    return {
      from: parsedLog.args.to.toLowerCase(),
      to: parsedLog.args.to.toLowerCase(),
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      amount: parsedLog.args.value,
      tokenAddress: log.address.toLowerCase(),
      type: TransferType.Mint,
      tokenType: TokenType.ERC20,
      isFeeOrRefund: false,
      logIndex: log.index,
      transactionIndex: log.transactionIndex,
      timestamp: transactionDetails?.receivedAt || unixTimeToDate(blockDetails.timestamp),
    };
  },
};
