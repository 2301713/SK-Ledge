import "dotenv/config";
import hre from "hardhat";
import { ethers } from "ethers";

export const SEPOLIA_CHAIN_ID = 11155111n;

export function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be set in the environment.`);
  }
  return value;
}

/**
 * Resolves the live contract from NEXT_PUBLIC_CONTRACT_ADDRESS so operational
 * scripts never fall back to a stale Ignition deployment folder.
 */
export function contractAddressFromEnv(): string {
  const address = requiredEnv("NEXT_PUBLIC_CONTRACT_ADDRESS");
  if (
    !ethers.isAddress(address) ||
    address.toLowerCase() === ethers.ZeroAddress
  ) {
    throw new Error(
      "NEXT_PUBLIC_CONTRACT_ADDRESS must be a valid nonzero Ethereum address."
    );
  }
  return ethers.getAddress(address);
}

export async function sepoliaProvider(): Promise<ethers.JsonRpcProvider> {
  const provider = new ethers.JsonRpcProvider(requiredEnv("SEPOLIA_RPC_URL"));
  const network = await provider.getNetwork();
  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error(
      `Expected Sepolia (chain ID ${SEPOLIA_CHAIN_ID}), received ${network.chainId}.`
    );
  }
  return provider;
}

export function deployerPrivateKey(): string {
  return (
    process.env.DEPLOYER_PRIVATE_KEY?.trim() ||
    requiredEnv("SEPOLIA_PRIVATE_KEY")
  );
}

export function parseAuthorizationStatus(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase() ?? "true";
  if (value === "true" || value === "1") {
    return true;
  }
  if (value === "false" || value === "0") {
    return false;
  }
  throw new Error(`${name} must be true, false, 1, or 0.`);
}

/**
 * Connects the deployer wallet to the configured live contract and refuses to
 * continue unless that wallet is the contract owner (every authorization call
 * is onlyOwner).
 */
export async function connectAsOwner(): Promise<{
  contract: ethers.Contract;
  signer: ethers.Wallet;
  provider: ethers.JsonRpcProvider;
  contractAddress: string;
}> {
  const provider = await sepoliaProvider();
  const signer = new ethers.Wallet(deployerPrivateKey(), provider);
  const contractAddress = contractAddressFromEnv();
  const artifact = await hre.artifacts.readArtifact("SkLedge");
  const contract = new ethers.Contract(contractAddress, artifact.abi, signer);

  const owner: string = await contract.owner();
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(
      `Deployer ${signer.address} is not the contract owner (${owner}) on ${contractAddress}.`
    );
  }

  return { contract, signer, provider, contractAddress };
}
