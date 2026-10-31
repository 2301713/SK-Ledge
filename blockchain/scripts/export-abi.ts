/// <reference types="node" />
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// @ts-ignore
const scriptDir = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const artifactPath = path.resolve(
    scriptDir,
    "../artifacts/contracts/SkLedge.sol/SkLedge.json"
  );
  const outputPath = path.resolve(
    scriptDir,
    "../../web-app/lib/contractAbi.generated.ts"
  );

  if (!fs.existsSync(artifactPath)) {
    console.error(
      `Error: Compiled artifact not found at "${artifactPath}".\nPlease run "npx hardhat compile" first.`
    );
    process.exit(1);
  }

  const rawArtifact = fs.readFileSync(artifactPath, "utf-8");
  const artifact = JSON.parse(rawArtifact);

  if (!artifact.abi || !Array.isArray(artifact.abi)) {
    console.error(
      `Error: Artifact at "${artifactPath}" does not contain a valid "abi" array.`
    );
    process.exit(1);
  }

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fileContent = `// AUTO-GENERATED FILE - DO NOT EDIT\nexport const SK_LEDGE_ABI = ${JSON.stringify(
    artifact.abi,
    null,
    2
  )} as const;\n`;

  fs.writeFileSync(outputPath, fileContent, "utf-8");
  console.log(`Successfully exported ABI to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});