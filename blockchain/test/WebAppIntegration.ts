import { expect } from "chai";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import hre, { network } from "hardhat";

// The website ships a generated copy of the contract ABI. Loading it the same
// way the app does (from web-app/lib) lets these tests fail when the two
// projects drift apart instead of letting the UI break at runtime.
const require = createRequire(import.meta.url);
const { SK_LEDGE_ABI } = require("../../web-app/lib/contractAbi.generated.ts") as typeof import("../../web-app/lib/contractAbi.generated.ts");
const { canonicalizeBarangay } = require("../../web-app/lib/batangasBarangays.ts") as typeof import("../../web-app/lib/batangasBarangays.ts");
const { sumBarangayCentavos } = require("../../web-app/lib/spending.ts") as typeof import("../../web-app/lib/spending.ts");

function signature(entry: {
  type: string;
  name?: string;
  inputs?: { type: string }[];
}): string {
  return `${entry.type}:${entry.name ?? ""}(${(entry.inputs ?? [])
    .map((input) => input.type)
    .join(",")})`;
}

describe("Web app ↔ SkLedge integration", function () {
  async function deployFixture() {
    const { ethers } = await (network as any).create();
    const [owner, official, approver, outsider] = await ethers.getSigners();

    const factory = await ethers.getContractFactory("SkLedge");
    const contract = await factory.deploy();

    await contract
      .connect(owner)
      .registerCanonicalBarangays(["Adia, Agoncillo"], ["Adia"]);

    return { ethers, contract, owner, official, approver, outsider };
  }

  it("keeps the generated web ABI identical to the compiled contract ABI", async function () {
    const artifact = await hre.artifacts.readArtifact("SkLedge");
    const compiled = new Map(
      (artifact.abi as Array<{
        type: string;
        name?: string;
        inputs?: { type: string }[];
      }>).map((entry) => [signature(entry), entry]),
    );
    const shipped = new Map(
      (SK_LEDGE_ABI as unknown as Array<{
        type: string;
        name?: string;
        inputs?: { type: string }[];
      }>).map((entry) => [signature(entry), entry]),
    );

    expect([...compiled.keys()].sort()).to.deep.equal(
      [...shipped.keys()].sort(),
      "web-app/lib/contractAbi.generated.ts is stale; run `npm run export-abi` in blockchain",
    );
  });

  it("exposes the functions and events the website relies on", function () {
    const abi = SK_LEDGE_ABI as unknown as Array<{
      type: string;
      name?: string;
    }>;
    const functions = new Set(
      abi.filter((entry) => entry.type === "function").map((entry) => entry.name),
    );
    const events = new Set(
      abi.filter((entry) => entry.type === "event").map((entry) => entry.name),
    );

    for (const name of [
      "addRecord",
      "attachDocumentHash",
      "confirmRecord",
      "voidRecord",
      "setAllocationCeiling",
      "setOfficialAuthorization",
      "setOfficialBarangayAuthorization",
      "setApproverAuthorization",
      "getAllRecords",
      "canonicalizeBarangay",
      "isCanonicalBarangay",
    ]) {
      expect(functions.has(name), `missing function ${name}`).to.equal(true);
    }

    for (const name of ["RecordAdded", "RecordConfirmed", "RecordVoided", "DocumentHashAttached"]) {
      expect(events.has(name), `missing event ${name}`).to.equal(true);
    }
  });

  it("decodes a real record submission with the website's ABI", async function () {
    const { ethers, contract, owner, official } = await deployFixture();

    await contract.connect(owner).setOfficialAuthorization(official.address, true);
    await contract
      .connect(owner)
      .setOfficialBarangayAuthorization(official.address, "Adia", true);

    const amount = 2500000n;
    const purpose = "SK-Ledge integration expense";
    const transaction = await contract
      .connect(official)
      .addRecord("Barangay Adia", amount, purpose, "Expense");
    const receipt = await transaction.wait();
    if (!receipt) throw new Error("Record transaction was not confirmed.");

    // What /api/sync-record does before it trusts a submission.
    const iface = new ethers.Interface(SK_LEDGE_ABI);
    const decodedCall = iface.parseTransaction({
      data: transaction.data,
      value: 0n,
    });

    expect(decodedCall?.name).to.equal("addRecord");
    const [callBarangay, callAmount, callPurpose, callType] =
      decodedCall!.args;
    expect(canonicalizeBarangay(callBarangay)).to.equal("Adia, Agoncillo");
    expect(callAmount).to.equal(amount);
    expect(callPurpose).to.equal(purpose);
    expect(callType).to.equal("Expense");

    const recordEvents = receipt.logs
      .filter((log: { address: string }) => log.address === contract.target)
      .map((log: { topics: readonly string[]; data: string }) => {
        try {
          return iface.parseLog({ topics: [...log.topics], data: log.data });
        } catch {
          return null;
        }
      })
      .filter((event: { name: string } | null) => event?.name === "RecordAdded");

    expect(recordEvents).to.have.length(1);
    const event = recordEvents[0]!;
    expect(event.args.official).to.equal(official.address);
    expect(event.args.barangay).to.equal("Adia, Agoncillo");
    expect(event.args.amount).to.equal(amount);
    expect(event.args.recordType).to.equal("Expense");

    const records = await contract.getAllRecords();
    expect(Number(event.args.id)).to.equal(Number(records[0].id));
  });

  it("decodes the COA confirmation flow with the website's ABI", async function () {
    const { ethers, contract, owner, official, approver } =
      await deployFixture();

    await contract.connect(owner).setOfficialAuthorization(official.address, true);
    await contract
      .connect(owner)
      .setOfficialBarangayAuthorization(official.address, "Adia", true);
    await contract.connect(owner).setApproverAuthorization(approver.address, true);

    await contract
      .connect(official)
      .addRecord("Adia", 100000n, "Youth sports", "Expense");

    const confirmation = await contract.connect(approver).confirmRecord(1);
    const receipt = await confirmation.wait();
    if (!receipt) throw new Error("Confirmation was not mined.");

    const iface = new ethers.Interface(SK_LEDGE_ABI);
    const confirmed = receipt.logs
      .map((log: { topics: readonly string[]; data: string }) => {
        try {
          return iface.parseLog({ topics: [...log.topics], data: log.data });
        } catch {
          return null;
        }
      })
      .find((event: { name: string } | null) => event?.name === "RecordConfirmed");

    expect(confirmed, "RecordConfirmed should be decodable by the web ABI").to
      .exist;
    expect(confirmed!.args.id).to.equal(1n);
    expect(confirmed!.args.auditor).to.equal(approver.address);
  });

  it("matches the web app's SHA-256 receipt fingerprints on-chain", async function () {
    const { ethers, contract, owner, official } = await deployFixture();

    await contract.connect(owner).setOfficialAuthorization(official.address, true);
    await contract
      .connect(owner)
      .setOfficialBarangayAuthorization(official.address, "Adia", true);

    await contract
      .connect(official)
      .addRecord("Adia", 90000n, "Printing", "Expense");
    await contract
      .connect(official)
      .addRecord("Adia", 50000n, "Allocation seed", "Allocation");

    // What /api/documents returns as `sha256`, and what the expense page
    // prefixes with 0x before calling attachDocumentHash.
    const sha256 = createHash("sha256")
      .update(Buffer.from("receipt-bytes"))
      .digest("hex");
    const fingerprint = `0x${sha256}`;

    const attach = await contract
      .connect(official)
      .attachDocumentHash(1, fingerprint);
    const attachReceipt = await attach.wait();
    if (!attachReceipt) throw new Error("Fingerprint attach was not mined.");

    const storedHashes = (await contract.getDocumentHashes(1)) as string[];
    expect(storedHashes.map((hash) => hash.toLowerCase())).to.deep.equal([
      fingerprint,
    ]);

    const iface = new ethers.Interface(SK_LEDGE_ABI);
    const attached = attachReceipt.logs
      .map((log: { topics: readonly string[]; data: string }) => {
        try {
          return iface.parseLog({ topics: [...log.topics], data: log.data });
        } catch {
          return null;
        }
      })
      .find(
        (event: { name: string } | null) =>
          event?.name === "DocumentHashAttached",
      );

    expect(attached, "DocumentHashAttached should decode with the web ABI").to
      .exist;
    expect(attached!.args.id).to.equal(1n);
    expect(attached!.args.official).to.equal(official.address);
    expect((attached!.args.documentHash as string).toLowerCase()).to.equal(
      fingerprint,
    );

    // The contract rejects a repeated fingerprint and non-expense records,
    // so the UI must not offer those actions.
    await expect(
      contract.connect(official).attachDocumentHash(1, fingerprint),
    ).to.be.revertedWith("SkLedge: Document hash already attached");
    await expect(
      contract.connect(official).attachDocumentHash(2, ethers.id("receipt")),
    ).to.be.revertedWith("SkLedge: Only expense records accept receipt hashes");
  });

  it("keeps the website's spending totals equal to the contract ledger", async function () {
    const { contract, owner, official } = await deployFixture();

    await contract.connect(owner).setOfficialAuthorization(official.address, true);
    await contract
      .connect(owner)
      .setOfficialBarangayAuthorization(official.address, "Adia", true);

    await contract
      .connect(official)
      .addRecord("Adia", 500000n, "Youth programs", "Allocation");
    await contract
      .connect(official)
      .addRecord("Barangay ADIA", 250000n, "Sports league", "Allocation");
    await contract
      .connect(official)
      .addRecord("Adia, Agoncillo", 120000n, "Equipment", "Expense");
    await contract
      .connect(official)
      .addRecord("Adia", 40000n, "Venue", "Expense");

    // Voided records must be ignored by both the chain total and the web helper.
    await contract.connect(owner).voidRecord(3, "Duplicate receipt");

    const records = await contract.getAllRecords();
    const webEntries = records.map((record) => ({
      type: record.recordType as string,
      barangay: record.barangay as string,
      amount: record.amount as bigint,
      voided: record.voided as boolean,
    }));

    const allocationTotal = sumBarangayCentavos(
      webEntries,
      "allocation",
      "Adia, Agoncillo",
    );
    const expenseTotal = sumBarangayCentavos(webEntries, "expense", "Adia");

    expect(allocationTotal).to.equal(750000);
    expect(allocationTotal).to.equal(
      Number(await contract.getAllocated("Adia, Agoncillo")),
    );

    const chainExpenseTotal = records
      .filter(
        (record) =>
          !record.voided && (record.recordType as string) === "Expense",
      )
      .reduce((total, record) => total + Number(record.amount), 0);
    expect(expenseTotal).to.equal(chainExpenseTotal);
    expect(expenseTotal).to.equal(40000);
  });

  it("agrees with the website on canonical barangay identities", async function () {
    const { contract } = await deployFixture();

    for (const name of [
      "Adia",
      "  barangay ADIA ",
      "Adia, Agoncillo",
    ]) {
      const webIdentity = canonicalizeBarangay(name);
      expect(webIdentity).to.equal("Adia, Agoncillo");
      expect(await contract.canonicalizeBarangay(name)).to.equal(webIdentity);
    }

    // Shared names must stay ambiguous on both sides.
    expect(canonicalizeBarangay("San Jose")).to.equal(null);
    let contractRejected = false;
    try {
      await contract.canonicalizeBarangay("San Jose");
    } catch {
      contractRejected = true;
    }
    expect(contractRejected, "contract should reject an unknown barangay").to.equal(
      true,
    );
  });
});
