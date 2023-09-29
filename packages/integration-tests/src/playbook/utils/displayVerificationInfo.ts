import { utils } from "ethers";
import * as path from "path";

import type { ZkSyncArtifact } from "@matterlabs/hardhat-zksync-deploy/dist/types";
import type { Contract } from "ethers";
import type { SolcUserConfig } from "hardhat/types";

export default function ({
  hre,
  contract,
  contractConstructorArguments,
  artifact,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hre: any;
  contract: Contract;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contractConstructorArguments: any[];
  artifact: ZkSyncArtifact;
}) {
  console.log(
    `\nVerify the contract: https://explorer.zksync.io/contracts/verify?address=${contract.address}&network=${hre.config.networks.zkSyncTestnet.ethNetwork}`
  );
  console.log(`Contract name: ${artifact.contractName}`);
  console.log(`zkSolc Version: v${hre.userConfig.zksolc.version}`);
  console.log(`Solc Version: ${(hre.userConfig.solidity as SolcUserConfig).version}`);
  console.log(`Source code file path: ${path.join(__dirname, "../", artifact.sourceName)}`);
  // Get constructor arguments
  const contractInterface = new utils.Interface(artifact.abi);
  const constructorArgs = contractInterface.encodeDeploy(contractConstructorArguments);
  console.log(`Constructor arguments: ${constructorArgs}`);
}
