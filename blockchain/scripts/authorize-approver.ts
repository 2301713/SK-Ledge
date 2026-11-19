import { ethers } from "ethers";
import {
  connectAsOwner,
  parseAuthorizationStatus,
} from "./lib/contractConnection.js";

async function main(): Promise<void> {
  const targetAddress = process.env.TARGET_APPROVER_ADDRESS?.trim();
  if (!targetAddress) {
    throw new Error(
      "Missing target approver address. Usage: TARGET_APPROVER_ADDRESS='0x...' npx hardhat run scripts/authorize-approver.ts --network sepolia"
    );
  }
  if (!ethers.isAddress(targetAddress)) {
    throw new Error(`Invalid Ethereum address: "${targetAddress}"`);
  }

  // APPROVER_AUTHORIZATION_STATUS is the name used by setupRolesAndCeilings.
  const statusName = process.env.APPROVER_AUTHORIZATION_STATUS
    ? "APPROVER_AUTHORIZATION_STATUS"
    : "AUTHORIZATION_STATUS";
  const status = parseAuthorizationStatus(statusName);
  const { contract, contractAddress } = await connectAsOwner();

  console.log(
    `Authorizing approver ${targetAddress} on ${contractAddress} (status: ${status})...`
  );
  const transaction = await contract.setApproverAuthorization(
    targetAddress,
    status
  );
  console.log(`Transaction hash: ${transaction.hash}`);

  const receipt = await transaction.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error("Authorization transaction failed or was not confirmed.");
  }

  const newStatus = await contract.isApprover(targetAddress);
  if (newStatus !== status) {
    throw new Error(`isApprover returned ${newStatus}; expected ${status}.`);
  }

  console.log("----------------------------------------------------------------");
  console.log(`Contract Address:          ${contractAddress}`);
  console.log(`Target Address:            ${targetAddress}`);
  console.log(`Authorization Status Set:  ${status}`);
  console.log(`Transaction Hash:          ${transaction.hash}`);
  console.log(`Mined in block:            ${receipt.blockNumber}`);
  console.log(`Final isApprover status:   ${newStatus}`);
  console.log("----------------------------------------------------------------");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
