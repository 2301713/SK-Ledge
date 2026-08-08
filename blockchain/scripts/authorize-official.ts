import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const rawArgs = process.argv.slice(2);
    const cleanArgs: string[] = [];

    for (let i = 0; i < rawArgs.length; i++) {
        const arg = rawArgs[i];
        if (arg === "--network") {
            i++;
            continue;
        }
        if (arg === "run" || arg === "--" || arg.endsWith(".ts") || arg.endsWith(".js")) {
            continue;
        }
        if (!arg.startsWith("--")) {
            cleanArgs.push(arg);
        }
    }

    const targetAddress = cleanArgs[0];
    const rawStatus = cleanArgs[1] ?? "true";

    if (!targetAddress) {
        console.log("ERROR: Missing target official address.");
        console.log("Usage: npx hardhat run scripts/authorize-official.ts --network sepolia -- <TARGET_ADDRESS> [true|false]");
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
    const CONTRACT_ADDRESS = "0x88869e187614518bd95effBBc8c8Ea37AB30cA23";
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