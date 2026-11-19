import "dotenv/config";
import { execSync } from "child_process";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import hre from "hardhat";
import { ethers } from "ethers";
import {
  contractAddressFromEnv,
  requiredEnv,
  sepoliaProvider,
} from "./lib/contractConnection.js";

const EXPLORER_API = "https://api.etherscan.io/v2/api";

type EtherscanResult = Record<string, string>;

function sha256(value: string | Uint8Array): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hashHex(hex: string): string {
  const body = hex.startsWith("0x") ? hex.slice(2) : hex;
  return sha256(Buffer.from(body, "hex"));
}

/**
 * Removes the trailing Solidity CBOR metadata (IPFS hash + compiler version).
 * The hash varies with the build environment, so functional bytecode equality
 * is compared without it.
 */
function stripMetadata(hex: string): string {
  const body = hex.toLowerCase().replace(/^0x/, "");
  if (body.length < 4) {
    return body;
  }
  const metadataLength = parseInt(body.slice(-4), 16);
  const suffixHexLength = (metadataLength + 2) * 2;
  if (!Number.isFinite(metadataLength) || suffixHexLength >= body.length) {
    return body;
  }
  return body.slice(0, body.length - suffixHexLength);
}

function git(command: string): string {
  return execSync(`git ${command}`, { encoding: "utf8" }).trim();
}

