import { config } from "dotenv";
import { LogDescription, Interface, Log, AbiCoder } from "ethers";
import { types, utils, Provider } from "zksync-ethers";
import typeOrmCliDataSource from "../typeorm.config";
import { RetryableContract } from "../blockchain/retryableContract";
import logger from "../logger";
import { AddressTransfer, Transfer } from "../entities";

config();

const provider = new Provider(process.env.BLOCKCHAIN_RPC_URL);

const getTransfer = async (log: types.Log, transactionDetails: types.TransactionDetails) => {
  const logInterface = new Interface([
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "chainId",
          type: "uint256",
        },
        {
          indexed: true,
          internalType: "address",
          name: "l2Sender",
          type: "address",
        },
        {
          indexed: true,
          internalType: "bytes32",
          name: "assetId",
          type: "bytes32",
        },
        {
          indexed: false,
          internalType: "bytes",
          name: "assetData",
          type: "bytes",
        },
      ],
      name: "WithdrawalInitiatedAssetRouter",
      type: "event",
    },
  ]);
  const parsedLog = parseLog({ interface: logInterface }, log);
  const assetId = parsedLog.args.assetId;

  let tokenAddress = (await getTokenAddressByAssetId(assetId)).toLowerCase();
  if (tokenAddress === utils.ETH_ADDRESS.toLowerCase()) {
    tokenAddress = "0x000000000000000000000000000000000000800a";
  }

  const assetData = parsedLog.args.assetData;
  const [amount, receiver] = AbiCoder.defaultAbiCoder().decode(["uint256", "address", "address"], assetData);

  const receivedAt = new Date(transactionDetails.receivedAt);
  return {
    from: parsedLog.args.l2Sender.toLowerCase(),
    to: receiver.toLowerCase(),
    transactionHash: log.transactionHash,
    blockNumber: log.blockNumber,
    amount: amount,
    tokenAddress,
    type: "withdrawal",
    tokenType: isBaseToken(tokenAddress) ? "BASETOKEN" : "ERC20",
    isFeeOrRefund: false,
    logIndex: log.index,
    transactionIndex: log.transactionIndex,
    timestamp: new Date(receivedAt.getTime() + receivedAt.getTimezoneOffset() * 60000).toJSON(),
  };
};

const getLog = async (transactionHash: string, logIndex: number) => {
  const txReceipt = await provider.getTransactionReceipt(transactionHash);
  const log = txReceipt.logs.find((log) => log.index === logIndex);
  if (!log) {
    throw new Error(`Failed to find a log with index ${logIndex} for transaction ${transactionHash}`);
  }
  return log;
};

const parseLog = (contractInterface: { interface: Interface }, log: Log): LogDescription => {
  const logDescription = contractInterface.interface.parseLog(log);
  // All the logic below is to handle specific solc versions issue causing args of type address to be out of range sometimes
  if (logDescription.fragment?.type !== "event" || !logDescription.fragment.inputs?.length) {
    return logDescription;
  }

  let hasAddressOutOfRangeErrors = false;
  const topics = [...log.topics];
  Object.keys(logDescription.args).forEach((arg) => {
    try {
      // accessing property to throw deferred error if any
      logDescription.args[arg];
    } catch (error) {
      logger.error("Failed to parse log argument", {
        error,
        blockNumber: log.blockNumber,
        logIndex: log.index,
        transactionHash: log.transactionHash,
        arg,
      });
      if (!error.error?.error) {
        return;
      }
      const { code, fault, type } = error.error.error;
      if (code !== "NUMERIC_FAULT" || fault !== "overflow" || type !== "address") {
        return;
      }
      const inputIndex = Number(arg);
      const input = logDescription.fragment.inputs[inputIndex];
      if (!input.indexed) {
        return;
      }
      // incrementing inputIndex to get topicIndex as the first topic is event signature
      const topicIndex = inputIndex + 1;
      if (!topics[topicIndex]) {
        return;
      }
      topics[topicIndex] = `0x000000000000000000000000${topics[topicIndex].slice(-40)}`;
      hasAddressOutOfRangeErrors = true;
    }
  });

  return hasAddressOutOfRangeErrors
    ? contractInterface.interface.parseLog({
        ...log,
        topics,
      })
    : logDescription;
};

const getTokenAddressByAssetId = async (assetId: string): Promise<string> => {
  const contractInterface = new Interface([
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "assetId",
          type: "bytes32",
        },
      ],
      name: "tokenAddress",
      outputs: [
        {
          internalType: "address",
          name: "tokenAddress",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ]);
  const contract = new RetryableContract("0x0000000000000000000000000000000000010004", contractInterface, provider);
  const tokenAddress = await contract.tokenAddress(assetId);
  return tokenAddress;
};

const isBaseToken = (tokenAddress: string): boolean => {
  return "0x000000000000000000000000000000000000800a" === tokenAddress.toLowerCase();
};

const main = async () => {
  await typeOrmCliDataSource.initialize();

  const logsForMissingWithdrawals = await typeOrmCliDataSource.query(
    `Select encode(logs."transactionHash", 'hex') as "transactionHash", logs."logIndex" FROM logs
      LEFT JOIN transfers on logs."transactionHash" = transfers."transactionHash" AND logs."logIndex" = transfers."logIndex"
      WHERE address = decode('0000000000000000000000000000000000010003', 'hex')
      AND topics[1] = decode('55362fc62473cb1255e770af5d5e02ba6ee5bc7ed6969c30eb11ca31b92384dc', 'hex')
      AND transfers.number is NULL
      order by logs."blockNumber" ASC
    `
  );

  if (!logsForMissingWithdrawals.length) {
    logger.log("All good. No missing withdrawals detected.");
    return;
  }

  logger.log(`Detected ${logsForMissingWithdrawals.length} missing transfers.`);
  const missingTransfers = [];
  for (let i = 0; i < logsForMissingWithdrawals.length; i++) {
    const [txDetails, log] = await Promise.all([
      provider.getTransactionDetails("0x" + logsForMissingWithdrawals[i].transactionHash),
      getLog("0x" + logsForMissingWithdrawals[i].transactionHash, logsForMissingWithdrawals[i].logIndex),
    ]);
    const transfer = await getTransfer(log, txDetails);
    missingTransfers.push(transfer);
    logger.log(`Parsed ${i} / ${logsForMissingWithdrawals.length} logs`);
  }

  logger.log(`Adding ${missingTransfers.length} missing transfers.`);
  for (let i = 0; i < missingTransfers.length; i++) {
    const transfer = missingTransfers[i];
    await typeOrmCliDataSource.manager.transaction(async (entityManager) => {
      const result = await entityManager.insert(Transfer, missingTransfers[i]);
      const transferNumber = Number(result.identifiers[0].number);
      const { number, ...addressTransferData } = missingTransfers[i];
      const addressTransfers = [{ ...addressTransferData, address: addressTransferData.from, transferNumber }];
      if (transfer.from !== transfer.to) {
        addressTransfers.push({ ...addressTransferData, address: addressTransferData.to, transferNumber });
      }
      await entityManager.insert(AddressTransfer, addressTransfers);
      logger.log(`Added ${i} / ${missingTransfers.length} missing transfers. Transfer number: ${transferNumber}`);
    });
  }
};

main()
  .then(() => {
    logger.log(`Migration script 1742554445275-AddMissingWithdrawals executed successfully.`);
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Migration script 1742554445275-AddMissingWithdrawals failed.`);
    logger.error(error);
    process.exit(0);
  });
