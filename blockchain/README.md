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
OFFICIAL_AUTHORIZATION_STATUS=true
TARGET_APPROVER_ADDRESS=
APPROVER_AUTHORIZATION_STATUS=true
BARANGAY_NAME=
ALLOCATION_CEILING_CENTAVOS=
```

Leave out any item you do not want to change. Authorization statuses accept
`true`/`false` (or `1`/`0`); allocation ceilings are positive whole centavo
amounts. The script validates the Sepolia network, owner, and resulting state
before reporting success.

Run `npm run setup-sepolia` from this directory. The script will not deploy a
contract; `NEXT_PUBLIC_CONTRACT_ADDRESS` must point to an existing SkLedge
contract deployed on Sepolia.

Run `npm test` from this directory to execute the contract tests.

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

Contract wallet authorization remains global, as it is today; canonical
registration prevents name aliases from splitting accounting keys but does not
bind an authorized wallet to one barangay. Adding that binding requires an
explicit wallet-to-jurisdiction administration workflow.

## Export the frontend ABI

Run `npm run export-abi` to compile the contract and update
`web-app/lib/contractAbi.generated.ts`.
