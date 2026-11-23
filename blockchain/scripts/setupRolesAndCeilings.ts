import "dotenv/config";
import { ethers } from "ethers";
import hre from "hardhat";
import { BATANGAS_BARANGAYS } from "../../web-app/lib/batangasBarangays.js";

const READ_RETRY_ATTEMPTS = 5;

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be set in the environment.`);
  }
  return value;
}

function authorizationStatus(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase() ?? "true";
  if (value === "true" || value === "1") {
    return true;
  }
  if (value === "false" || value === "0") {
    return false;
  }
  throw new Error(`${name} must be true, false, 1, or 0.`);
}

function addressList(name: string): string[] {
  const value = process.env[name]?.trim();
  if (!value) return [];

  const addresses = value
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);

  for (const address of addresses) {
    if (
      !ethers.isAddress(address) ||
      address.toLowerCase() === ethers.ZeroAddress
    ) {
      throw new Error(`${name} contains an invalid or zero wallet address: ${address}`);
    }
  }

  return [...new Set(addresses.map((address) => ethers.getAddress(address)))];
}

function isAllBarangays(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "all" || normalized === "*";
}

function isRateLimitError(error: unknown): boolean {
  if (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === 429
  ) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return /429|rate.?limit|compute units per second|throughput/i.test(message);
}

async function readWithRetry<T>(
  description: string,
  read: () => Promise<T>
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await read();
    } catch (error) {
      if (!isRateLimitError(error) || attempt >= READ_RETRY_ATTEMPTS) {
        throw error;
      }

      const delaySeconds = attempt * 2;
      console.log(
        `${description} was rate-limited; retrying in ${delaySeconds}s (${attempt}/${READ_RETRY_ATTEMPTS - 1}).`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, delaySeconds * 1000)
      );
    }
  }
}

async function submitAndConfirm(
  description: string,
  createTransaction: () => Promise<ethers.TransactionResponse>
): Promise<void> {
  let response: ethers.TransactionResponse | null = null;
  let lastError: unknown;

  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      response = await createTransaction();
      break;
    } catch (error) {
      lastError = error;
      const message =
        error instanceof Error ? error.message : String(error);

      if (
        message.includes("in-flight transaction limit reached") ||
        message.includes("-32000")
      ) {
        const delaySeconds = attempt * 3;
        console.log(
          `RPC reported an in-flight transaction limit. Waiting ${delaySeconds}s before retry ${attempt}/8.`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, delaySeconds * 1000)
        );
        continue;
      }

      if (isRateLimitError(error)) {
        const delaySeconds = attempt * 5;
        console.log(
          `RPC rate limited. Waiting ${delaySeconds}s before retry ${attempt}/8.`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, delaySeconds * 1000)
        );
        continue;
      }

      throw error;
    }
  }

  if (!response) {
    throw lastError instanceof Error
      ? lastError
      : new Error("Transaction submission failed after retries.");
  }
  console.log(`${description}: ${response.hash}`);

  const receipt = await response.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error(`${description} failed or was not confirmed.`);
  }
  console.log(`${description} confirmed in block ${receipt.blockNumber}.`);
  // Pace requests to avoid RPC rate limits during large batch runs.
  await new Promise((resolve) => setTimeout(resolve, 150));
}

async function main(): Promise<void> {
  const contractAddress = requiredEnvironmentValue("NEXT_PUBLIC_CONTRACT_ADDRESS");
  if (
    !ethers.isAddress(contractAddress) ||
    contractAddress.toLowerCase() === ethers.ZeroAddress
  ) {
    throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS must be a valid nonzero Ethereum address.");
  }

  const rpcUrl = requiredEnvironmentValue("SEPOLIA_RPC_URL");
  const privateKey =
    process.env.DEPLOYER_PRIVATE_KEY?.trim() ||
    requiredEnvironmentValue("SEPOLIA_PRIVATE_KEY");
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId !== 11155111n) {
    throw new Error(`Expected Sepolia (chain ID 11155111), received ${network.chainId}.`);
  }

  const deployer = new ethers.Wallet(privateKey, provider);
  const artifact = await hre.artifacts.readArtifact("SkLedge");
  const contract = new ethers.Contract(contractAddress, artifact.abi, deployer);
  const owner = await contract.owner();
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error(
      `Deployer ${deployer.address} is not the contract owner (${owner}).`
    );
  }

  const officialAddress = process.env.TARGET_OFFICIAL_ADDRESS?.trim();
  const officialAddresses = [
    ...addressList("TARGET_OFFICIAL_ADDRESSES"),
    ...(officialAddress ? addressList("TARGET_OFFICIAL_ADDRESS") : []),
  ].filter((address, index, all) => all.indexOf(address) === index);
  const officialBarangayAddresses = addressList(
    "TARGET_OFFICIAL_BARANGAY_ADDRESS"
  );
  const officialBarangayName =
    process.env.TARGET_OFFICIAL_BARANGAY_NAME?.trim();
  const authorizeAllBarangays =
    officialBarangayName !== undefined &&
    isAllBarangays(officialBarangayName);
  const officialBarangayNames = authorizeAllBarangays
    ? [...BATANGAS_BARANGAYS]
    : officialBarangayName
      ? [officialBarangayName]
      : [];
  const approverAddress = process.env.TARGET_APPROVER_ADDRESS?.trim();
  const barangay = process.env.BARANGAY_NAME?.trim();
  const ceilingValue = process.env.ALLOCATION_CEILING_CENTAVOS?.trim();

  if (
    approverAddress &&
    (!ethers.isAddress(approverAddress) ||
      approverAddress.toLowerCase() === ethers.ZeroAddress)
  ) {
    throw new Error("TARGET_APPROVER_ADDRESS must be a valid nonzero Ethereum address.");
  }
  if (
    Boolean(officialBarangayAddresses.length) !==
    Boolean(officialBarangayNames.length)
  ) {
    throw new Error(
      "Set official barangay addresses and TARGET_OFFICIAL_BARANGAY_NAME (a barangay name, ALL, or *) to configure barangay access."
    );
  }
  if (Boolean(barangay) !== Boolean(ceilingValue)) {
    throw new Error(
      "Set both BARANGAY_NAME and ALLOCATION_CEILING_CENTAVOS to configure a ceiling."
    );
  }
  if (
    !officialAddresses.length &&
    !officialBarangayAddresses.length &&
    !approverAddress &&
    !barangay
  ) {
    throw new Error(
      "Configure an official, an approver, and/or a barangay ceiling before running setup."
    );
  }
  if (ceilingValue && (!/^\d+$/.test(ceilingValue) || BigInt(ceilingValue) <= 0n)) {
    throw new Error("ALLOCATION_CEILING_CENTAVOS must be a positive whole number.");
  }

  if (officialAddresses.length) {
    const authorized = authorizationStatus("OFFICIAL_AUTHORIZATION_STATUS");
    for (const address of officialAddresses) {
      await submitAndConfirm(
        `Set official authorization for ${address} to ${authorized}`,
        () => contract.setOfficialAuthorization(address, authorized)
      );
      if ((await contract.isAuthorizedOfficial(address)) !== authorized) {
        throw new Error("Official authorization did not match the requested status.");
      }
    }
  }

  if (approverAddress) {
    const authorized = authorizationStatus("APPROVER_AUTHORIZATION_STATUS");
    await submitAndConfirm(
      `Set approver authorization for ${approverAddress} to ${authorized}`,
      () => contract.setApproverAuthorization(approverAddress, authorized)
    );
    if ((await contract.isApprover(approverAddress)) !== authorized) {
      throw new Error("Approver authorization did not match the requested status.");
    }
  }

  if (officialBarangayAddresses.length && officialBarangayNames.length) {
    const authorized = authorizationStatus(
      "OFFICIAL_BARANGAY_AUTHORIZATION_STATUS"
    );

    if (authorizeAllBarangays) {
      const registeredCount = await readWithRetry(
        "Check canonical barangay count",
        () => contract.canonicalBarangayCount()
      );
      if (registeredCount < BigInt(officialBarangayNames.length)) {
        throw new Error(
          `Only ${registeredCount} canonical barangays are registered; run "npm run register-barangays" before authorizing ALL.`
        );
      }
      console.log(
        `Authorizing ${officialBarangayAddresses.length} official(s) for all ${officialBarangayNames.length} canonical barangays (${authorized ? "grant" : "revoke"}).`
      );
    }

    const totalTargets =
      officialBarangayAddresses.length * officialBarangayNames.length;
    let processed = 0;
    let skipped = 0;

    for (const address of officialBarangayAddresses) {
      for (const officialBarangayName of officialBarangayNames) {
        processed++;

        const current = await readWithRetry(
          `Check barangay access for ${address} to ${officialBarangayName}`,
          () =>
            contract.isOfficialAuthorizedForBarangay(
              address,
              officialBarangayName
            )
        );
        if (current === authorized) {
          skipped++;
          if (totalTargets > 1) {
            console.log(
              `[${processed}/${totalTargets}] ${address} is already ${authorized ? "authorized" : "revoked"} for ${officialBarangayName}; skipping.`
            );
          }
          continue;
        }

        await submitAndConfirm(
          `Set barangay access for ${address} to ${officialBarangayName}: ${authorized}`,
          () =>
            contract.setOfficialBarangayAuthorization(
              address,
              officialBarangayName,
              authorized
            )
        );

        const applied = await readWithRetry(
          `Verify barangay access for ${address} to ${officialBarangayName}`,
          () =>
            contract.isOfficialAuthorizedForBarangay(
              address,
              officialBarangayName
            )
        );
        if (applied !== authorized) {
          throw new Error(
            "Official barangay authorization did not match the requested status."
          );
        }
        if (totalTargets > 1) {
          console.log(
            `[${processed}/${totalTargets}] ${address} is now ${authorized ? "authorized" : "revoked"} for ${officialBarangayName}.`
          );
        }
      }
    }

    if (skipped) {
      console.log(
        `Skipped ${skipped} barangay authorization target(s) that were already in the requested state.`
      );
    }
  }

  if (barangay && ceilingValue) {
    const ceiling = BigInt(ceilingValue);
    await submitAndConfirm(
      `Set allocation ceiling for ${barangay} to ${ceiling} centavos`,
      () => contract.setAllocationCeiling(barangay, ceiling)
    );
    if ((await contract.allocationCeilings(barangay)) !== ceiling) {
      throw new Error("Allocation ceiling did not match the requested value.");
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
