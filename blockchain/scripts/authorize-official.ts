import { ethers } from "ethers";
import {
  connectAsOwner,
  parseAuthorizationStatus,
} from "./lib/contractConnection.js";

async function main(): Promise<void> {
  const targetAddress = process.env.TARGET_OFFICIAL_ADDRESS?.trim();
  if (!targetAddress) {
    throw new Error(
      "Missing target official address. Usage: TARGET_OFFICIAL_ADDRESS='0x...' npx hardhat run scripts/authorize-official.ts --network sepolia"
    );
  }
  if (!ethers.isAddress(targetAddress)) {
    throw new Error(`Invalid Ethereum address: "${targetAddress}"`);
  }

  const status = parseAuthorizationStatus("AUTHORIZATION_STATUS");
  const { contract, contractAddress } = await connectAsOwner();

  console.log(
    `Authorizing official ${targetAddress} on ${contractAddress} (status: ${status})...`
  );
  const transaction = await contract.setOfficialAuthorization(
    targetAddress,
    status
  );
  console.log(`Transaction hash: ${transaction.hash}`);

  const receipt = await transaction.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error("Authorization transaction failed or was not confirmed.");
  }

  const newStatus = await contract.isAuthorizedOfficial(targetAddress);
  if (newStatus !== status) {
    throw new Error(
      `isAuthorizedOfficial returned ${newStatus}; expected ${status}.`
    );
  }

  console.log("----------------------------------------------------------------");
  console.log(`Contract Address:          ${contractAddress}`);
  console.log(`Target Address:            ${targetAddress}`);
  console.log(`Authorization Status Set:  ${status}`);
  console.log(`Transaction Hash:          ${transaction.hash}`);
  console.log(`Mined in block:            ${receipt.blockNumber}`);
  console.log(`New isAuthorizedOfficial:  ${newStatus}`);
  console.log("----------------------------------------------------------------");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
