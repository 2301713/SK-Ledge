/**
 * Verifies a completed Sepolia journey after "Sync ledger" has run.
 *
 * Usage:
 *   node scripts/verify-journey.mjs [path-to-e2e-evidence.json]
 *
 * Defaults to ../blockchain/e2e-evidence.json and reads web-app/.env for the
 * Supabase URL/service-role key. Set WEB_APP_URL (e.g. http://localhost:3000)
 * to also check the public records API.
 *
 * Exit code 0 = all checks passed, 1 = at least one failure.
 */
import fs from "node:fs";
import path from "node:path";

const TABLE_BY_TYPE = {
  Allocation: "allocations",
  Expense: "expenses",
  Award: "awards",
};

const root = path.resolve(import.meta.dirname, "..");
const evidencePath = path.resolve(
  process.argv[2] || path.join(root, "..", "blockchain", "e2e-evidence.json"),
);

if (!fs.existsSync(evidencePath)) {
  console.error(`Evidence file not found: ${evidencePath}`);
  console.error("Run blockchain/scripts/run-e2e-journey.ts first.");
  process.exit(1);
}

const env = {};
for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!match) continue;
  let value = match[2].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  env[match[1]] = value;
}

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("web-app/.env is missing the Supabase URL or service-role key.");
  process.exit(1);
}

const evidence = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
const failures = [];
const fail = (message) => {
  failures.push(message);
  console.error(`FAIL  ${message}`);
};
const pass = (message) => console.log(`ok    ${message}`);

async function supabase(pathname) {
  const response = await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${pathname}`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`${pathname} returned HTTP ${response.status}`);
  }

  return response.json();
}

const recordIds = [];
for (const record of evidence.records ?? []) {
  recordIds.push(record.id);
  const table = TABLE_BY_TYPE[record.type];
  if (!table) {
    fail(`Unknown record type ${record.type}`);
    continue;
  }

  const rows = await supabase(
    `${table}?select=id,blockchain_tx_hash,barangay,amount&blockchain_tx_hash=eq.${record.hash}`,
  );

  if (!Array.isArray(rows) || rows.length !== 1) {
    fail(`${record.type}#${record.id} (${record.hash}) is not synced in ${table}`);
    continue;
  }

  const row = rows[0];
  const before = failures.length;
  if (row.barangay !== evidence.barangay) {
    fail(
      `${record.type}#${record.id} barangay is "${row.barangay}", expected "${evidence.barangay}"`,
    );
  }
  if (Number(row.amount) !== record.amount) {
    fail(
      `${record.type}#${record.id} amount is ${row.amount}, expected ${record.amount} centavos`,
    );
  }
  if (row.blockchain_tx_hash?.toLowerCase() !== record.hash.toLowerCase()) {
    fail(`${record.type}#${record.id} hash mismatch`);
  }
  if (failures.length === before) {
    pass(`${record.type}#${record.id} synced with the expected hash, barangay, and amount`);
  }
}

if (recordIds.length > 0) {
  const gaps = await supabase(
    `ledger_sync_gaps?select=blockchain_record_id&blockchain_record_id=in.(${recordIds.join(",")})`,
  );

  if (!Array.isArray(gaps) || gaps.length > 0) {
    fail(`ledger_sync_gaps still lists ${gaps?.length ?? "unknown"} journey record(s)`);
  } else {
    pass("no ledger sync gaps for the journey records");
  }
}

const baseUrl = env.WEB_APP_URL || process.env.WEB_APP_URL;
if (baseUrl) {
  const url = new URL("/api/records", baseUrl);
  url.searchParams.set("scope", "public");
  url.searchParams.set("barangay", evidence.barangay);
  url.searchParams.set("limit", "500");

  try {
    const response = await fetch(url);
    const payload = await response.json();
    if (!response.ok || !Array.isArray(payload.data)) {
      fail(`public records API returned HTTP ${response.status}`);
    } else {
      for (const record of evidence.records ?? []) {
        const found = payload.data.some(
          (row) =>
            row.record_type === record.type.toLowerCase() &&
            Number(row.amount) === record.amount,
        );
        if (found) {
          pass(`public API exposes ${record.type}#${record.id}`);
        } else {
          fail(`public API does not expose ${record.type}#${record.id}`);
        }
      }
    }
  } catch (error) {
    fail(`public records API request failed: ${error.message}`);
  }
} else {
  console.log("skip  public API check (set WEB_APP_URL to enable it)");
}

console.log(
  `\n${(evidence.records ?? []).length} record(s) checked against ${evidencePath}`,
);
if (failures.length > 0) {
  console.error(`${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log("Journey verification passed.");
