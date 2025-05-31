import { ContractAddress } from "../../address/interface/contractAddress.interface";

export type ProxyAddress = ContractAddress & {
  implementationAddress: string;
};
