import { connectAsOwner } from "./lib/contractConnection.js";

/**
 * Voids financial records on the live contract. Records are never deleted: the
 * contract only marks them voided with a public, permanent reason.
 *
 * Usage (all non-voided records):
 *   VOID_REASON="Pre-UAT test data" \
 *   npx hardhat run scripts/voidRecords.ts --network sepolia
 *
 * Usage (selected record ids):
 *   RECORD_IDS="3,4,5" VOID_REASON="Pre-UAT test data" \
 *   npx hardhat run scripts/voidRecords.ts --network sepolia
 *
 * Voiding an Allocation returns its amount to the barangay's remaining ceiling.
 * Run with RECORD_IDS unset only when you really mean every record.
 */

const DEFAULT_REASON = "Pre-UAT test data";

function parseRecordIds(): number[] | null {
  const raw = process.env.RECORD_IDS?.trim();
  if (!raw) return null;
  const ids = raw
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));
  if (ids.length === 0 || ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new Error('RECORD_IDS must be a comma-separated list of positive integers, e.g. "3,4,5".');
  }
  return ids;
}

async function main(): Promise<void> {
  const reason = process.env.VOID_REASON?.trim() || DEFAULT_REASON;
  const selectedIds = parseRecordIds();

  const { contract, contractAddress } = await connectAsOwner();
  const records = await contract.getAllRecords();

  const targets = records
    .filter((record: { voided: boolean; id: bigint }) => !record.voided)
    .filter(
      (record: { id: bigint }) =>
        selectedIds === null || selectedIds.includes(Number(record.id)),
    );

  if (targets.length === 0) {
    console.log(`No records to void on ${contractAddress}.`);
    return;
  }

  console.log(
    `Voiding ${targets.length} record(s) on ${contractAddress} with reason "${reason}"...`,
  );

  for (const record of targets) {
    const id = Number(record.id);
    const transaction = await contract.voidRecord(id, reason);
    console.log(`  #${id} ${record.recordType} (${record.barangay}): ${transaction.hash}`);

    const receipt = await transaction.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error(`Voiding record ${id} failed or was not confirmed.`);
    }
    console.log(`  #${id} confirmed in block ${receipt.blockNumber}.`);
  }

  const after = await contract.getAllRecords();
  const voidedCount = after.filter((record: { voided: boolean }) => record.voided).length;

  console.log("----------------------------------------------------------------");
  console.log(`Contract Address:   ${contractAddress}`);
  console.log(`Records on-chain:   ${after.length}`);
  console.log(`Voided records:     ${voidedCount}`);
  console.log("----------------------------------------------------------------");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
