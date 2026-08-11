import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const targetAddress = process.env.TARGET_OFFICIAL_ADDRESS;
    const rawStatus = process.env.AUTHORIZATION_STATUS ?? "true";

    if (!targetAddress) {
        console.log("ERROR: Missing target official address.");
        console.log("Usage: $env:TARGET_OFFICIAL_ADDRESS='0x...'; npx hardhat run scripts/authorize-official.ts --network sepolia");
        return;
    }

    const { ethers } = await network.create({ network: "sepolia" });

    if (!ethers.isAddress(targetAddress)) {
        console.log(`ERROR: Invalid Ethereum address: "${targetAddress}"`);
        return;
    }

    const status = rawStatus.toLowerCase() === "true" || rawStatus === "1";

    const [sender] = await ethers.getSigners();
    if (!sender) {
        console.log("ERROR: No signer found. Check private key configuration.");
        return;
    }

    const artifactPath = path.join("artifacts", "contracts", "SkLedge.sol", "SkLedge.json");
    if (!fs.existsSync(artifactPath)) {
        console.log(`ERROR: Artifact not found at ${artifactPath}`);
        return;
    }

    const artifactJson = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const CONTRACT_ADDRESS = "0x857615c8b31CF1c51ef27B5F8FAA4F019C111549";
    const skLedge = new ethers.Contract(CONTRACT_ADDRESS, artifactJson.abi, sender);

    console.log(`Submitting setOfficialAuthorization for ${targetAddress} (Status: ${status})...`);
    const tx = await skLedge.setOfficialAuthorization(targetAddress, status);
    console.log(`Transaction Hash: ${tx.hash}`);

    console.log("Waiting for confirmation on Sepolia...");
    const receipt = await tx.wait();
    console.log(`Mined in block: ${receipt?.blockNumber}`);

    const newStatus = await skLedge.isAuthorizedOfficial(targetAddress);
    console.log("----------------------------------------------------------------");
    console.log(`Target Address:           ${targetAddress}`);
    console.log(`Authorization Status Set:  ${status}`);
    console.log(`Transaction Hash:         ${tx.hash}`);
    console.log(`Mined Status:              Confirmed`);
    console.log(`New isAuthorizedOfficial:  ${newStatus}`);
    console.log("----------------------------------------------------------------");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});