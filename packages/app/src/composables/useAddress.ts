import { ref } from "vue";

import { Contract as EthersContract, isAddress, keccak256, toUtf8Bytes, ZeroAddress } from "ethers";
import { $fetch, FetchError } from "ohmyfetch";

import useContext from "./useContext";

import { DIAMOND_CONTRACT_IMPLEMENTATION_ABI, PROXY_CONTRACT_IMPLEMENTATION_ABI } from "@/utils/constants";
import { numberToHexString } from "@/utils/formatters";

const oneBigInt = BigInt(1);
const EIP1967_PROXY_IMPLEMENTATION_SLOT = numberToHexString(
  BigInt(keccak256(toUtf8Bytes("eip1967.proxy.implementation"))) - oneBigInt
);
const EIP1967_PROXY_BEACON_SLOT = numberToHexString(BigInt(keccak256(toUtf8Bytes("eip1967.proxy.beacon"))) - oneBigInt);
const EIP1822_PROXY_IMPLEMENTATION_SLOT = keccak256(toUtf8Bytes("PROXIABLE"));

type ContractFunctionInput = {
  internalType: string;
  name: string;
  type: string;
  value?: string | number;
};
type ContractFunctionOutput = {
  internalType: string;
  name: string;
  type: string;
};
export type AbiFragment = {
  inputs: ContractFunctionInput[];
  name: string;
  outputs: ContractFunctionOutput[];
  stateMutability: string;
  type: string;
};

type ContractVerificationRequest = {
  id: number;
  contractName: string;
  contractAddress: string;
  compilerSolcVersion?: string;
  compilerZksolcVersion?: string;
  compilerVyperVersion?: string;
  compilerZkvyperVersion?: string;
  constructorArguments: string;
  sourceCode:
    | string
    | {
        language: string;
        settings: {
          optimizer: {
            enabled: boolean;
          };
        };
        sources: {
          [key: string]: {
            content: string;
          };
        };
      }
    | Record<string, string>;
  optimizationUsed: boolean;
};

export const VERIFICATION_PROBLEM_INCORRECT_METADATA = "incorrectMetadata";

export type ContractVerificationInfo = {
  artifacts: {
    abi: AbiFragment[];
    bytecode: number[];
  };
  request: ContractVerificationRequest;
  verifiedAt: string;
  verificationProblems?: string[];
};

export type Balance = Api.Response.TokenAddress;
export type Balances = Api.Response.Balances;
export type Account = Api.Response.Account;
export type Contract = Api.Response.Contract & {
  verificationInfo: null | ContractVerificationInfo;
  isEvmLike: boolean;
  proxyInfo: null | {
    implementation: {
      address: string;
      verificationInfo: null | ContractVerificationInfo;
    };
  };
  diamondProxyInfo:
    | null
    | {
        implementation: {
          address: string;
          verificationInfo: null | ContractVerificationInfo;
        };
      }[];
};
export type AddressItem = Account | Contract;

