import { Wallet } from "zksync-ethers";
import { SiweMessage } from "siwe";

type CalculatedSiwe = {
  msg: string;
  signature: string;
  siwe: SiweMessage;
  address: string;
};

export async function calculateSiwe(
  nonce: string,
  privateKey: string,
  expiresAt: null | Date = null
): Promise<CalculatedSiwe> {
  // Create account from private key
  const account = new Wallet(privateKey);

  // Create SIWE message
  const message = new SiweMessage({
    domain: "localhost",
    address: account.address,
    statement: "Sign in with Ethereum",
    uri: "http://localhost:3000",
    version: "1",
    chainId: 1,
    nonce,
  });

  if (expiresAt !== null) {
    message.expirationTime = expiresAt.toISOString();
  }

  // Create message string and sign it
  const messageString = message.prepareMessage();
  const signature = await account.signMessage(messageString);
  return {
    msg: messageString,
    signature,
    siwe: message,
    address: account.address,
  };
}
