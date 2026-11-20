import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import hre from "hardhat";
import { ethers } from "ethers";

/**
 * Automated Sepolia journey: grants, ceiling, allocation, expense, award,
 * COA confirmation, negative checks, and an evidence file.
 *
 * This writes REAL testnet records. Required env:
 *   SEPOLIA_RPC_URL
 *   DEPLOYER_PRIVATE_KEY (contract owner, funded)
 *   NEXT_PUBLIC_CONTRACT_ADDRESS
 *   E2E_BARANGAY (a registered canonical barangay)
 *
 * Optional env:
 *   E2E_CEILING_CENTAVOS          default 100000000 (₱1,000,000)
 *   E2E_ALLOCATION_CENTAVOS       default 10000000  (₱100,000)
 *   E2E_EXPENSE_CENTAVOS          default 2500000   (₱25,000)
 *   E2E_AWARD_CENTAVOS            default 2000000   (₱20,000)
 *   E2E_OFFICIAL_PRIVATE_KEY      reuse a funded test official
 *   E2E_APPROVER_PRIVATE_KEY      reuse a funded test approver
 *   E2E_EVIDENCE_PATH             default blockchain/e2e-evidence.json
 *   E2E_REVOKE_AFTER=true         revoke the grants when finished
 */

const SEPOLIA_CHAIN_ID = 11155111n;
const FUNDING_WEI = ethers.parseEther("0.01");
const MIN_BALANCE_WEI = ethers.parseEther("0.002");

type JourneyRecord = {
  type: "Allocation" | "Expense" | "Award";
  id: number;
  hash: string;
  amount: number;
};

