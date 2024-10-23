import { types, utils } from "zksync-ethers";
import { Transfer } from "../transfer/interfaces/transfer.interface";
import { TransferType } from "../transfer/transfer.service";
import isInternalTransaction from "./isInternalTransaction";
import { BASE_TOKEN_ADDRESS } from "../../src/constants";
describe("isInternalTransaction", () => {
  it("returns false when transfer type is not transfer", () => {
    expect(isInternalTransaction({ type: TransferType.Deposit } as Transfer)).toBeFalsy();
  });

  it("returns false when token is not ETH", () => {
    expect(
      isInternalTransaction({ type: TransferType.Transfer, tokenAddress: utils.BOOTLOADER_FORMAL_ADDRESS } as Transfer)
    ).toBeFalsy();
  });

  it("returns false when transfer from and to addresses are the same to transaction from and to addresses", () => {
    expect(
      isInternalTransaction(
        {
          type: TransferType.Transfer,
          tokenAddress: BASE_TOKEN_ADDRESS,
          from: "FROM",
          to: "to",
        } as Transfer,
        {
          from: "from",
          to: "TO",
        } as types.TransactionReceipt
      )
    ).toBeFalsy();
  });

  it("returns true for ETH transfer when transfer from address is different to transaction from address", () => {
    expect(
      isInternalTransaction(
        {
          type: TransferType.Transfer,
          tokenAddress: BASE_TOKEN_ADDRESS,
          from: "from1",
          to: "to",
        } as Transfer,
        {
          from: "from2",
          to: "to",
        } as types.TransactionReceipt
      )
    ).toBeTruthy();
  });

  it("returns true for ETH transfer when transfer to address is different to transaction to address", () => {
    expect(
      isInternalTransaction(
        {
          type: TransferType.Transfer,
          tokenAddress: BASE_TOKEN_ADDRESS,
          from: "from",
          to: "to1",
        } as Transfer,
        {
          from: "from",
          to: "to2",
        } as types.TransactionReceipt
      )
    ).toBeTruthy();
  });

  it("returns true for ETH transfer when transfer from and to addresses are different to transaction from and to addresses", () => {
    expect(
      isInternalTransaction(
        {
          type: TransferType.Transfer,
          tokenAddress: BASE_TOKEN_ADDRESS,
          from: "from1",
          to: "to1",
        } as Transfer,
        {
          from: "from2",
          to: "to2",
        } as types.TransactionReceipt
      )
    ).toBeTruthy();
  });

  it("returns true for ETH transfer when there is no corresponding transaction", () => {
    expect(
      isInternalTransaction({
        type: TransferType.Transfer,
        tokenAddress: BASE_TOKEN_ADDRESS,
        from: "from",
        to: "to1",
      } as Transfer)
    ).toBeTruthy();
  });
});
