import { Address, createPublicClient, http, parseAbi } from 'viem';

/**
 * Get the owner of a contract.
 * The owner is returned by verifying if the contract is `Ownable`. If it's not, null is returned.
 */
export async function getContractOwner(
  rpcUrl: string,
  address: Address,
): Promise<Address | null> {
  const client = createPublicClient({
    transport: http(rpcUrl),
  });

  try {
    return await client.readContract({
      address,
      abi: parseAbi(['function owner() view returns (address)']),
      functionName: 'owner',
    });
  } catch {
    return null;
  }
}
