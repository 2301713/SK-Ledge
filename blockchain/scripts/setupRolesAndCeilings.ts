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

function authorizationStatus(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase() ?? "true";
  if (value === "true" || value === "1") {
    return true;
  }
  if (value === "false" || value === "0") {
    return false;
  }
  throw new Error(`${name} must be true, false, 1, or 0.`);
}

async function submitAndConfirm(
  description: string,
  transaction: Promise<ethers.TransactionResponse>
): Promise<void> {
  const response = await transaction;
  console.log(`${description}: ${response.hash}`);

  const receipt = await response.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error(`${description} failed or was not confirmed.`);
  }
  console.log(`${description} confirmed in block ${receipt.blockNumber}.`);
}

async function main(): Promise<void> {
  const contractAddress = requiredEnvironmentValue("NEXT_PUBLIC_CONTRACT_ADDRESS");
  if (
    !ethers.isAddress(contractAddress) ||
    contractAddress.toLowerCase() === ethers.ZeroAddress
  ) {
    throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS must be a valid nonzero Ethereum address.");
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

  const deployer = new ethers.Wallet(privateKey, provider);
  const artifact = await hre.artifacts.readArtifact("SkLedge");
  const contract = new ethers.Contract(contractAddress, artifact.abi, deployer);
  const owner = await contract.owner();
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error(
      `Deployer ${deployer.address} is not the contract owner (${owner}).`
    );
  }

  const officialAddress = process.env.TARGET_OFFICIAL_ADDRESS?.trim();
  const approverAddress = process.env.TARGET_APPROVER_ADDRESS?.trim();
  const barangay = process.env.BARANGAY_NAME?.trim();
  const ceilingValue = process.env.ALLOCATION_CEILING_CENTAVOS?.trim();

  if (
    officialAddress &&
    (!ethers.isAddress(officialAddress) ||
      officialAddress.toLowerCase() === ethers.ZeroAddress)
  ) {
    throw new Error("TARGET_OFFICIAL_ADDRESS must be a valid nonzero Ethereum address.");
  }
  if (
    approverAddress &&
    (!ethers.isAddress(approverAddress) ||
      approverAddress.toLowerCase() === ethers.ZeroAddress)
  ) {
    throw new Error("TARGET_APPROVER_ADDRESS must be a valid nonzero Ethereum address.");
  }
  if (Boolean(barangay) !== Boolean(ceilingValue)) {
    throw new Error(
      "Set both BARANGAY_NAME and ALLOCATION_CEILING_CENTAVOS to configure a ceiling."
    );
  }
  if (!officialAddress && !approverAddress && !barangay) {
    throw new Error(
      "Configure an official, an approver, and/or a barangay ceiling before running setup."
    );
  }
  if (ceilingValue && (!/^\d+$/.test(ceilingValue) || BigInt(ceilingValue) <= 0n)) {
    throw new Error("ALLOCATION_CEILING_CENTAVOS must be a positive whole number.");
  }

  if (officialAddress) {
    const authorized = authorizationStatus("OFFICIAL_AUTHORIZATION_STATUS");
    await submitAndConfirm(
      `Set official authorization for ${officialAddress} to ${authorized}`,
      contract.setOfficialAuthorization(officialAddress, authorized)
    );
    if ((await contract.isAuthorizedOfficial(officialAddress)) !== authorized) {
      throw new Error("Official authorization did not match the requested status.");
    }
  }

  if (approverAddress) {
    const authorized = authorizationStatus("APPROVER_AUTHORIZATION_STATUS");
    await submitAndConfirm(
      `Set approver authorization for ${approverAddress} to ${authorized}`,
      contract.setApproverAuthorization(approverAddress, authorized)
    );
    if ((await contract.isApprover(approverAddress)) !== authorized) {
      throw new Error("Approver authorization did not match the requested status.");
    }
  }

  if (barangay && ceilingValue) {
    const ceiling = BigInt(ceilingValue);
    await submitAndConfirm(
      `Set allocation ceiling for ${barangay} to ${ceiling} centavos`,
      contract.setAllocationCeiling(barangay, ceiling)
    );
    if ((await contract.allocationCeilings(barangay)) !== ceiling) {
      throw new Error("Allocation ceiling did not match the requested value.");
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
