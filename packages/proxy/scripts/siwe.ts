import type { Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { SiweMessage } from 'siwe';
import { Command } from 'commander';

async function main() {
  const program = new Command();

  program
    .requiredOption('--private-key <key>', 'private key for signing')
    .requiredOption('--nonce <value>', 'nonce for SIWE message')
    .description('Generate a SIWE message and signature for authentication')
    .parse();

  const { privateKey, nonce } = program.opts<{
    privateKey: string;
    nonce: string;
  }>();

  // Create account from private key
  const account = privateKeyToAccount(privateKey as Hex);

  // Create SIWE message
  const message = new SiweMessage({
    domain: 'localhost',
    address: account.address,
    statement: 'Sign in with Ethereum',
    uri: 'http://localhost:3000',
    version: '1',
    chainId: 1,
    nonce,
  });

  // Create message string and sign it
  const messageString = message.prepareMessage();
  const signature = await account.signMessage({ message: messageString });

  console.log('Message:\n', messageString.replace(/\n/g, '\\n'), '\n');
  console.log('Signature:\n', signature, '\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
