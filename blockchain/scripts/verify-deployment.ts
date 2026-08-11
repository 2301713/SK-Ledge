import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("----------------------------------------------------------------");
  console.log("Activity: verify-deployment.ts");
  console.log("----------------------------------------------------------------");

  const CONTRACT_ADDRESS = "0x857615c8b31CF1c51ef27B5F8FAA4F019C111549";

  console.log("\n1. Connecting to Sepolia Network...");
  const { ethers } = await network.create({ network: "sepolia" });

  const [sender] = await ethers.getSigners();

  if (!sender) {
    console.log("ERROR: No signer found.");
    return;
  }

  console.log(`Successfully connected as: ${sender.address}`);

  console.log("\n2. Loading ABI from blockchain/artifacts...");

  const artifactPath = path.join(
    "artifacts",
    "contracts",
    "SkLedge.sol",
    "SkLedge.json"
  );

  if (!fs.existsSync(artifactPath)) {
    console.log(`ERROR: Could not find artifact at: ${artifactPath}`);
    return;
  }

  const artifactJson = JSON.parse(
    fs.readFileSync(artifactPath, "utf8")
  );

  const contractAbi = artifactJson.abi;

  console.log("Successfully loaded ABI.");

  console.log("\n3. Attaching to ALREADY DEPLOYED contract at:");
  console.log(CONTRACT_ADDRESS);

  const skLedge = new ethers.Contract(
    CONTRACT_ADDRESS,
    contractAbi,
    sender
  );

  console.log("Successfully attached to contract.");

  console.log("\n4. Running Requirements (Calling Contract Views)...");

  console.log("\n   Checking contract owner...");
  const owner = await skLedge.owner();
  console.log(`   Contract Owner: ${owner}`);

  console.log("\n   Checking authorized official...");
  const senderAuthorized = await skLedge.isAuthorizedOfficial(
    sender.address
  );
  console.log(`   Authorized: ${senderAuthorized}`);

  console.log("\n   Checking stored records...");
  const records = await skLedge.getAllRecords();
  console.log(`   Total Records: ${records.length}`);

  const isOwner =
    owner.toLowerCase() === sender.address.toLowerCase();

  console.log("\n----------------------------------------------------------------");
  console.log("VERIFICATION RESULTS");
  console.log("----------------------------------------------------------------");
  console.log(`Contract Address:      ${CONTRACT_ADDRESS}`);
  console.log(`Contract Owner:        ${owner}`);
  console.log(`Deployer/Sender:       ${sender.address}`);
  console.log(`Are You the Owner?     ${isOwner}`);
  console.log(`Are You Authorized?    ${senderAuthorized}`);
  console.log(`Total Records:         ${records.length}`);
  console.log("----------------------------------------------------------------");

  if (isOwner && senderAuthorized) {
    console.log("SUCCESS: Deployment verification passed!");
  } else {
    console.log("WARNING: Some verification requirements failed.");
  }
}

main().catch((error) => {
  console.error("\nVerification failed:");
  console.error(error);
  process.exitCode = 1;
});