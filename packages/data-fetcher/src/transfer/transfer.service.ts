import { types, utils } from "zksync-ethers";
import { Injectable, Logger } from "@nestjs/common";
import { BlockchainService } from "../blockchain/blockchain.service";
import { LogType } from "../log/logType";
import isInternalTransaction from "../utils/isInternalTransaction";
import { ExtractTransferHandler } from "./interfaces/extractTransferHandler.interface";
import { Transfer } from "./interfaces/transfer.interface";
import {
  defaultFinalizeDepositHandler,
  assetRouterFinalizeDepositHandler,
  defaultWithdrawalInitiatedHandler,
  assetRouterWithdrawalInitiatedHandler,
  erc721TransferHandler,
  contractDeployerTransferHandler,
  defaultTransferHandler,
  ethMintFromL1Handler,
  ethWithdrawalToL1Handler,
} from "./extractHandlers";
import { BASE_TOKEN_ADDRESS } from "../constants";
export enum TransferType {
  Deposit = "deposit",
  Transfer = "transfer",
  Withdrawal = "withdrawal",
  Fee = "fee",
  Mint = "mint",
  Refund = "refund",
}

const extractTransfersHandlers: Record<string, ExtractTransferHandler[]> = {
  [LogType.FinalizeDeposit]: [defaultFinalizeDepositHandler],
  [LogType.DepositFinalizedAssetRouter]: [assetRouterFinalizeDepositHandler],
  [LogType.WithdrawalInitiated]: [defaultWithdrawalInitiatedHandler],
  [LogType.WithdrawalInitiatedAssetRouter]: [assetRouterWithdrawalInitiatedHandler],
  [LogType.Transfer]: [erc721TransferHandler, contractDeployerTransferHandler, defaultTransferHandler],
  [LogType.Mint]: [ethMintFromL1Handler],
  [LogType.Withdrawal]: [ethWithdrawalToL1Handler],
};

// Array of logs that tell about the same event, e.g. one is legacy another is a new one.
// This is used to make sure multiple transfers are not produces by these logs.
const conflictingTransferLogs = [
  [LogType.FinalizeDeposit, LogType.DepositFinalizedAssetRouter],
  [LogType.WithdrawalInitiated, LogType.WithdrawalInitiatedAssetRouter],
];

@Injectable()
export class TransferService {
  private readonly logger: Logger;

  constructor(private readonly blockchainService: BlockchainService) {
    this.logger = new Logger(TransferService.name);
  }

  public async getTransfers(
    logs: ReadonlyArray<types.Log>,
    blockDetails: types.BlockDetails,
    transactionDetails?: types.TransactionDetails,
    transactionReceipt?: types.TransactionReceipt
  ): Promise<Transfer[]> {
    const transfers: Transfer[] = [];
    if (!logs) {
      return transfers;
    }

    // Remove handlers for logs that tell about the same event as other present logs
    // This is done to avoid having duplicated transfers produces
    const uniqueExtractTransfersHandlers = {
      ...extractTransfersHandlers,
    };
    for (const topics of conflictingTransferLogs) {
      const firstMatchingLog = logs.find((log) => topics.find((topic) => log.topics[0] === topic));
      if (firstMatchingLog) {
        const topicsToRemoveHandlers = topics.filter((t) => t !== firstMatchingLog.topics[0]);
        for (const topicToRemoveHandlers of topicsToRemoveHandlers) {
          delete uniqueExtractTransfersHandlers[topicToRemoveHandlers];
        }
      }
    }

    for (const log of logs) {
      const handlerForLog = uniqueExtractTransfersHandlers[log.topics[0]]?.find((handler) =>
        handler.matches(log, transactionReceipt)
      );

      if (!handlerForLog) {
        continue;
      }

      try {
        const transfer = await handlerForLog.extract(log, this.blockchainService, blockDetails, transactionDetails);
        if (transfer) {
          transfers.push(transfer);
        }
      } catch (error) {
        this.logger.error("Failed to parse transfer", {
          stack: error.stack,
          blockNumber: blockDetails.number,
          logIndex: log.index,
          transactionHash: log.transactionHash,
        });
        throw error;
      }
    }

    if (transfers.length) {
      this.formatFeeAndRefundDeposits(transfers, transactionDetails);
      this.markInternalTransactions(transfers, transactionReceipt);
    }

    return transfers;
  }

  // Identifies and formats fee and refund deposits for ETH and ERC20 deposits
  private formatFeeAndRefundDeposits(transfers: Transfer[], transactionDetails?: types.TransactionDetails) {
    if (!transactionDetails?.isL1Originated) {
      return;
    }
    const ethDeposits = transfers.filter(
      (t) => t.type === TransferType.Deposit && t.tokenAddress === BASE_TOKEN_ADDRESS
    );
    const feeDeposit = ethDeposits.find((t) => t.to === utils.BOOTLOADER_FORMAL_ADDRESS);
    if (!feeDeposit) {
      return;
    }

    const nonFeeDeposits = ethDeposits.filter((t) => t.to !== utils.BOOTLOADER_FORMAL_ADDRESS);
    feeDeposit.type = TransferType.Fee;
    feeDeposit.isFeeOrRefund = true;
    // For ERC20 deposits initiatorAddress is set to bridge creator account, so we should use an address from deposit instead.
    // For ETH deposits both initiatorAddress and deposit.from are the same, so either one can be used.
    feeDeposit.from = nonFeeDeposits.length ? nonFeeDeposits[0].from : transactionDetails.initiatorAddress;

    const depositsAfterFee = nonFeeDeposits.filter((t) => t.logIndex > feeDeposit.logIndex);
    if (!depositsAfterFee.length) {
      return;
    }
    // Assuming refund deposit is the last deposit and it should go after the fee deposit.
    const refundDeposit = depositsAfterFee[depositsAfterFee.length - 1];
    refundDeposit.type = TransferType.Refund;
    refundDeposit.isFeeOrRefund = true;
    refundDeposit.from = utils.BOOTLOADER_FORMAL_ADDRESS;
  }

  private markInternalTransactions(transfers: Transfer[], transactionReceipt?: types.TransactionReceipt) {
    transfers.forEach((transfer) => {
      transfer.isInternal = isInternalTransaction(transfer, transactionReceipt);
    });
  }
}
