import { deployERC20toL1 } from "./scenarios/deploy/deployERC20toL1";
import { deployERC20toL2 } from "./scenarios/deploy/deployERC20toL2";
import { deployGreeterToL2 } from "./scenarios/deploy/deployGreeterToL2";
import { deployMulticallContracts } from "./scenarios/deploy/deployMulticallContracts";
import { deployMultitransferETH } from "./scenarios/deploy/deployMultitransferETH";
import { deployNFTtoL1 } from "./scenarios/deploy/deployNFTtoL1";
import { deployNFTtoL2 } from "./scenarios/deploy/deployNFTtoL2";
import { deployViaPaymaster } from "./scenarios/deploy/deployViaPaymaster";
import { depositERC20 } from "./scenarios/deposit/depositERC20";
import { depositEth } from "./scenarios/deposit/depositETH";
import { transferERC20 } from "./scenarios/transfers/transferERC20";
import { transferEth } from "./scenarios/transfers/transferETH";
import { transferFailedState } from "./scenarios/transfers/transferFailedState";
import { useGreeter } from "./scenarios/transfers/useGreeter";
import { useMultiCallContracts } from "./scenarios/transfers/useMultiCall";
import { useMultitransferETH } from "./scenarios/transfers/useMultitransferETH";
import { usePaymaster } from "./scenarios/transfers/usePaymaster";
import { withdrawERC20 } from "./scenarios/withdrawal/withdrawERC20";
import { withdrawERC20toOtherAddress } from "./scenarios/withdrawal/withdrawERC20toOtherAddress";
import { withdrawETH } from "./scenarios/withdrawal/withdrawETH";
import { withdrawETHtoOtherAddress } from "./scenarios/withdrawal/withdrawETHtoOtherAddress";

export class Playbook {
  public async deployGreeterToL2() {
    return await deployGreeterToL2();
  }

  public async useGreeter() {
    return await useGreeter();
  }

  public async deployNFTtoL1() {
    return await deployNFTtoL1();
  }

  public async deployNFTtoL2() {
    return await deployNFTtoL2();
  }

  public async deployERC20toL2() {
    return await deployERC20toL2();
  }

  public async deployERC20toL1() {
    return await deployERC20toL1();
  }

  public async depositERC20(sum: string, tokenAddress: string, units?: number) {
    return await depositERC20(sum, tokenAddress, units);
  }

  public async depositETH(sum: string) {
    return await depositEth(sum);
  }

  public async transferETH(sum: string, address?: string) {
    return await transferEth(sum, address);
  }

  public async transferERC20(sum: string, tokenAddress, tokenName) {
    return await transferERC20(sum, tokenAddress, tokenName);
  }

  public async transferFailedState(tokenAddress: string, tokenName?: string) {
    return await transferFailedState(tokenAddress, tokenName);
  }

  public async deployViaPaymaster() {
    return await deployViaPaymaster();
  }

  public async usePaymaster() {
    return await usePaymaster();
  }

  public async withdrawETH() {
    return await withdrawETH();
  }

  public async withdrawERC20(address: string) {
    return await withdrawERC20(address);
  }

  public async withdrawETHtoOtherAddress() {
    return await withdrawETHtoOtherAddress();
  }

  public async withdrawERC20toOtherAddress(address: string) {
    return await withdrawERC20toOtherAddress(address);
  }

  public async deployMultiTransferETH() {
    return await deployMultitransferETH();
  }

  public async useMultiTransferETH() {
    return await useMultitransferETH();
  }

  public async deployMultiCallContracts() {
    return await deployMulticallContracts();
  }

  public async useMultiCallContracts() {
    return await useMultiCallContracts();
  }
}
