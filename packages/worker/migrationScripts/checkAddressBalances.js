const { Client } = require("pg");
const { Contract, BigNumber } = require("ethers");
const zksync = require("zksync-web3");

const connectionString = process.env.DATABASE_URL;
const provider = new zksync.Provider(process.env.BLOCKCHAIN_RPC_URL);
const batchSize = parseInt(process.env.BATCH_SIZE, 10) || 1000;

const fromHex = (buffer) => {
    return `0x${buffer.toString("hex")}`;
}

const toDbHexStr = (value) => {
    return value.startsWith("0x") ? value.substring(2) : value;
}

const getBalance = async (address, tokenAddress = zksync.utils.ETH_ADDRESS) => {
    if (zksync.utils.isETH(tokenAddress)) {
        return await provider.getBalance(address, "latest");
    }

    const erc20Contract = new Contract(tokenAddress, zksync.utils.IERC20, provider);
    return await erc20Contract.balanceOf(address, { blockTag: "latest" });
};

const getUpdateBalanceScript = async (balanceRecord) => {
    const address = fromHex(balanceRecord.address);
    const tokenAddress = fromHex(balanceRecord.tokenAddress);
    let balance = null;
    try {
        balance = await getBalance(address, tokenAddress);
    } catch (e) {
        if (!(e.code === 'CALL_EXCEPTION' && e.method === 'balanceOf(address)' && !!e.transaction &&
            (e.message && e.message.startsWith("call revert exception")))) {
            return "";
        }
    }
    if (balance && balance.eq(BigNumber.from(0))) {
        return `UPDATE "addressBalances" SET "toDelete" = TRUE, checked = TRUE, "latestBalance" = '${balance.toString()}' WHERE address = decode('${toDbHexStr(address)}', 'hex') AND "tokenAddress" = decode('${toDbHexStr(tokenAddress)}', 'hex');`;
    } else {
        return `UPDATE "addressBalances" SET checked = TRUE, "latestBalance" = '${balance ? balance.toString() : null}' WHERE address = decode('${toDbHexStr(address)}', 'hex') AND "tokenAddress" = decode('${toDbHexStr(tokenAddress)}', 'hex');`;
    }
};

const getNextRecordsBatch = async (pgClient) => {
    let balances = await pgClient.query(`SELECT * FROM "addressBalances" WHERE checked = FALSE LIMIT ${batchSize};`);
    return balances;
};

const main = async () => {
    const client = new Client(connectionString);
    await client.connect()
    let batchNum = 0;
    let balances = await getNextRecordsBatch(client);
    while (balances && balances.rows.length) {
        console.log(`Processing items ${batchNum * batchSize} - ${(batchNum + 1) * batchSize - 1}`);
        batchNum += 1;
        console.log('Getting balances:')
        console.log(new Date());
        const updateScripts = await Promise.all(balances.rows.map(balanceRecord => getUpdateBalanceScript(balanceRecord)));
        console.log(new Date());
        console.log('Updating DB:')
        console.log(new Date());
        await client.query(updateScripts.join(""));
        console.log(new Date());
        balances = await getNextRecordsBatch(client);
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