const evidence: {
  startedAt: string;
  contract: string;
  chainId: number;
  barangay: string;
  ceilingCentavos: string;
  officialAddress: string;
  approverAddress: string;
  generatedWallets: boolean;
  transactions: { step: string; hash: string; block: number }[];
  negativeChecks: { check: string; expected: string }[];
  records: JourneyRecord[];
  allocatedBefore: string;
  allocatedAfter: string;
  finishedAt?: string;
} = {
  startedAt: new Date().toISOString(),
  contract: "",
  chainId: 0,
  barangay: "",
  ceilingCentavos: "",
  officialAddress: "",
  approverAddress: "",
  generatedWallets: false,
  transactions: [],
  negativeChecks: [],
  records: [],
  allocatedBefore: "0",
  allocatedAfter: "0",
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be set in the environment.`);
  }
  return value;
}

function optionalBigInt(name: string, fallback: string): bigint {
  const value = process.env[name]?.trim();
  return BigInt(value || fallback);
}

function errorText(error: unknown): string {
  const parts: string[] = [];
  const pending: unknown[] = [error];
  const visited = new Set<object>();

  while (pending.length > 0) {
    const current = pending.pop();
    if (typeof current === "string") {
      parts.push(current);
      continue;
    }
    if (typeof current !== "object" || current === null || visited.has(current)) {
      continue;
    }

    visited.add(current);
    const record = current as Record<string, unknown>;
    for (const key of ["shortMessage", "message", "reason"]) {
      if (typeof record[key] === "string") parts.push(record[key] as string);
    }
    pending.push(record.info, record.error, record.cause, record.data);
  }

  return parts.join(" | ");
}

async function main(): Promise<void> {
  const rpcUrl = requiredEnv("SEPOLIA_RPC_URL");
  const privateKey =
    process.env.DEPLOYER_PRIVATE_KEY?.trim() ||
    requiredEnv("SEPOLIA_PRIVATE_KEY");
  const contractAddress = requiredEnv("NEXT_PUBLIC_CONTRACT_ADDRESS");
  const barangay = requiredEnv("E2E_BARANGAY");
  const ceiling = optionalBigInt("E2E_CEILING_CENTAVOS", "100000000");
  const allocationAmount = optionalBigInt(
    "E2E_ALLOCATION_CENTAVOS",
    "10000000",
  );
  const expenseAmount = optionalBigInt("E2E_EXPENSE_CENTAVOS", "2500000");
  const awardAmount = optionalBigInt("E2E_AWARD_CENTAVOS", "2000000");
  const revokeAfter = process.env.E2E_REVOKE_AFTER?.trim().toLowerCase() === "true";

  if (ceiling <= BigInt(0)) {
    throw new Error("E2E_CEILING_CENTAVOS must be greater than zero.");
  }
  if (allocationAmount <= BigInt(0) || expenseAmount <= BigInt(0)) {
    throw new Error("Record amounts must be greater than zero.");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error(
      `Expected Sepolia (chain ID ${SEPOLIA_CHAIN_ID}), received ${network.chainId}.`,
    );
  }

  const artifact = await hre.artifacts.readArtifact("SkLedge");
  const owner = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, artifact.abi, owner);

  const ownerAddress: string = await contract.owner();
  if (ownerAddress.toLowerCase() !== owner.address.toLowerCase()) {
    throw new Error(
      `Deployer ${owner.address} is not the contract owner (${ownerAddress}).`,
    );
  }

  if (!(await contract.isCanonicalBarangay(barangay))) {
    throw new Error(
      `"${barangay}" is not a registered canonical barangay on ${contractAddress}.`,
    );
  }

  evidence.contract = contractAddress;
  evidence.chainId = Number(network.chainId);
  evidence.barangay = barangay;
  evidence.ceilingCentavos = ceiling.toString();

  console.log(`Contract: ${contractAddress}`);
  console.log(`Barangay: ${barangay}`);
  console.log(`Owner:    ${owner.address}`);

  const ownerBalance = await provider.getBalance(owner.address);
  if (ownerBalance < FUNDING_WEI * BigInt(3)) {
    throw new Error(
      `Owner balance ${ethers.formatEther(ownerBalance)} ETH is too low; fund it with Sepolia ETH first.`,
    );
  }

  const generatedWallets: { wallet: ethers.Wallet; label: string }[] = [];

  function parsePrivateKey(envName: string): string {
    const raw = process.env[envName]?.trim();
    if (!raw) throw new Error(`${envName} was empty.`);

    const normalized = raw.startsWith("0x") ? raw : `0x${raw}`;
    if (/^0x[0-9a-fA-F]{64}$/.test(normalized)) return normalized;
    if (/^0x[0-9a-fA-F]{40}$/.test(normalized)) {
      throw new Error(
        `${envName} is a wallet address, not a private key. ` +
          "Use the 64-hex-character private key for that address (without it the script cannot sign).",
      );
    }
    throw new Error(
      `${envName} must be a 32-byte private key: 64 hex characters, optionally prefixed with 0x.`,
    );
  }

  async function resolveWallet(
    envName: string,
    label: string,
  ): Promise<ethers.Wallet> {
    const provided = process.env[envName]?.trim();
    const wallet = provided
      ? new ethers.Wallet(parsePrivateKey(envName), provider)
      : ethers.Wallet.createRandom().connect(provider);

    evidence.generatedWallets = evidence.generatedWallets || !provided;
    if (!provided) {
      generatedWallets.push({ wallet: wallet as ethers.Wallet, label });
    }
    console.log(`${label}: ${wallet.address}${provided ? "" : " (generated)"}`);

    const balance = await provider.getBalance(wallet.address);
    if (balance < MIN_BALANCE_WEI) {
      const funding = await owner.sendTransaction({
        to: wallet.address,
        value: FUNDING_WEI,
      });
      const receipt = await funding.wait();
      if (!receipt || receipt.status !== 1) {
        throw new Error(`Funding ${label} failed.`);
      }
      evidence.transactions.push({
        step: `fund ${label}`,
        hash: funding.hash,
        block: receipt.blockNumber,
      });
      console.log(`  funded with ${ethers.formatEther(FUNDING_WEI)} ETH`);
    }

    return wallet as ethers.Wallet;
  }

  async function send(
    step: string,
    transaction: Promise<ethers.TransactionResponse>,
  ): Promise<ethers.TransactionReceipt> {
    const response = await transaction;
    console.log(`${step}: ${response.hash}`);
    const receipt = await response.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error(`${step} failed or was not confirmed.`);
    }
    evidence.transactions.push({
      step,
      hash: response.hash,
      block: receipt.blockNumber,
    });
    console.log(`  block ${receipt.blockNumber}`);
    return receipt;
  }

  function parseRecordId(
    receipt: ethers.TransactionReceipt,
  ): number | null {
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed?.name === "RecordAdded") {
          return Number(parsed.args.id);
        }
      } catch {
        // Not one of this contract's events.
      }
    }
    return null;
  }

  async function expectRevert(
    check: string,
    expected: string,
    action: () => Promise<unknown>,
  ): Promise<void> {
    try {
      await action();
    } catch (error) {
      const message = errorText(error);
      if (!message.toLowerCase().includes(expected.toLowerCase())) {
        throw new Error(
          `${check} reverted, but not with the expected reason.\nExpected: ${expected}\nActual: ${message}`,
        );
      }
      evidence.negativeChecks.push({ check, expected });
      console.log(`✓ ${check} (reverted as expected)`);
      return;
    }

    throw new Error(`${check} did not revert; expected "${expected}".`);
  }

  const official = await resolveWallet(
    "E2E_OFFICIAL_PRIVATE_KEY",
    "Official wallet",
  );
  const approver = await resolveWallet(
    "E2E_APPROVER_PRIVATE_KEY",
    "COA approver wallet",
  );
  evidence.officialAddress = official.address;
  evidence.approverAddress = approver.address;

  const officialContract = contract.connect(official) as ethers.Contract;
  const approverContract = contract.connect(approver) as ethers.Contract;

  const allocatedBefore: bigint = await contract.getAllocated(barangay);
  evidence.allocatedBefore = allocatedBefore.toString();

  // An approver wallet is not an SK official, so record writes must fail.
  await expectRevert(
    "unauthorized wallet cannot add a record",
    "not an authorized SK Official",
    () =>
      approverContract.addRecord.staticCall(
        barangay,
        expenseAmount,
        "SK-Ledge E2E unauthorized check",
        "Expense",
      ),
  );

  await send(
    "authorize official (global)",
    contract.setOfficialAuthorization(official.address, true),
  );
  await send(
    "authorize official for barangay",
    contract.setOfficialBarangayAuthorization(official.address, barangay, true),
  );
  await send(
    "authorize COA approver",
    contract.setApproverAuthorization(approver.address, true),
  );

  if (!(await contract.isAuthorizedOfficial(official.address))) {
    throw new Error("isAuthorizedOfficial did not return true.");
  }
  if (!(await contract.isOfficialAuthorizedForBarangay(official.address, barangay))) {
    throw new Error("isOfficialAuthorizedForBarangay did not return true.");
  }
  if (!(await contract.isApprover(approver.address))) {
    throw new Error("isApprover did not return true.");
  }

  await send(
    "set allocation ceiling",
    officialContract.setAllocationCeiling(barangay, ceiling),
  );
  const storedCeiling: bigint = await contract.allocationCeilings(barangay);
  if (storedCeiling !== ceiling) {
    throw new Error(
      `Ceiling read back as ${storedCeiling}; expected ${ceiling}.`,
    );
  }

  const headroom = ceiling - allocatedBefore;
  if (headroom <= BigInt(0)) {
    throw new Error(
      `No headroom: ${barangay} already has ${allocatedBefore} centavos allocated against a ${ceiling} centavo ceiling. Raise E2E_CEILING_CENTAVOS or use another barangay.`,
    );
  }
  if (allocationAmount > headroom) {
    throw new Error(
      `E2E_ALLOCATION_CENTAVOS (${allocationAmount}) exceeds remaining headroom (${headroom}).`,
    );
  }

  await expectRevert(
    "allocation above remaining ceiling is rejected",
    "Allocation exceeds ceiling",
    () =>
      officialContract.addRecord.staticCall(
        barangay,
        headroom + BigInt(1),
        "SK-Ledge E2E over-ceiling check",
        "Allocation",
      ),
  );

  const allocationReceipt = await send(
    "add Allocation",
    officialContract.addRecord(
      barangay,
      allocationAmount,
      "SK-Ledge E2E allocation",
      "Allocation",
    ),
  );
  const allocationId = parseRecordId(allocationReceipt);
  if (allocationId === null) throw new Error("Allocation record id not found.");

  const allocatedAfter: bigint = await contract.getAllocated(barangay);
  if (allocatedAfter !== allocatedBefore + allocationAmount) {
    throw new Error(
      `getAllocated is ${allocatedAfter}; expected ${allocatedBefore + allocationAmount}.`,
    );
  }
  evidence.allocatedAfter = allocatedAfter.toString();

  const expenseReceipt = await send(
    "add Expense",
    officialContract.addRecord(
      barangay,
      expenseAmount,
      "SK-Ledge E2E expense",
      "Expense",
    ),
  );
  const expenseId = parseRecordId(expenseReceipt);
  if (expenseId === null) throw new Error("Expense record id not found.");

  const awardReceipt = await send(
    "add Award",
    officialContract.addRecord(
      barangay,
      awardAmount,
      "SK-Ledge E2E award",
      "Award",
    ),
  );
  const awardId = parseRecordId(awardReceipt);
  if (awardId === null) throw new Error("Award record id not found.");

  evidence.records = [
    {
      type: "Allocation",
      id: allocationId,
      hash: allocationReceipt.hash,
      amount: Number(allocationAmount),
    },
    {
      type: "Expense",
      id: expenseId,
      hash: expenseReceipt.hash,
      amount: Number(expenseAmount),
    },
    {
      type: "Award",
      id: awardId,
      hash: awardReceipt.hash,
      amount: Number(awardAmount),
    },
  ];

  await send("confirm Expense (COA)", approverContract.confirmRecord(expenseId));
  await send("confirm Award (COA)", approverContract.confirmRecord(awardId));

  const records = await contract.getAllRecords();
  for (const record of records) {
    if (evidence.records.some((entry) => Number(record.id) === entry.id)) {
      if (!record.approved && Number(record.id) !== allocationId) {
        throw new Error(`Record ${record.id} was not confirmed.`);
      }
    }
  }

  await expectRevert(
    "double confirmation is rejected",
    "already confirmed",
    () => approverContract.confirmRecord.staticCall(expenseId),
  );

  if (revokeAfter) {
    await send(
      "revoke official for barangay",
      contract.setOfficialBarangayAuthorization(official.address, barangay, false),
    );
    await send(
      "revoke official (global)",
      contract.setOfficialAuthorization(official.address, false),
    );
    await send(
      "revoke COA approver",
      contract.setApproverAuthorization(approver.address, false),
    );
  }

  // Return unused testnet ETH from generated wallets; their keys are discarded.
  for (const { wallet, label } of generatedWallets) {
    try {
      const balance = await provider.getBalance(wallet.address);
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice;
      if (!gasPrice) continue;

      const reserve = gasPrice * BigInt(21000);
      if (balance <= reserve) continue;

      const refund = await wallet.sendTransaction({
        to: owner.address,
        value: balance - reserve,
        gasLimit: BigInt(21000),
        ...(feeData.maxFeePerGas
          ? {
              maxFeePerGas: feeData.maxFeePerGas,
              maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
            }
          : { gasPrice: feeData.gasPrice ?? undefined }),
      });
      const receipt = await refund.wait();
      if (receipt?.status === 1) {
        evidence.transactions.push({
          step: `refund ${label}`,
          hash: refund.hash,
          block: receipt.blockNumber,
        });
        console.log(`Refunded remaining ETH from ${label} to owner.`);
      }
    } catch (error) {
      console.warn(
        `Could not refund ${label}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  evidence.finishedAt = new Date().toISOString();
  const evidencePath = path.resolve(
    process.env.E2E_EVIDENCE_PATH?.trim() || "e2e-evidence.json",
  );
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);

  console.log("\nE2E journey passed.");
  console.log(`Evidence: ${evidencePath}`);
  console.log(`Records: ${evidence.records.map((r) => `${r.type}#${r.id}`).join(", ")}`);
  console.log(
    "Next: open the web app, click Sync ledger (COA/Admin), then run `npm run verify:journey` in web-app.",
  );
}

main().catch((error: unknown) => {
  console.error("\nE2E journey failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
