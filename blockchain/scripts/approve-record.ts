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

  const recordIdValue = requiredEnvironmentValue("RECORD_ID");
  if (!/^\d+$/.test(recordIdValue) || BigInt(recordIdValue) <= 0n) {
    throw new Error("RECORD_ID must be a positive whole number.");
  }
  const recordId = BigInt(recordIdValue);

  const rpcUrl = requiredEnvironmentValue("SEPOLIA_RPC_URL");
  const privateKey =
    process.env.SIGNER_PRIVATE_KEY?.trim() ||
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

  if (!(await contract.isAuthorizedOfficial(signer.address))) {
    throw new Error(
      `Signer ${signer.address} is not an authorized official on ${contractAddress}.`
    );
  }

  console.log(
    `Submitting approval for record ${recordId} from ${signer.address}...`
  );
  const transaction = await contract.approveRecord(recordId);
  console.log(`Transaction hash: ${transaction.hash}`);

  const receipt = await transaction.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error("Approval transaction failed or was not confirmed.");
  }

  const count = await contract.approvalCount(recordId);
  const threshold = await contract.approvalThreshold();
  const records = await contract.getAllRecords();
  const record = records[Number(recordId) - 1];

  console.log("----------------------------------------------------------------");
  console.log(`Confirmed in block:      ${receipt.blockNumber}`);
  console.log(`Record ID:               ${recordId}`);
  console.log(`Approvals:               ${count} / ${threshold}`);
  console.log(`Record approved:         ${record.approved}`);
  console.log(`Approved by:             ${record.approvedBy}`);
  console.log("----------------------------------------------------------------");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
