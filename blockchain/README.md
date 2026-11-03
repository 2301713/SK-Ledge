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

## Export the frontend ABI

Run `npm run export-abi` to compile the contract and update
`web-app/lib/contractAbi.generated.ts`.
