import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the row-level-security invariants that the 2026-11-24 review found
 * broken. There is no database in CI, so these tests replay the migrations in
 * filename order and assert the *final* state:
 *
 *   - ledger tables cannot be written by a browser session (only the
 *     service-role sync API may insert, after verifying the transaction),
 *   - is_official() requires an approved profile, so a pending self-registered
 *     account cannot approve itself,
 *   - anon reads of ledger tables are limited to the portal's columns,
 *   - the hardening migration does not target a table dropped earlier (the first
 *     version referenced public.opportunities, which 20261120100000 had already
 *     dropped, so Postgres aborted the whole script).
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const LEDGER_TABLES = ["expenses", "allocations"] as const;
const HARDENING_MIGRATION =
  "20261124150000_harden_official_authorization_and_ledger_writes.sql";

type Policy = { table: string; name: string; definition: string };

function readMigrations(): { file: string; sql: string }[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => ({
      file,
      sql: readFileSync(join(MIGRATIONS_DIR, file), "utf8"),
    }));
}

const TABLE_RE =
  /(create|drop)\s+table\s+(?:if\s+(?:not\s+)?exists\s+)?(?:"?(\w+)"?)\.(?:"?(\w+)"?)/gi;

const POLICY_RE =
  /(create|drop)\s+policy\s+(?:if\s+exists\s+)?("?[^"\s]+"?)\s+on\s+(?:"?(\w+)"?)\.(?:"?(\w+)"?)"?([\s\S]*?);/gi;

/** Replay CREATE/DROP TABLE and CREATE/DROP POLICY in filename order. */
function replay() {
  const policies = new Map<string, Policy>();
  const liveTables = new Set<string>();

  for (const { sql } of readMigrations()) {
    for (const match of sql.matchAll(TABLE_RE)) {
      const key = `${match[2]}.${match[3]}`;

      if (match[1].toLowerCase() === "create") {
        liveTables.add(key);
        continue;
      }

      liveTables.delete(key);
      // Dropping a table drops its policies with it.
      for (const [policyKey, policy] of policies) {
        if (policy.table === key) policies.delete(policyKey);
      }
    }

    for (const match of sql.matchAll(POLICY_RE)) {
      const table = `${match[3]}.${match[4]}`;
      const name = match[2].replaceAll('"', "");
      const key = `${table}.${name}`;

      if (match[1].toLowerCase() === "drop") {
        policies.delete(key);
        continue;
      }

      policies.set(key, { table, name, definition: match[5] });
    }
  }

  return { policies, liveTables };
}

/** A policy that can write: FOR ALL, or explicit INSERT/UPDATE/DELETE. */
function isWritePolicy(policy: Policy): boolean {
  const command = policy.definition.match(
    /\bfor\s+(all|insert|update|delete|select)\b/i
  );
  // No FOR clause means FOR ALL.
  return command ? command[1].toLowerCase() !== "select" : true;
}

const { policies, liveTables } = replay();
const publicPolicies = [...policies.values()].filter((policy) =>
  policy.table.startsWith("public.")
);

describe("replay sanity", () => {
  it("reads the migrations and keeps the ledger tables", () => {
    expect(publicPolicies.length).toBeGreaterThan(0);
    for (const table of LEDGER_TABLES) {
      expect(liveTables.has(`public.${table}`)).toBe(true);
    }
  });
});

describe("ledger table insert policies", () => {
  it.each(LEDGER_TABLES)(
    "does not let a signed-in browser session write %s",
    (table) => {
      const writes = publicPolicies.filter(
        (policy) => policy.table === `public.${table}` && isWritePolicy(policy)
      );

      expect(writes.map((policy) => policy.name)).toEqual([]);
    }
  );
});

describe("dropped tables", () => {
  it("has removed opportunities, along with its write policies", () => {
    expect(liveTables.has("public.opportunities")).toBe(false);
    expect(
      publicPolicies.filter((policy) => policy.table === "public.opportunities")
    ).toEqual([]);
  });

  it("is not referenced by the hardening migration", () => {
    const hardening = readMigrations().find(
      ({ file }) => file === HARDENING_MIGRATION
    );

    expect(hardening).toBeDefined();
    // Policy drops and grants name their table after ON.
    const targets = [
      ...hardening!.sql.matchAll(
        /(?:drop\s+policy[^;]*?\bon|(?:revoke|grant)\b[^;]*?\bon)\s+"?(\w+)"?\."?(\w+)"?/gi
      ),
    ].map((match) => `${match[1]}.${match[2]}`);

    // Proves the extraction below is reading the statements it claims to.
    expect(targets).toEqual(
      expect.arrayContaining(LEDGER_TABLES.map((table) => `public.${table}`))
    );

    for (const target of targets) {
      expect(liveTables.has(target)).toBe(true);
    }
  });
});

describe("is_official", () => {
  const definitions = readMigrations()
    .flatMap(({ sql }) => [
      ...sql.matchAll(
        /create\s+or\s+replace\s+function\s+"?public"?\."?is_official"?\s*\([\s\S]*?\$\$;/gi
      ),
    ])
    .map((match) => match[0]);

  it("is defined at least once", () => {
    expect(definitions.length).toBeGreaterThan(0);
  });

  it("requires an approved profile, not just a matching role", () => {
    const latest = definitions[definitions.length - 1];

    expect(latest).toMatch(/approval_status/i);
    expect(latest).toMatch(/approved/i);
  });
});

describe("public column exposure", () => {
  const allSql = readMigrations()
    .map(({ sql }) => sql)
    .join("\n");

  it.each(LEDGER_TABLES)("revokes the anon table-wide select on %s", (table) => {
    expect(allSql).toMatch(
      new RegExp(`revoke\\s+select\\s+on\\s+public\\.${table}\\s+from\\s+anon`, "i")
    );
  });

  it("grants anon only the columns the public portal renders", () => {
    expect(allSql).toMatch(
      /grant\s+select\s*\(amount,\s*created_at,\s*barangay,\s*voided\)\s*on\s+public\.expenses\s+to\s+anon/i
    );
    // allocations.voided was dropped in 20261120100000_drop_dead_schema.sql.
    expect(allSql).toMatch(
      /grant\s+select\s*\(amount,\s*created_at,\s*barangay\)\s*on\s+public\.allocations\s+to\s+anon/i
    );
  });
});
