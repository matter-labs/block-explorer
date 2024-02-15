const existsSyncMock = jest.fn().mockReturnValue(false);
const readFileSyncMock = jest.fn().mockReturnValue(null);

jest.mock("node:fs", () => ({
  existsSync: existsSyncMock,
  readFileSync: readFileSyncMock,
}));

jest.mock("../../logger", () => ({
  getLogger: () => ({ error: jest.fn() }),
}));

describe("constants", () => {
  const env = process.env;
  const defaultConstants = {
    address: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
    addressTxWithInternalTransfers: "0x04a4757cd59681b037c1e7bd2402cc45a23c66ed7497614879376719d34e020a",
    addressWithInternalTx: "0x0E03197d697B592E5AE49EC14E952cddc9b28e14",
    contractAddressWithLogs: "0x8A63F953e19aA4Ce3ED90621EeF61E17A95c6594",
    tokenAddress: "0x0faF6df7054946141266420b43783387A78d82A9",
    txHash: "0x04a4757cd59681b037c1e7bd2402cc45a23c66ed7497614879376719d34e020a",
    verifiedContractAddress: "0x8A63F953e19aA4Ce3ED90621EeF61E17A95c6594",
    verifiedContractAddress2: "0x0E03197d697B592E5AE49EC14E952cddc9b28e14",
    erc20TokenAddress: "0x0faF6df7054946141266420b43783387A78d82A9",
    erc721TokenAddress: "0x09B0196641D91eDEC4042e4bb8C605bb35a02546",
    erc721TokenHolderAddress: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
  };

  beforeEach(() => {
    jest.resetModules();
  });

  afterAll(() => {
    process.env = env;
  });

  it("should return default constants", async () => {
    const { constants } = await import("./");
    expect(constants).toEqual(defaultConstants);
  });

  it("should return constants for the specified environment", async () => {
    process.env.NETWORK_NAME = "testnet";
    const testnetConfig = {
      verifiedContractAddress: "0x53E185A2FA7c9caF14A887E8E9a4862D4bd094ea",
      verifiedContractAddress2: "0xbf2A1ACE3B12b81bab4985f05E850AcFCCb416E0",
      contractAddressWithLogs: "0xbf2A1ACE3B12b81bab4985f05E850AcFCCb416E0",
      txHash: "0x3d36c6e6a3625d698ef41d20c9457a6628254c8307df54b7c887e30f7dda00c8",
      address: "0xE4ce1da467a7Ca37727eb7e19857e5167DE25966",
      addressWithInternalTx: "0xbf2A1ACE3B12b81bab4985f05E850AcFCCb416E0",
      addressTxWithInternalTransfers: "0x8a453b8dd3e095b3034dc3692663d5bf0c9883cbe6e9f9a0425a3ebf9b9360ab",
      tokenAddress: "0x000000000000000000000000000000000000800A",
      erc20TokenAddress: "0x0faF6df7054946141266420b43783387A78d82A9",
      erc721TokenAddress: "0x09B0196641D91eDEC4042e4bb8C605bb35a02546",
      erc721TokenHolderAddress: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
    };

    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockReturnValue(JSON.stringify(testnetConfig));
    const { constants } = await import("./");

    expect(constants).toEqual(testnetConfig);
  });

  it("should return default constants if environment constants cannot be read", async () => {
    process.env.NETWORK_NAME = "testnet";

    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockReturnValue(new Error("Cannot read the file"));
    const { constants } = await import("./");

    expect(constants).toEqual(defaultConstants);
  });
});
