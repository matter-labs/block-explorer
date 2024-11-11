import { Address, createPublicClient, http, parseAbi } from 'viem';
import { env } from '../env.js';

const client = createPublicClient({
  transport: http(env.RPC_URL),
});

/**
 * Get the owner of a contract.
 * The owner is returned by verifying if the contract is `Ownable`. If it's not, null is returned.
 */
export async function getContractOwner(
  address: Address,
): Promise<Address | null> {
  try {
    return client.readContract({
      address,
      abi: parseAbi(['function owner() view returns (address)']),
      functionName: 'owner',
    });
  } catch {
    return null;
  }
}
