# Blockchain

## Sepolia setup

Add these values to `blockchain/.env` before running setup:

```env
SEPOLIA_RPC_URL=
DEPLOYER_PRIVATE_KEY=
NEXT_PUBLIC_CONTRACT_ADDRESS=
```

`SEPOLIA_PRIVATE_KEY` can be used instead of `DEPLOYER_PRIVATE_KEY`. The signer
must be the deployed contract owner. To configure one or more items, set:

```env
TARGET_OFFICIAL_ADDRESS=
TARGET_OFFICIAL_ADDRESSES=
OFFICIAL_AUTHORIZATION_STATUS=true
TARGET_OFFICIAL_BARANGAY_ADDRESS=
TARGET_OFFICIAL_BARANGAY_NAME=
OFFICIAL_BARANGAY_AUTHORIZATION_STATUS=true
TARGET_APPROVER_ADDRESS=
APPROVER_AUTHORIZATION_STATUS=true
BARANGAY_NAME=
ALLOCATION_CEILING_CENTAVOS=
```

Leave out any item you do not want to change. Authorization statuses accept
`true`/`false` (or `1`/`0`); allocation ceilings are positive whole centavo
amounts. The script validates the Sepolia network, owner, and resulting state
before reporting success. Set both `TARGET_OFFICIAL_BARANGAY_ADDRESS` and
`TARGET_OFFICIAL_BARANGAY_NAME` to assign or revoke one official's access to a
registered barangay; its status is independent of the global authorization
setting. Barangay names are resolved through the canonical registry, so
registered aliases refer to the same barangay.

To authorize several officials for the same barangay, use comma-separated
Ethereum addresses:

```env
TARGET_OFFICIAL_ADDRESSES=0xCHAIRPERSON,0xTREASURER
TARGET_OFFICIAL_BARANGAY_ADDRESS=0xCHAIRPERSON,0xTREASURER
TARGET_OFFICIAL_BARANGAY_NAME=Adia, Agoncillo
OFFICIAL_AUTHORIZATION_STATUS=true
OFFICIAL_BARANGAY_AUTHORIZATION_STATUS=true
```

The setup script authorizes every address globally and grants it access to the
specified barangay. `TARGET_OFFICIAL_ADDRESS` remains supported for one-address
configuration. If both variables are set, duplicate addresses are processed once.

Run `npm run setup-sepolia` from this directory. The script will not deploy a
contract; `NEXT_PUBLIC_CONTRACT_ADDRESS` must point to an existing SkLedge
contract deployed on Sepolia.

Run `npm test` from this directory to execute the contract tests.

## Automated Sepolia journey

`npm run e2e:sepolia` runs an automated end-to-end contract journey against the
deployed contract: wallet authorization, ceiling, `Allocation`, `Expense`,
`Award`, COA confirmation, unauthorized/over-ceiling/double-confirm reverts, and
an evidence file. It needs `E2E_BARANGAY` and the owner credentials above, and it
writes real testnet records. See `docs/SEPOLIA-RUNBOOK.md` for the full flow and
the companion `web-app` verifier (`npm run verify:journey`).

Barangay names and aliases are limited to 64 UTF-8 bytes, and record purposes
are limited to 256 UTF-8 bytes. Both values must be non-empty. The contract
reports over-limit inputs with custom errors; these limits count encoded bytes,
not displayed characters.

## Receipt fingerprint rollout

The contract now exposes `attachDocumentHash(recordId, bytes32)` and
`getDocumentHashes(recordId)` for append-only SHA-256 receipt fingerprints on
expense records. The app only calls this after a receipt upload when
`NEXT_PUBLIC_ONCHAIN_RECEIPT_HASH_ENABLED=true`; leave it unset against any
deployment that predates the function. After deploying the updated contract,
point `NEXT_PUBLIC_CONTRACT_ADDRESS` at the new address, enable the flag, and
redeploy/restart the web app.

## Canonical barangay registry

The canonical identity is `<barangay>, <municipality>`, sourced from
`web-app/lib/batangasBarangays.ts`. A bare barangay name is accepted only when
it is unique across the province; case and an optional `Barangay ` prefix are
normalized. The contract stores canonical identities and keys ceilings,
allocation totals, and locks by the registered identity.

The current deployed contract cannot be upgraded in place. Deploy the updated
contract to a new address, configure `NEXT_PUBLIC_CONTRACT_ADDRESS` and the
Sepolia owner credentials in `blockchain/.env`, then run:

```powershell
npm run register-barangays
```

Run this before enabling financial writes against the new contract. It
registers the official list in owner-signed batches and verifies the registered
count. RPC read checks are rate-limited and retry transient 429 responses; if
the provider still rejects requests, rerun the script later. Registration is
safe to resume because already-registered identities are checked before writes.
Existing on-chain records, ceilings, totals, and approvals remain
unchanged on the old contract; keep it available for historical reads and
configure new-contract ceilings before rollout. Supabase text fields need no
schema migration. New app writes use canonical identities. Before cutover,
review legacy `profiles.barangay`, project, and financial-record values:
unambiguous aliases can be resolved, but ambiguous values must be manually
matched to their municipality. Update affected profiles to canonical identities
before enabling new writes; the app blocks unresolved profiles. Do not bulk
rewrite or merge ambiguous historical rows. Existing database records are left
unchanged, and old-contract data remains available for historical reads.

Record submission requires both global official authorization and an explicit
assignment to that record's registered barangay. Global revocation blocks all
record writes but does not remove barangay assignments; reauthorization restores
the assignments that remain in place. No wallet, including the owner, receives
barangay access implicitly.

## Authorizing wallets on the live contract

All operational scripts read the target contract from
`NEXT_PUBLIC_CONTRACT_ADDRESS` and refuse to run unless `SEPOLIA_PRIVATE_KEY`
(or `DEPLOYER_PRIVATE_KEY`) belongs to the contract owner:

```bash
# SK official wallet (global record-write authorization)
TARGET_OFFICIAL_ADDRESS=0x... npm run authorize-official

# COA auditor wallet (confirmRecord permission)
TARGET_APPROVER_ADDRESS=0x... npm run authorize-approver

# Global official + barangay assignment + approver + ceiling in one pass
npm run setup-sepolia
```

Set `AUTHORIZATION_STATUS=false` (or `APPROVER_AUTHORIZATION_STATUS=false`)
to revoke. Barangay-scoped access is granted with
`TARGET_OFFICIAL_BARANGAY_ADDRESS` / `TARGET_OFFICIAL_BARANGAY_NAME` through
`npm run setup-sepolia`; global authorization alone does not grant barangay
access.

Records are final only after the COA wallet calls `confirmRecord(id)`. There is
no multi-signature threshold in the current contract.

## Deployment evidence

`npm run deployment-evidence` writes `deployment-evidence.json` into the
Ignition folder that recorded the deployed address. It captures the deployment
transaction/block, owner, compiler settings, ABI and bytecode fingerprints,
Etherscan verification status, and live contract counts. It is read-only and
needs no private key.

## Export the frontend ABI

Run `npm run export-abi` to compile the contract and update
`web-app/lib/contractAbi.generated.ts`.
