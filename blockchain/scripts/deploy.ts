import hre from "hardhat";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Deploying SkLedge smart contract...");

  // Retrieve RPC URL and Private Key from process.env or Hardhat network config
  const config = (hre.config.networks as any)["sepolia"];
  const rpcUrl = process.env.SEPOLIA_RPC_URL || (typeof config?.url === "string" ? config.url : String(config?.url || ""));
  const privateKey = process.env.SEPOLIA_PRIVATE_KEY || config?.accounts?.[0];

  if (!rpcUrl || !privateKey || rpcUrl === "[object Object]") {
    throw new Error(
      "Missing or invalid SEPOLIA_RPC_URL and SEPOLIA_PRIVATE_KEY in your .env file."
    );
  }

  // Ensure RPC URL is passed as a string to JsonRpcProvider
  const provider = new ethers.JsonRpcProvider(String(rpcUrl));
  const wallet = new ethers.Wallet(String(privateKey), provider);

  console.log("Deploying from wallet address:", wallet.address);

  // Use process.cwd() instead of __dirname for ES Module compatibility
  const artifactPath = path.join(
    process.cwd(),
    "artifacts/contracts/SkLedge.sol/SkLedge.json"
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      "Contract artifact not found. Make sure you run 'npx hardhat compile' first."
    );
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const SkLedgeFactory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  // Deploy the contract
  const skLedge = await SkLedgeFactory.deploy();
  await skLedge.waitForDeployment();

  const contractAddress = await skLedge.getAddress();

  console.log("==========================================");
  console.log(`SkLedge deployed successfully!`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log("==========================================");
  console.log("Copy this address for storage migration and frontend integration.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});