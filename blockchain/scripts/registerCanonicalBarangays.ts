import "dotenv/config";
import { ethers } from "ethers";
import hre from "hardhat";
import {
  BATANGAS_BARANGAY_IDENTITIES,
  getUniqueBarangayAlias,
} from "../../web-app/lib/batangasBarangays.js";

const BATCH_SIZE = 20;
const READ_CONCURRENCY = 2;
const MAX_READ_ATTEMPTS = 5;

function isRateLimitError(error: unknown): boolean {
  const pending: unknown[] = [error];
  const visited = new Set<object>();

  while (pending.length > 0) {
    const current = pending.pop();
    if (typeof current === "string") {
      if (/429|rate.?limit|compute units per second|throughput/i.test(current)) {
        return true;
      }
      continue;
    }
    if (typeof current !== "object" || current === null || visited.has(current)) {
      continue;
    }

    visited.add(current);
    const record = current as Record<string, unknown>;
    if (record.code === 429) return true;
    pending.push(record.message, record.info, record.error);
  }

  return false;
}

async function readWithRetry<T>(
  description: string,
  read: () => Promise<T>,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await read();
    } catch (error) {
      if (!isRateLimitError(error) || attempt >= MAX_READ_ATTEMPTS) {
        throw error;
      }

      const delayMs = 1000 * 2 ** (attempt - 1);
      console.warn(
        `${description} was rate-limited; retrying in ${delayMs / 1000}s (${attempt}/${MAX_READ_ATTEMPTS - 1}).`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function mapInBatches<T, R>(
  values: T[],
  callback: (value: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let offset = 0; offset < values.length; offset += READ_CONCURRENCY) {
    const batch = values.slice(offset, offset + READ_CONCURRENCY);
    results.push(...(await Promise.all(batch.map(callback))));
  }
  return results;
}

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be set in the environment.`);
  }
  return value;
}

async function main(): Promise<void> {
  const contractAddress = requiredEnvironmentValue(
    "NEXT_PUBLIC_CONTRACT_ADDRESS",
  );
  if (
    !ethers.isAddress(contractAddress) ||
    contractAddress.toLowerCase() === ethers.ZeroAddress
  ) {
    throw new Error(
      "NEXT_PUBLIC_CONTRACT_ADDRESS must be a valid nonzero Ethereum address.",
    );
  }

  const rpcUrl = requiredEnvironmentValue("SEPOLIA_RPC_URL");
  const privateKey =
    process.env.DEPLOYER_PRIVATE_KEY?.trim() ||
    requiredEnvironmentValue("SEPOLIA_PRIVATE_KEY");
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId !== 11155111n) {
    throw new Error(
      `Expected Sepolia (chain ID 11155111), received ${network.chainId}.`,
    );
  }

  const deployer = new ethers.Wallet(privateKey, provider);
  const artifact = await hre.artifacts.readArtifact("SkLedge");
  const contract = new ethers.Contract(contractAddress, artifact.abi, deployer);
  const owner: string = await readWithRetry("Check contract owner", () =>
    contract.owner(),
  );
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error(
      `Deployer ${deployer.address} is not the contract owner (${owner}).`,
    );
  }

  const registrations: { name: string; alias: string }[] = [];
  for (
    let offset = 0;
    offset < BATANGAS_BARANGAY_IDENTITIES.length;
    offset += BATCH_SIZE
  ) {
    const identities = BATANGAS_BARANGAY_IDENTITIES.slice(
      offset,
      offset + BATCH_SIZE,
    );
    const pending = await mapInBatches(identities, async (identity) => {
      const name = identity.canonical;
      const alias = getUniqueBarangayAlias(identity);
      const canonicalRegistered: boolean = await readWithRetry(
        `Check canonical barangay '${name}'`,
        () => contract.isCanonicalBarangay(name),
      );
      const aliasRegistered: boolean =
        alias === name ||
        (await readWithRetry(`Check barangay alias '${alias}'`, () =>
          contract.isCanonicalBarangay(alias),
        ));

      if (canonicalRegistered) {
        const registeredName: string = await readWithRetry(
          `Verify canonical barangay '${name}'`,
          () => contract.canonicalizeBarangay(name),
        );
        if (registeredName !== name) {
          throw new Error(
            `Registered identity '${name}' resolves to '${registeredName}'.`,
          );
        }
      }

      if (aliasRegistered && alias !== name) {
        const registeredName: string = await readWithRetry(
          `Verify barangay alias '${alias}'`,
          () => contract.canonicalizeBarangay(alias),
        );
        if (registeredName !== name) {
          throw new Error(
            `Alias '${alias}' resolves to '${registeredName}', not '${name}'.`,
          );
        }
      }

      return !canonicalRegistered || !aliasRegistered
        ? { name, alias }
        : null;
    });
    registrations.push(
      ...pending.filter(
        (registration): registration is { name: string; alias: string } =>
          registration !== null,
      ),
    );
  }

  for (let offset = 0; offset < registrations.length; offset += BATCH_SIZE) {
    const batch = registrations.slice(offset, offset + BATCH_SIZE);
    const response = await contract.registerCanonicalBarangays(
      batch.map(({ name }) => name),
      batch.map(({ alias }) => alias),
    );
    console.log(
      `Register barangay identities ${offset + 1}-${offset + batch.length}: ${response.hash}`,
    );

    const receipt = await response.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error(
        `Barangay registration batch ${offset + 1} failed or was not confirmed.`,
      );
    }
    console.log(`Confirmed in block ${receipt.blockNumber}.`);

    await mapInBatches(batch, async ({ name, alias }) => {
      const registeredName: string = await readWithRetry(
        `Verify canonical barangay '${name}'`,
        () => contract.canonicalizeBarangay(name),
      );
      if (registeredName !== name) {
        throw new Error(
          `Registered identity '${name}' resolves to '${registeredName}'.`,
        );
      }
      if (alias !== name) {
        const registeredAlias: string = await readWithRetry(
          `Verify barangay alias '${alias}'`,
          () => contract.canonicalizeBarangay(alias),
        );
        if (registeredAlias !== name) {
          throw new Error(
            `Alias '${alias}' resolves to '${registeredAlias}', not '${name}'.`,
          );
        }
      }
    });
  }

  const registeredCount: bigint = await readWithRetry(
    "Verify registered barangay count",
    () => contract.canonicalBarangayCount(),
  );
  if (registeredCount < BigInt(BATANGAS_BARANGAY_IDENTITIES.length)) {
    throw new Error(
      `Expected at least ${BATANGAS_BARANGAY_IDENTITIES.length} canonical barangays, found ${registeredCount}.`,
    );
  }
  console.log(
    `Canonical barangays registered: ${registeredCount.toString()}.`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