export default (context = useContext()) => {
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);
  const item = ref(<null | AddressItem>null);

  const getContractVerificationInfo = async (address: string): Promise<ContractVerificationInfo | null> => {
    if (!context.currentNetwork.value.verificationApiUrl) {
      return null;
    }
    try {
      return await $fetch(`${context.currentNetwork.value.verificationApiUrl}/contract_verification/info/${address}`);
    } catch (e) {
      if (!(e instanceof FetchError) || e.response?.status !== 404) {
        throw e;
      }
      return null;
    }
  };

  const getAddressSafe = async (getAddressFn: () => Promise<string>) => {
    try {
      const addressBytes = await getAddressFn();
      const address = `0x${addressBytes.slice(-40)}`;
      if (!isAddress(address) || address === ZeroAddress) {
        return null;
      }
      return address;
    } catch (e) {
      return null;
    }
  };

  const getAddressesSafe = async (getAddressesFn: () => Promise<string[]>) => {
    try {
      const addresses = await getAddressesFn();
      if (!addresses.every(isAddress) || addresses.some((address) => address === ZeroAddress)) {
        return null;
      }
      return addresses;
    } catch (e) {
      return null;
    }
  };

  const getDiamondProxyImplementation = async (address: string): Promise<string[] | null> => {
    const provider = context.getL2Provider();

    const EIP2535_DIAMOND_IMPLEMENTATION_SLOT = numberToHexString(
      BigInt(keccak256(toUtf8Bytes("diamond.standard.diamond.storage"))) + BigInt(2)
    );

    const eip2535Diamond = await provider.getStorage(address, EIP2535_DIAMOND_IMPLEMENTATION_SLOT);

    if (eip2535Diamond) {
      const diamondContract = new EthersContract(address, DIAMOND_CONTRACT_IMPLEMENTATION_ABI, provider);
      const facetAddresses = await getAddressesSafe(() => diamondContract.facetAddresses());
      return facetAddresses?.length ? facetAddresses : null;
    }

    return null;
  };

  const getDiamondProxyInfo = async (address: string) => {
    try {
      const implementationAddresses = await getDiamondProxyImplementation(address);

      if (!implementationAddresses) {
        return null;
      }

      // Prepare an array of promises for every address string in the array
      const mapContractVerificationInfo = async (address: string) => {
        const contractVerificationInfo = await getContractVerificationInfo(address);
        return {
          implementation: {
            address,
            verificationInfo: contractVerificationInfo,
          },
        };
      };

      const implementationPromiseArr = implementationAddresses.map((address) => {
        return mapContractVerificationInfo(address);
      });

      const implementationVerificationInfoArr = await Promise.all(implementationPromiseArr);

      return implementationVerificationInfoArr;
    } catch (e) {
      return null;
    }
  };

  const getProxyImplementation = async (address: string): Promise<string | null> => {
    const provider = context.getL2Provider();
    const proxyContract = new EthersContract(address, PROXY_CONTRACT_IMPLEMENTATION_ABI, provider);
    const [implementation, eip1967Implementation, eip1967Beacon, eip1822Implementation] = await Promise.all([
      getAddressSafe(() => proxyContract.implementation()),
      getAddressSafe(() => provider.getStorage(address, EIP1967_PROXY_IMPLEMENTATION_SLOT)),
      getAddressSafe(() => provider.getStorage(address, EIP1967_PROXY_BEACON_SLOT)),
      getAddressSafe(() => provider.getStorage(address, EIP1822_PROXY_IMPLEMENTATION_SLOT)),
    ]);
    if (implementation) {
      return implementation;
    }
    if (eip1967Implementation) {
      return eip1967Implementation;
    }
    if (eip1822Implementation) {
      return eip1822Implementation;
    }
    if (eip1967Beacon) {
      const beaconContract = new EthersContract(eip1967Beacon, PROXY_CONTRACT_IMPLEMENTATION_ABI, provider);
      return getAddressSafe(() => beaconContract.implementation());
    }
    return null;
  };

  const getContractProxyInfo = async (address: string) => {
    try {
      const implementationAddress = await getProxyImplementation(address);
      if (!implementationAddress) {
        return null;
      }
      const implementationVerificationInfo = await getContractVerificationInfo(implementationAddress);
      return {
        implementation: {
          address: implementationAddress,
          verificationInfo: implementationVerificationInfo,
        },
      };
    } catch (e) {
      return null;
    }
  };

  const getByAddress = async (address: string) => {
    isRequestPending.value = true;
    isRequestFailed.value = false;

    try {
      const response: Api.Response.Account | Api.Response.Contract = await $fetch(
        `${context.currentNetwork.value.apiUrl}/address/${address}`
      );
      if (response.type === "account") {
        item.value = response;
      } else if (response.type === "contract") {
        const [verificationInfo, proxyInfo, diamondProxyInfo] = await Promise.all([
          getContractVerificationInfo(response.address),
          getContractProxyInfo(response.address),
          getDiamondProxyInfo(response.address),
        ]);
        item.value = {
          ...response,
          verificationInfo,
          proxyInfo,
          diamondProxyInfo,
        };
      }
    } catch (error: unknown) {
      item.value = null;
      isRequestFailed.value = true;
    } finally {
      isRequestPending.value = false;
    }
  };
  return {
    getByAddress,
    getContractProxyInfo,
    item,
    isRequestPending,
    isRequestFailed,
  };
};
