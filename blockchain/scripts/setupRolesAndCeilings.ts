import "dotenv/config";
import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.SEPOLIA_PRIVATE_KEY;

  if (!contractAddress) {
    throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is not defined in environment variables.");
  }
  if (!rpcUrl || !privateKey) {
    throw new Error("SEPOLIA_RPC_URL or DEPLOYER_PRIVATE_KEY is missing in your .env file.");
  }

  // Directly initialize Ethers Provider & Wallet
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const deployer = new ethers.Wallet(privateKey, provider);

  console.log("Executing role and ceiling setup with account:", deployer.address);

  // Read ABI directly from Hardhat compiled artifacts
  const artifact = await hre.artifacts.readArtifact("SkLedge");
  const skLedge = new ethers.Contract(contractAddress, artifact.abi, deployer);

  // Compute standard OpenZeppelin role hashes
  const COA_ROLE = ethers.id("COA_ROLE");
  const CHAIRPERSON_ROLE = ethers.id("SK_CHAIRPERSON_ROLE");
  const TREASURER_ROLE = ethers.id("SK_TREASURER_ROLE");

  // Placeholder target addresses (Update with actual testnet addresses if available)
  const coaOfficial = "0x0000000000000000000000000000000000000000";
  const chairperson = "0x0000000000000000000000000000000000000000";
  const treasurer = "0x0000000000000000000000000000000000000000";

  console.log("Assigning AccessControl roles...");
  if (coaOfficial !== "0x0000000000000000000000000000000000000000") {
    const tx = await skLedge.grantRole(COA_ROLE, coaOfficial);
    await tx.wait();
    console.log(`Granted COA_ROLE to ${coaOfficial}`);
  }

  if (chairperson !== "0x0000000000000000000000000000000000000000") {
    const tx = await skLedge.grantRole(CHAIRPERSON_ROLE, chairperson);
    await tx.wait();
    console.log(`Granted SK_CHAIRPERSON_ROLE to ${chairperson}`);
  }

  if (treasurer !== "0x0000000000000000000000000000000000000000") {
    const tx = await skLedge.grantRole(TREASURER_ROLE, treasurer);
    await tx.wait();
    console.log(`Granted SK_TREASURER_ROLE to ${treasurer}`);
  }

  console.log("Setting default barangay expenditure ceiling...");
  const txCeiling = await skLedge.setAllocationCeiling("Barangay 1", 50000000);
  await txCeiling.wait();
  console.log("Barangay 1 ceiling set to 50,000,000 centavos.");

  console.log("Setup complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});