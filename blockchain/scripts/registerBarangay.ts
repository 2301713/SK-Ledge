import { connectAsOwner } from "./lib/contractConnection.js";

/**
 * Registers ONE canonical barangay (and an optional alias) on the live contract.
 *
 * Usage:
 *   BARANGAY_CANONICAL_NAME="Conde Itaas, Balete" \
 *   BARANGAY_ALIAS="" \
 *   npx hardhat run scripts/registerBarangay.ts --network sepolia
 *
 * Only the contract owner may register barangays. If the alias is ambiguous
 * (another barangay already claims it), the contract reverts, so leave the
 * alias empty in that case.
 */

function optionalEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

async function main(): Promise<void> {
  const canonicalName = optionalEnv("BARANGAY_CANONICAL_NAME");
  const alias = optionalEnv("BARANGAY_ALIAS");

  if (!canonicalName) {
    throw new Error(
      'Missing BARANGAY_CANONICAL_NAME. Usage: BARANGAY_CANONICAL_NAME="Poblacion, Bauan" npx hardhat run scripts/registerBarangay.ts --network sepolia',
    );
  }

  const { contract, contractAddress } = await connectAsOwner();

  const alreadyRegistered: boolean =
    await contract.isCanonicalBarangay(canonicalName);
  if (alreadyRegistered) {
    const resolved: string = await contract.canonicalizeBarangay(canonicalName);
    if (resolved !== canonicalName) {
      throw new Error(
        `"${canonicalName}" is already registered as an alias of "${resolved}".`,
      );
    }
    console.log(`"${canonicalName}" is already registered on ${contractAddress}.`);
    console.log("Nothing to do.");
    return;
  }

  if (alias) {
    const aliasRegistered: boolean = await contract.isCanonicalBarangay(alias);
    if (aliasRegistered) {
      const resolved: string = await contract.canonicalizeBarangay(alias);
      throw new Error(
        `Alias "${alias}" is already taken by "${resolved}". Choose another alias or leave it empty.`,
      );
    }
  }

  console.log(
    `Registering "${canonicalName}"${alias ? ` (alias: "${alias}")` : ""} on ${contractAddress}...`,
  );
  const transaction = await contract.registerCanonicalBarangays(
    [canonicalName],
    [alias],
  );
  console.log(`Transaction hash: ${transaction.hash}`);

  const receipt = await transaction.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error("Registration transaction failed or was not confirmed.");
  }

  const resolved: string = await contract.canonicalizeBarangay(canonicalName);
  if (resolved !== canonicalName) {
    throw new Error(
      `canonicalizeBarangay("${canonicalName}") returned "${resolved}".`,
    );
  }
  if (alias) {
    const resolvedAlias: string = await contract.canonicalizeBarangay(alias);
    if (resolvedAlias !== canonicalName) {
      throw new Error(`Alias "${alias}" resolves to "${resolvedAlias}".`);
    }
  }

  const count: bigint = await contract.canonicalBarangayCount();
  console.log("----------------------------------------------------------------");
  console.log(`Contract Address:       ${contractAddress}`);
  console.log(`Canonical barangay:     ${resolved}`);
  console.log(`Alias:                  ${alias || "(none)"}`);
  console.log(`Transaction Hash:       ${transaction.hash}`);
  console.log(`Mined in block:         ${receipt.blockNumber}`);
  console.log(`Canonical barangays:    ${count.toString()}`);
  console.log("----------------------------------------------------------------");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
