import * as fs from "fs";
import * as path from "path";

async function main() {
  const rootDir = process.cwd();
  const artifactPath = path.join(rootDir, "artifacts/contracts/SkLedge.sol/SkLedge.json");
  const targetPath = path.join(rootDir, "../web-app/lib/contractConfig.ts");

  if (!fs.existsSync(artifactPath)) {
    throw new Error("Artifact not found. Run 'npx hardhat compile' first.");
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abiString = JSON.stringify(artifact.abi, null, 2);

  let fileContent = "";
  if (fs.existsSync(targetPath)) {
    const existing = fs.readFileSync(targetPath, "utf8");
    if (existing.includes("export const SK_LEDGE_ABI")) {
      fileContent = existing.replace(
        /export const SK_LEDGE_ABI = \[[\s\S]*?\] as const;/,
        `export const SK_LEDGE_ABI = ${abiString} as const;`
      );
    } else {
      fileContent = `${existing}\n\nexport const SK_LEDGE_ABI = ${abiString} as const;\n`;
    }
  } else {
    fileContent = `export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";\nexport const LEGACY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LEGACY_CONTRACT_ADDRESS || "";\n\nexport const SK_LEDGE_ABI = ${abiString} as const;\n`;
  }

  fs.writeFileSync(targetPath, fileContent, "utf8");
  console.log("Successfully synchronized contract ABI to web-app/lib/contractConfig.ts");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});