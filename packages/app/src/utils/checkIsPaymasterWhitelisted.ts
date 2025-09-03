/**
 * Paymaster address on Sophon network
 */
export const PAYMASTER_ADDRESS = '0x98546B226dbbA8230cf620635a1e4ab01F6A99B2'

/**
 * Paymaster whitelist contract address on Sophon network
 * This contract maintains a list of contracts that are approved for gas sponsorship
 */
export const PAYMASTER_WHITELIST_ADDRESS = '0x786c188eb7021578D8db247B66f5E356faAb2a88'

export const PAYMASTER_WHITELIST_ABI = [
    {
        inputs: [{ name: '', type: 'address', internalType: 'address' }],
        name: 'contractWhitelist',
        outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const

/**
 * Checks if a contract is whitelisted by the paymaster
 *
 * The paymaster can only sponsor gas fees for transactions involving whitelisted contracts.
 * This prevents abuse and ensures the paymaster only pays for approved things.
 *
 * @param contractAddress - The contract address to check
 * @param provider - The provider to make the contract call
 * @returns Promise<boolean> - true if the contract is whitelisted, false otherwise
 */
export const checkIsPaymasterWhitelisted = async (
    contractAddress: string,
    provider: any
): Promise<boolean> => {
    try {
        if (!provider) {
            return false
        }

        // Using ethers.js Contract for compatibility with block-explorer
        const { Contract } = await import('ethers')
        const whitelistContract = new Contract(
            PAYMASTER_WHITELIST_ADDRESS,
            PAYMASTER_WHITELIST_ABI,
            provider
        )
        
        const result = await whitelistContract.contractWhitelist(contractAddress)
        
        return result
    } catch (err: unknown) {
        return false
    }
}
