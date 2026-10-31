import hre from "hardhat";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

function parseStringValue(val: any): string {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object" && val.value) return String(val.value);
    return String(val);
}

async function main() {
    const targetAddress = process.env.TARGET_APPROVER_ADDRESS;
    const rawStatus = process.env.AUTHORIZATION_STATUS ?? "true";

    if (!targetAddress) {
        throw new Error("Missing target approver address. Usage: TARGET_APPROVER_ADDRESS='0x...' npx hardhat run scripts/authorize-approver.ts --network sepolia");
    }

    if (!ethers.isAddress(targetAddress)) {
        throw new Error(`Invalid Ethereum address: "${targetAddress}"`);
    }

    const status = rawStatus.toLowerCase() === "true" || rawStatus === "1";
    const networkName = (hre as any).network?.name || "sepolia";
    const networkConfig = (hre.config.networks as any)[networkName] || {};
    const rawRpc = process.env.SEPOLIA_RPC_URL || networkConfig.url;
    const rawKey = process.env.SEPOLIA_PRIVATE_KEY || (Array.isArray(networkConfig.accounts) ? networkConfig.accounts[0] : networkConfig.accounts);
    const rpcUrl = parseStringValue(rawRpc);
    const privateKey = parseStringValue(rawKey);

    if (!rpcUrl || !privateKey) {
        throw new Error("Missing RPC URL or Private Key. Ensure SEPOLIA_RPC_URL and SEPOLIA_PRIVATE_KEY are set.");
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const sender = new ethers.Wallet(privateKey, provider);
    const deploymentPath = path.join("ignition", "deployments", "chain-11155111", "deployed_addresses.json");

    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`Deployment addresses file not found at ${deploymentPath}`);
    }

    const deployedAddresses = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const contractAddress = deployedAddresses["SkLedgeModule#SkLedge"];

    if (!contractAddress) {
        throw new Error(`Key "SkLedgeModule#SkLedge" missing in ${deploymentPath}`);
    }

    const artifactPath = path.join("artifacts", "contracts", "SkLedge.sol", "SkLedge.json");

    if (!fs.existsSync(artifactPath)) {
        throw new Error(`Artifact not found at ${artifactPath}`);
    }

    const artifactJson = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const skLedge = new ethers.Contract(contractAddress, artifactJson.abi, sender);

    console.log(`Submitting setApproverAuthorization for ${targetAddress} (Status: ${status})...`);
    const tx = await skLedge.setApproverAuthorization(targetAddress, status);
    console.log(`Transaction Hash: ${tx.hash}`);

    console.log("Waiting for confirmation on Sepolia...");
    const receipt = await tx.wait();
    if (!receipt) {
        throw new Error("Transaction was not mined; no receipt was returned.");
    }
    console.log(`Mined in block: ${receipt.blockNumber}`);

    const newStatus = await skLedge.isApprover(targetAddress);
    console.log("----------------------------------------------------------------");
    console.log(`Target Address:          ${targetAddress}`);
    console.log(`Authorization Status Set: ${status}`);
    console.log(`Transaction Hash:        ${tx.hash}`);
    console.log(`Mined Status:            Confirmed`);
    console.log(`Final isApprover status: ${newStatus}`);
    console.log("----------------------------------------------------------------");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
