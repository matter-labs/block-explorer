import { Wallet } from "zksync-ethers";
import { SiweMessage } from "siwe";

type CalculatedSiwe = {
  msg: string;
  signature: string;
  siwe: SiweMessage;
  address: string;
};

export async function calculateSiwe({
  nonce,
  privateKey,
  expiresAt = null,
  scheme = "http",
  domain = "localhost",
}: {
  nonce: string;
  privateKey: string;
  expiresAt?: null | Date;
  scheme?: "http" | "https";
  domain?: string;
}): Promise<CalculatedSiwe> {
  // Create account from private key
  const account = new Wallet(privateKey);

  // Create SIWE message
  const message = new SiweMessage({
    domain,
    address: account.address,
    statement: "Sign in with Ethereum",
    uri: `${scheme}://${domain}`,
    version: "1",
    chainId: 1,
    nonce,
    scheme,
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