async function etherscan(
  params: Record<string, string>
): Promise<EtherscanResult | null> {
  const apiKey = process.env.ETHERSCAN_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const url = new URL(EXPLORER_API);
  url.searchParams.set("chainid", "11155111");
  url.searchParams.set("apikey", apiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Etherscan request failed with HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as {
    status?: string;
    message?: string;
    result?: EtherscanResult | EtherscanResult[];
  };
  if (payload.status === "0" || !payload.result) {
    return null;
  }
  const result = Array.isArray(payload.result)
    ? payload.result[0]
    : payload.result;
  return result ?? null;
}

function findDeploymentDir(contractAddress: string): string | null {
  const root = path.join(process.cwd(), "ignition", "deployments");
  if (!fs.existsSync(root)) {
    return null;
  }

  const matches = fs
    .readdirSync(root)
    .map((name) => path.join(root, name))
    .filter((dir) => {
      const addressesFile = path.join(dir, "deployed_addresses.json");
      if (!fs.existsSync(addressesFile)) {
        return false;
      }
      try {
        const addresses = JSON.parse(
          fs.readFileSync(addressesFile, "utf8")
        ) as Record<string, string>;
        return Object.values(addresses).some(
          (value) => value.toLowerCase() === contractAddress.toLowerCase()
        );
      } catch {
        return false;
      }
    })
    .sort();

  return matches.length > 0 ? matches[matches.length - 1] : null;
}

function compilerDetails(): {
  version: string;
  optimizer: boolean;
  runs: number | null;
  evmVersion: string | null;
} {
  const buildInfoDir = path.join(process.cwd(), "artifacts", "build-info");
  if (fs.existsSync(buildInfoDir)) {
    for (const file of fs.readdirSync(buildInfoDir)) {
      if (!file.endsWith(".json")) {
        continue;
      }
      const buildInfo = JSON.parse(
        fs.readFileSync(path.join(buildInfoDir, file), "utf8")
      ) as {
        solcLongVersion?: string;
        input?: {
          sources?: Record<string, unknown>;
          settings?: {
            optimizer?: { enabled?: boolean; runs?: number };
            evmVersion?: string;
          };
        };
        output?: { contracts?: Record<string, Record<string, unknown>> };
      };
      const sources = Object.keys(buildInfo.input?.sources ?? {});
      const hasSkLedge = sources.some((source) =>
        source.endsWith("SkLedge.sol")
      );
      if (hasSkLedge) {
        const settings = buildInfo.input?.settings;
        return {
          version: buildInfo.solcLongVersion ?? "unknown",
          optimizer: settings?.optimizer?.enabled ?? false,
          runs: settings?.optimizer?.runs ?? null,
          evmVersion: settings?.evmVersion ?? null,
        };
      }
    }
  }

  return { version: "unknown", optimizer: false, runs: null, evmVersion: null };
}

async function main(): Promise<void> {
  const contractAddress = contractAddressFromEnv();
  const provider = await sepoliaProvider();
  const artifact = await hre.artifacts.readArtifact("SkLedge");
  const artifactView = artifact as unknown as {
    abi: ethers.InterfaceAbi;
    bytecode: string;
    deployedBytecode: string;
  };

  const readContract = new ethers.Contract(
    contractAddress,
    artifactView.abi,
    provider
  );
  const [owner, nextRecordId, canonicalBarangayCount, records, code] =
    await Promise.all([
      readContract.owner() as Promise<string>,
      readContract.nextRecordId() as Promise<bigint>,
      readContract.canonicalBarangayCount() as Promise<bigint>,
      readContract.getAllRecords() as Promise<unknown[]>,
      provider.getCode(contractAddress),
    ]);

  const compiler = compilerDetails();
  const deploymentDir = findDeploymentDir(contractAddress);
  const deploymentId = deploymentDir
    ? path.basename(deploymentDir)
    : `live-${contractAddress.slice(2, 10).toLowerCase()}`;

  let deploymentTransaction: string | null = null;
  let deploymentBlock: number | null = null;
  let deploymentTimestamp: number | null = null;
  let deployer: string | null = null;
  let etherscanVerification: EtherscanResult | null = null;
  const warnings: string[] = [];

  const creation = await etherscan({
    module: "contract",
    action: "getcontractcreation",
    contractaddresses: contractAddress,
  });
  if (creation?.txHash) {
    deploymentTransaction = creation.txHash;
    const transaction = await provider.getTransaction(creation.txHash);
    if (transaction) {
      deployer = transaction.from;
      if (transaction.blockNumber !== null) {
        deploymentBlock = transaction.blockNumber;
        const block = await provider.getBlock(transaction.blockNumber);
        deploymentTimestamp = block?.timestamp ?? null;
      }
    }
  } else {
    warnings.push(
      "Etherscan contract-creation lookup unavailable; deployment transaction and deployer omitted."
    );
  }

  try {
    etherscanVerification = await etherscan({
      module: "contract",
      action: "getsourcecode",
      address: contractAddress,
    });
    if (!etherscanVerification) {
      warnings.push("Etherscan source-code lookup returned no result.");
    }
  } catch (error) {
    warnings.push(
      `Etherscan source-code lookup failed: ${(error as Error).message}`
    );
  }

  const verified = Boolean(etherscanVerification?.SourceCode);
  const metadataMatches =
    code.toLowerCase() === artifactView.deployedBytecode.toLowerCase();
  const onChainBytecodeMatch =
    stripMetadata(code) === stripMetadata(artifactView.deployedBytecode);
  if (!onChainBytecodeMatch) {
    warnings.push(
      "On-chain runtime bytecode does not match the locally compiled artifact; redeploy or check out the deployed source revision."
    );
  } else if (!metadataMatches) {
    warnings.push(
      "Runtime bytecode matches functionally; only the embedded Solidity metadata hash differs (build-environment dependent)."
    );
  }

  const deploymentInput = deploymentTransaction
    ? (await provider.getTransaction(deploymentTransaction))?.data ?? null
    : null;
  const creationBytecodeMatchesTransaction =
    deploymentInput === null
      ? null
      : stripMetadata(deploymentInput) === stripMetadata(artifactView.bytecode);

  let repoHead: string | null = null;
  let contractSourceDirty: boolean | null = null;
  try {
    repoHead = git("rev-parse HEAD");
    contractSourceDirty =
      git("status --porcelain -- contracts/SkLedge.sol").length > 0;
  } catch {
    warnings.push("Git metadata unavailable; source revision omitted.");
  }

  const evidence = {
    deploymentId,
    network: "sepolia",
    chainId: 11155111,
    contractAddress,
    deploymentTransaction,
    deploymentBlock,
    deploymentTimestamp,
    deploymentDateUtc:
      deploymentTimestamp === null
        ? null
        : new Date(deploymentTimestamp * 1000).toISOString(),
    deploymentDatePht:
      deploymentTimestamp === null
        ? null
        : new Date((deploymentTimestamp + 8 * 3600) * 1000)
            .toISOString()
            .replace("Z", "+08:00"),
    deployer,
    owner,
    source: {
      file: "blockchain/contracts/SkLedge.sol",
      repoHead,
      contractSourceDirty,
      generatedAt: new Date().toISOString(),
    },
    compiler,
    fingerprints: {
      abiSha256: sha256(JSON.stringify(artifactView.abi)),
      creationBytecodeSha256: hashHex(artifactView.bytecode),
      deploymentTransactionInputSha256: deploymentInput
        ? hashHex(deploymentInput)
        : null,
      artifactRuntimeBytecodeSha256: hashHex(artifactView.deployedBytecode),
      onChainRuntimeBytecodeSha256: hashHex(code),
      runtimeBytecodeLength: (code.length - 2) / 2,
      hashingNotes:
        "ABI hash is sha256 of JSON.stringify(artifact.abi); bytecode hashes are sha256 of the raw hex bytes.",
    },
    etherscan: {
      url: `https://sepolia.etherscan.io/address/${contractAddress}`,
      verified,
      contractName: etherscanVerification?.ContractName ?? null,
      compilerVersion: etherscanVerification?.CompilerVersion ?? null,
      optimizationUsed:
        etherscanVerification?.OptimizationUsed === "1"
          ? true
          : etherscanVerification?.OptimizationUsed === "0"
            ? false
            : null,
      runs: etherscanVerification?.Runs ?? null,
      evmVersion: etherscanVerification?.EVMVersion ?? null,
      proxy: etherscanVerification?.Proxy === "1",
    },
    onChainBytecodeMatch,
    metadataMatches,
    creationBytecodeMatchesTransaction,
    env: {
      blockchainDotEnv: extractEnvAddress("blockchain/.env"),
      webAppDotEnv: extractEnvAddress("web-app/.env"),
    },
    verification: {
      owner,
      nextRecordId: nextRecordId.toString(),
      canonicalBarangayCount: canonicalBarangayCount.toString(),
      totalRecords: records.length,
      isDeployerAuthorized: deployer
        ? await readContract.isAuthorizedOfficial(deployer)
        : null,
    },
    warnings,
  };

  if (!deploymentDir) {
    throw new Error(
      `No Ignition deployment folder records ${contractAddress}; cannot file evidence automatically.`
    );
  }

  const evidencePath = path.join(deploymentDir, "deployment-evidence.json");
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);

  console.log(`Wrote deployment evidence to ${evidencePath}`);
  console.log(`Contract:         ${contractAddress}`);
  console.log(`Owner:            ${owner}`);
  console.log(`Etherscan verified: ${verified}`);
  console.log(`Bytecode match:   ${onChainBytecodeMatch}`);
  console.log(`Records:          ${records.length}`);
  if (warnings.length > 0) {
    console.log("Warnings:");
    for (const warning of warnings) {
      console.log(` - ${warning}`);
    }
  }
}

function extractEnvAddress(relativePath: string): string | null {
  const file = path.join(process.cwd(), "..", relativePath);
  if (!fs.existsSync(file)) {
    return null;
  }
  const match = fs
    .readFileSync(file, "utf8")
    .match(/^NEXT_PUBLIC_CONTRACT_ADDRESS\s*=\s*(.+)$/m);
  return match ? match[1].trim() : null;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
