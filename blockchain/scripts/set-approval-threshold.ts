import "dotenv/config";
import { ethers } from "ethers";
import hre from "hardhat";

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be set in the environment.`);
  }
  return value;
}

async function main(): Promise<void> {
  const contractAddress = requiredEnvironmentValue("NEXT_PUBLIC_CONTRACT_ADDRESS");
  if (
    !ethers.isAddress(contractAddress) ||
    contractAddress.toLowerCase() === ethers.ZeroAddress
  ) {
    throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS must be a valid nonzero Ethereum address.");
  }

  const thresholdValue = requiredEnvironmentValue("APPROVAL_THRESHOLD");
  if (!/^\d+$/.test(thresholdValue)) {
    throw new Error("APPROVAL_THRESHOLD must be a whole number between 1 and 10.");
  }
  const threshold = BigInt(thresholdValue);
  if (threshold < 1n || threshold > 10n) {
    throw new Error("APPROVAL_THRESHOLD must be a whole number between 1 and 10.");
  }

  const rpcUrl = requiredEnvironmentValue("SEPOLIA_RPC_URL");
  const privateKey =
    process.env.DEPLOYER_PRIVATE_KEY?.trim() ||
    requiredEnvironmentValue("SEPOLIA_PRIVATE_KEY");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId !== 11155111n) {
    throw new Error(`Expected Sepolia (chain ID 11155111), received ${network.chainId}.`);
  }

  const signer = new ethers.Wallet(privateKey, provider);
  const artifact = await hre.artifacts.readArtifact("SkLedge");
  const contract = new ethers.Contract(contractAddress, artifact.abi, signer);

  const owner = await contract.owner();
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(
      `Deployer ${signer.address} is not the contract owner (${owner}).`
    );
  }

  console.log(`Setting approval threshold to ${threshold}...`);
  const transaction = await contract.setApprovalThreshold(threshold);
  console.log(`Transaction hash: ${transaction.hash}`);

  const receipt = await transaction.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error("Threshold transaction failed or was not confirmed.");
  }

  const currentThreshold = await contract.approvalThreshold();
  console.log("----------------------------------------------------------------");
  console.log(`Confirmed in block:      ${receipt.blockNumber}`);
  console.log(`Approval threshold:      ${currentThreshold}`);
  console.log("----------------------------------------------------------------");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
