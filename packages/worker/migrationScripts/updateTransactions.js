const { Client } = require("pg");
const zksync = require("zksync-web3");

const connectionString = process.env.DATABASE_URL;
const provider = new zksync.Provider(process.env.BLOCKCHAIN_RPC_URL);
const batchSize = parseInt(process.env.BATCH_SIZE, 10) || 100;

const fromHex = (buffer) => {
    return `0x${buffer.toString("hex")}`;
}

const toDbHexStr = (value) => {
    return value.startsWith("0x") ? value.substring(2) : value;
}

const getUpdateTransactionScript = async (transactionRecord) => {
    const txHash = fromHex(transactionRecord.hash);
    try {
        const txDetails = await provider.getTransactionDetails(txHash);
        return `UPDATE transactions SET fee = '${txDetails.fee}', "gasPerPubdata" = '${txDetails.gasPerPubdata}', "updatedAt" = CURRENT_TIMESTAMP WHERE hash = decode('${toDbHexStr(txHash)}', 'hex');`;
    } catch (e) {
        return "";
    }
};

const getNextRecordsBatch = async (pgClient) => {
    return await pgClient.query(`SELECT hash FROM transactions WHERE "gasPerPubdata" IS NULL LIMIT $1;`, [batchSize]);
};

const main = async () => {
    const client = new Client(connectionString);
    await client.connect()
    let batchNum = 0;
    let transactions = await getNextRecordsBatch(client);
    while (transactions && transactions.rows.length) {
        console.log(`Processing items ${batchNum * batchSize} - ${(batchNum + 1) * batchSize - 1}`);
        batchNum += 1;
        console.log('Getting transactions:')
        console.log(new Date());
        const updateScripts = await Promise.all(transactions.rows.map((transaction) => getUpdateTransactionScript(transaction)));
        console.log(new Date());
        console.log('Updating DB:')
        console.log(new Date());
        await client.query(updateScripts.join(""));
        console.log(new Date());
        transactions = await getNextRecordsBatch(client);
    }
};

main()
    .then(() => {
        console.log("Done");
        process.exit(0);
    })
    .catch((e) => {
        console.error(e);
        process.exit(0);
    });