import { expect } from "chai";
import { network } from "hardhat";

declare global {
  namespace Chai {
    interface Assertion {
      revertedWith(reason: string | RegExp): Promise<void>;
      revertedWithCustomError(contract: unknown, errorName: string): Assertion;
      withArgs(...args: unknown[]): Promise<void>;
      emit(contract: unknown, eventName: string): Assertion;
    }
  }
}

describe("SkLedge Contract Test Suite", function () {
  async function deploySkLedgeFixture() {
    const { ethers } = await (network as any).create();
    const [owner, official1, official2, nonOfficial, newOwner, otherAccount] =
      await ethers.getSigners();

    const SkLedgeFactory = await ethers.getContractFactory("SkLedge");
    const skLedge = await SkLedgeFactory.deploy();
    const testBarangays = [
      "Barangay 1",
      "Barangay 2",
      "Barangay 3",
      "Barangay San Jose",
      "Barangay A",
      "Barangay B",
      "Barangay C",
      "Adia, Agoncillo",
    ];
    await skLedge
      .connect(owner)
      .registerCanonicalBarangays(testBarangays, [
        ...testBarangays.slice(0, -1),
        "Adia",
      ]);
    for (const barangay of testBarangays) {
      await skLedge
        .connect(owner)
        .setOfficialBarangayAuthorization(owner.address, barangay, true);
    }

    return {
      skLedge,
      owner,
      official1,
      official2,
      nonOfficial,
      newOwner,
      otherAccount,
      ethers,
    };
  }

  describe("Deployment and Authorization", function () {
    it("Should set deployer as owner and default authorized official", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();
      expect(await skLedge.owner()).to.equal(owner.address);
      expect(await skLedge.isAuthorizedOfficial(owner.address)).to.equal(true);
    });

    it("Should allow owner to authorize a new official", async function () {
      const { skLedge, owner, official1 } = await deploySkLedgeFixture();
      await skLedge.connect(owner).setOfficialAuthorization(official1.address, true);
      expect(await skLedge.isAuthorizedOfficial(official1.address)).to.equal(true);
    });

    it("Should allow owner to deauthorize an official", async function () {
      const { skLedge, owner, official1 } = await deploySkLedgeFixture();
      await skLedge.connect(owner).setOfficialAuthorization(official1.address, true);
      await skLedge.connect(owner).setOfficialAuthorization(official1.address, false);
      expect(await skLedge.isAuthorizedOfficial(official1.address)).to.equal(false);
    });

    it("Should revert if a non-owner attempts to set official authorization", async function () {
      const { skLedge, nonOfficial, official1 } = await deploySkLedgeFixture();
      await expect(
        skLedge.connect(nonOfficial).setOfficialAuthorization(official1.address, true)
      ).to.be.revertedWith("SkLedge: Only the contract owner can perform this action.");
    });

    it("Should revert when authorizing the zero address", async function () {
      const { skLedge, owner, ethers } = await deploySkLedgeFixture();
      await expect(
        skLedge.connect(owner).setOfficialAuthorization(ethers.ZeroAddress, true)
      ).to.be.revertedWith("SkLedge: Invalid wallet address");
    });

    it("Should allow the owner to assign and revoke an official's barangay access", async function () {
      const { skLedge, owner, official1 } = await deploySkLedgeFixture();

      const tx = await skLedge
        .connect(owner)
        .setOfficialBarangayAuthorization(
          official1.address,
          "Barangay 1",
          true
        );
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error("Barangay authorization transaction was not confirmed.");
      }
      const event = receipt.logs
        .map((log: { topics: readonly string[]; data: string }) =>
          skLedge.interface.parseLog(log)
        )
        .find((parsed: { name: string; args: readonly unknown[] } | null) =>
          parsed?.name === "OfficialBarangayAuthorizationChanged"
        );
      expect(event?.args[0]).to.equal(official1.address);
      expect(event?.args[1]).to.equal(1);
      expect(event?.args[2]).to.equal("Barangay 1");
      expect(event?.args[3]).to.equal(true);
      expect(
        await skLedge.isOfficialAuthorizedForBarangay(
          official1.address,
          "Barangay 1"
        )
      ).to.equal(true);

      await skLedge
        .connect(owner)
        .setOfficialBarangayAuthorization(
          official1.address,
          "Barangay 1",
          false
        );
      expect(
        await skLedge.isOfficialAuthorizedForBarangay(
          official1.address,
          "Barangay 1"
        )
      ).to.equal(false);
    });

    it("Should resolve barangay aliases to the same authorization", async function () {
      const { skLedge, owner, official1 } = await deploySkLedgeFixture();

      await skLedge
        .connect(owner)
        .setOfficialBarangayAuthorization(
          official1.address,
          "Barangay Adia",
          true
        );

      expect(
        await skLedge.isOfficialAuthorizedForBarangay(
          official1.address,
          "Adia, Agoncillo"
        )
      ).to.equal(true);
    });

    it("Should reject barangay access management by a non-owner", async function () {
      const { skLedge, nonOfficial, official1 } = await deploySkLedgeFixture();

      await expect(
        skLedge
          .connect(nonOfficial)
          .setOfficialBarangayAuthorization(
            official1.address,
            "Barangay 1",
            true
          )
      ).to.be.revertedWith(
        "SkLedge: Only the contract owner can perform this action."
      );
    });

    it("Should reject barangay access for an unknown barangay", async function () {
      const { skLedge, owner, official1 } = await deploySkLedgeFixture();

      await expect(
        skLedge
          .connect(owner)
          .setOfficialBarangayAuthorization(
            official1.address,
            "Unknown Barangay",
            true
          )
      ).to.be.revertedWith("SkLedge: Unknown barangay");
    });

    it("Should reject barangay access for the zero address", async function () {
      const { skLedge, owner, ethers } = await deploySkLedgeFixture();

      await expect(
        skLedge
          .connect(owner)
          .setOfficialBarangayAuthorization(
            ethers.ZeroAddress,
            "Barangay 1",
            true
          )
      ).to.be.revertedWith("SkLedge: Invalid wallet address");
    });

    it("Should allow the owner to authorize and revoke an approver", async function () {
      const { skLedge, owner, official1 } = await deploySkLedgeFixture();

      await skLedge.connect(owner).setApproverAuthorization(official1.address, true);
      expect(await skLedge.isApprover(official1.address)).to.equal(true);

      await skLedge.connect(owner).setApproverAuthorization(official1.address, false);
      expect(await skLedge.isApprover(official1.address)).to.equal(false);
    });

    it("Should prevent a non-owner from authorizing an approver", async function () {
      const { skLedge, nonOfficial, official1 } = await deploySkLedgeFixture();

      await expect(
        skLedge.connect(nonOfficial).setApproverAuthorization(official1.address, true)
      ).to.be.revertedWith("SkLedge: Only the contract owner can perform this action.");
    });

    it("Should reject authorizing the zero address as an approver", async function () {
      const { skLedge, owner, ethers } = await deploySkLedgeFixture();

      await expect(
        skLedge.connect(owner).setApproverAuthorization(ethers.ZeroAddress, true)
      ).to.be.revertedWith("SkLedge: Invalid wallet address");
    });
  });

  describe("Two-Step Ownership Transfer", function () {
    it("Dapat ma-nominate ang bagong owner pero hindi pa maita-transfer agad", async function () {
      const { skLedge, owner, newOwner } = await deploySkLedgeFixture();
      await skLedge.connect(owner).transferOwnership(newOwner.address);
      expect(await skLedge.pendingOwner()).to.equal(newOwner.address);
      expect(await skLedge.owner()).to.equal(owner.address);
    });

    it("keeps owner-only permissions with the current owner until acceptance", async function () {
      const { skLedge, owner, newOwner, official1 } = await deploySkLedgeFixture();
      await skLedge.connect(owner).transferOwnership(newOwner.address);

      await expect(
        skLedge.connect(newOwner).setOfficialAuthorization(official1.address, true)
      ).to.be.revertedWith(
        "SkLedge: Only the contract owner can perform this action."
      );

      await skLedge.connect(owner).setOfficialAuthorization(official1.address, true);
      expect(await skLedge.isAuthorizedOfficial(official1.address)).to.equal(true);
      expect(await skLedge.owner()).to.equal(owner.address);
    });

    it("Hindi dapat makapag-nominate ng zero address", async function () {
      const { skLedge, owner, ethers } = await deploySkLedgeFixture();
      await expect(
        skLedge.connect(owner).transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("SkLedge: Cannot nominate zero address");
    });

    it("Hindi dapat ma-accept ng ibang address (unauthorized)", async function () {
      const { skLedge, owner, newOwner, otherAccount } = await deploySkLedgeFixture();
      await skLedge.connect(owner).transferOwnership(newOwner.address);
      await expect(
        skLedge.connect(otherAccount).acceptOwnership()
      ).to.be.revertedWith("SkLedge: Caller is not the pending owner");
    });

    it("Dapat matanggap ng pending owner ang ownership at ma-reset ang pending state", async function () {
      const { skLedge, owner, newOwner, ethers } = await deploySkLedgeFixture();
      await skLedge.connect(owner).transferOwnership(newOwner.address);

      await expect(skLedge.connect(newOwner).acceptOwnership())
        .to.emit(skLedge, "OwnershipTransferred")
        .withArgs(owner.address, newOwner.address);

      expect(await skLedge.owner()).to.equal(newOwner.address);
      expect(await skLedge.pendingOwner()).to.equal(ethers.ZeroAddress);
    });

    it("Dapat ma-replace ang pending nominee kung tatawag ulit ng transferOwnership", async function () {
      const { skLedge, owner, newOwner, otherAccount } = await deploySkLedgeFixture();
      await skLedge.connect(owner).transferOwnership(newOwner.address);
      await skLedge.connect(owner).transferOwnership(otherAccount.address);

      expect(await skLedge.pendingOwner()).to.equal(otherAccount.address);
    });

    it("Dapat ma-cancel ang nomination ng current owner", async function () {
      const { skLedge, owner, newOwner, ethers } = await deploySkLedgeFixture();
      await skLedge.connect(owner).transferOwnership(newOwner.address);

      await expect(skLedge.connect(owner).cancelOwnershipTransfer())
        .to.emit(skLedge, "OwnershipTransferCanceled")
        .withArgs(owner.address, newOwner.address);

      expect(await skLedge.pendingOwner()).to.equal(ethers.ZeroAddress);
    });

    it("Dapat mawalan ng admin access ang dating owner pagkatapos ng transfer", async function () {
      const { skLedge, owner, newOwner, official1 } = await deploySkLedgeFixture();
      await skLedge.connect(owner).transferOwnership(newOwner.address);
      await skLedge.connect(newOwner).acceptOwnership();

      await expect(
        skLedge.connect(owner).setOfficialAuthorization(official1.address, true)
      ).to.be.revertedWith("SkLedge: Only the contract owner can perform this action.");

      await skLedge.connect(newOwner).setOfficialAuthorization(official1.address, true);
      expect(await skLedge.isAuthorizedOfficial(official1.address)).to.equal(true);
    });
  });

  describe("Document fingerprints", function () {
    async function addExpense(
      skLedge: any,
      signer: any,
      barangay = "Barangay 1"
    ) {
      await skLedge
        .connect(signer)
        .addRecord(barangay, 1500, "Office supplies", "Expense");
    }

    it("attaches a SHA-256 fingerprint to an expense record", async function () {
      const { skLedge, owner, ethers } = await deploySkLedgeFixture();
      await addExpense(skLedge, owner);
      const hash = ethers.id("receipt-1");

      await skLedge.connect(owner).attachDocumentHash(1, hash);

      const hashes = await skLedge.getDocumentHashes(1);
      expect(hashes.length).to.equal(1);
      expect(hashes[0]).to.equal(hash);
    });

    it("emits DocumentHashAttached with the record, hash, and official", async function () {
      const { skLedge, owner, ethers } = await deploySkLedgeFixture();
      await addExpense(skLedge, owner);
      const hash = ethers.id("receipt-1");

      await expect(skLedge.connect(owner).attachDocumentHash(1, hash))
        .to.emit(skLedge, "DocumentHashAttached")
        .withArgs(1, hash, owner.address);
    });

    it("allows multiple fingerprints on the same record", async function () {
      const { skLedge, owner, ethers } = await deploySkLedgeFixture();
      await addExpense(skLedge, owner);

      await skLedge.connect(owner).attachDocumentHash(1, ethers.id("receipt-1"));
      await skLedge.connect(owner).attachDocumentHash(1, ethers.id("receipt-2"));

      const hashes = await skLedge.getDocumentHashes(1);
      expect(hashes.length).to.equal(2);
      expect(hashes[1]).to.equal(ethers.id("receipt-2"));
    });

    it("rejects a duplicate fingerprint for the same record", async function () {
      const { skLedge, owner, ethers } = await deploySkLedgeFixture();
      await addExpense(skLedge, owner);
      const hash = ethers.id("receipt-1");

      await skLedge.connect(owner).attachDocumentHash(1, hash);

      await expect(
        skLedge.connect(owner).attachDocumentHash(1, hash)
      ).to.be.revertedWith("SkLedge: Document hash already attached");
    });

    it("rejects an empty fingerprint", async function () {
      const { skLedge, owner, ethers } = await deploySkLedgeFixture();
      await addExpense(skLedge, owner);

      await expect(
        skLedge.connect(owner).attachDocumentHash(1, ethers.ZeroHash)
      ).to.be.revertedWith("SkLedge: Document hash is required");
    });

    it("rejects fingerprints on non-expense records", async function () {
      const { skLedge, owner, ethers } = await deploySkLedgeFixture();
      await skLedge
        .connect(owner)
        .addRecord("Barangay 1", 5000, "Youth Sports", "Allocation");

      await expect(
        skLedge.connect(owner).attachDocumentHash(1, ethers.id("receipt-1"))
      ).to.be.revertedWith(
        "SkLedge: Only expense records accept receipt hashes"
      );
    });

    it("rejects an unauthorized wallet", async function () {
      const { skLedge, owner, nonOfficial, ethers } =
        await deploySkLedgeFixture();
      await addExpense(skLedge, owner);

      await expect(
        skLedge
          .connect(nonOfficial)
          .attachDocumentHash(1, ethers.id("receipt-1"))
      ).to.be.revertedWith("SkLedge: Your wallet is not an authorized SK Official.");
    });

    it("rejects an official without access to the record's barangay", async function () {
      const { skLedge, owner, official1, ethers } =
        await deploySkLedgeFixture();
      await addExpense(skLedge, owner);
      await skLedge
        .connect(owner)
        .setOfficialAuthorization(official1.address, true);

      await expect(
        skLedge
          .connect(official1)
          .attachDocumentHash(1, ethers.id("receipt-1"))
      ).to.be.revertedWith(
        "SkLedge: Your wallet is not authorized for this barangay."
      );
    });

    it("rejects fingerprints on voided records", async function () {
      const { skLedge, owner, ethers } = await deploySkLedgeFixture();
      await addExpense(skLedge, owner);
      await skLedge.connect(owner).voidRecord(1, "Duplicate voucher");

      await expect(
        skLedge.connect(owner).attachDocumentHash(1, ethers.id("receipt-1"))
      ).to.be.revertedWith("SkLedge: Record is voided");
    });

    it("rejects fingerprints for a nonexistent record", async function () {
      const { skLedge, owner, ethers } = await deploySkLedgeFixture();

      await expect(
        skLedge.connect(owner).attachDocumentHash(99, ethers.id("receipt-1"))
      ).to.be.revertedWith("SkLedge: Record does not exist");
    });

    it("rejects reading fingerprints for a nonexistent record", async function () {
      const { skLedge } = await deploySkLedgeFixture();

      await expect(skLedge.getDocumentHashes(99)).to.be.revertedWith(
        "SkLedge: Record does not exist"
      );
    });

    it("caps fingerprints per record", async function () {
      const { skLedge, owner, ethers } = await deploySkLedgeFixture();
      await addExpense(skLedge, owner);

      for (let i = 1; i <= 10; i++) {
        await skLedge
          .connect(owner)
          .attachDocumentHash(1, ethers.id(`receipt-${i}`));
      }

      await expect(
        skLedge.connect(owner).attachDocumentHash(1, ethers.id("receipt-11"))
      ).to.be.revertedWith("SkLedge: Too many document hashes");
    });
  });

  describe("Adding Records and Validations", function () {
    it("Should allow an authorized official to add an Allocation record", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();
      await skLedge.connect(owner).addRecord("Barangay 1", 5000, "Youth Sports", "Allocation");
      const records = await skLedge.getAllRecords();
      expect(records.length).to.equal(1);
      expect(records[0].id).to.equal(1);
      expect(records[0].barangay).to.equal("Barangay 1");
      expect(records[0].amount).to.equal(5000);
      expect(records[0].purpose).to.equal("Youth Sports");
      expect(records[0].recordType).to.equal("Allocation");
      expect(records[0].approved).to.equal(false);
    });

    it("Should allow an authorized official to add an Expense record", async function () {
      const { skLedge, owner, nonOfficial } = await deploySkLedgeFixture();
      await skLedge.connect(owner).setOfficialAuthorization(nonOfficial.address, true);
      await skLedge
        .connect(owner)
        .setOfficialBarangayAuthorization(
          nonOfficial.address,
          "Barangay 2",
          true
        );
      await skLedge.connect(nonOfficial).addRecord("Barangay 2", 1500, "Equipment Purchase", "Expense");
      const records = await skLedge.getAllRecords();
      expect(records.length).to.equal(1);
      expect(records[0].recordType).to.equal("Expense");
    });

    it("Should allow an authorized official to add an Award record", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();
      await skLedge.connect(owner).addRecord("Barangay 3", 2000, "Bidding Award", "Award");
      const records = await skLedge.getAllRecords();
      expect(records.length).to.equal(1);
      expect(records[0].recordType).to.equal("Award");
    });

    it("Should revert if an unauthorized wallet attempts to add a record", async function () {
      const { skLedge, nonOfficial } = await deploySkLedgeFixture();
      await expect(
        skLedge.connect(nonOfficial).addRecord("Barangay 1", 1000, "Clean Up", "Allocation")
      ).to.be.revertedWith("SkLedge: Your wallet is not an authorized SK Official.");
    });

    it("Should reject globally authorized officials without barangay access", async function () {
      const { skLedge, owner, official1 } = await deploySkLedgeFixture();
      await skLedge
        .connect(owner)
        .setOfficialAuthorization(official1.address, true);

      await expect(
        skLedge
          .connect(official1)
          .addRecord("Barangay 1", 1000, "Unassigned", "Allocation")
      ).to.be.revertedWith(
        "SkLedge: Your wallet is not authorized for this barangay."
      );
    });

    it("Should allow an official to submit records for multiple assigned barangays", async function () {
      const { skLedge, owner, official1 } = await deploySkLedgeFixture();
      await skLedge
        .connect(owner)
        .setOfficialAuthorization(official1.address, true);
      await skLedge
        .connect(owner)
        .setOfficialBarangayAuthorization(
          official1.address,
          "Barangay 1",
          true
        );
      await skLedge
        .connect(owner)
        .setOfficialBarangayAuthorization(
          official1.address,
          "Barangay 2",
          true
        );

      await skLedge
        .connect(official1)
        .addRecord("Barangay 1", 1000, "First barangay", "Allocation");
      await skLedge
        .connect(official1)
        .addRecord("Barangay 2", 1000, "Second barangay", "Allocation");

      expect((await skLedge.getAllRecords()).length).to.equal(2);
    });

    it("Should retain barangay assignments through global revocation and reauthorization", async function () {
      const { skLedge, owner, official1 } = await deploySkLedgeFixture();
      await skLedge
        .connect(owner)
        .setOfficialAuthorization(official1.address, true);
      await skLedge
        .connect(owner)
        .setOfficialBarangayAuthorization(
          official1.address,
          "Barangay 1",
          true
        );

      await skLedge
        .connect(owner)
        .setOfficialAuthorization(official1.address, false);
      await expect(
        skLedge
          .connect(official1)
          .addRecord("Barangay 1", 1000, "Globally revoked", "Allocation")
      ).to.be.revertedWith(
        "SkLedge: Your wallet is not an authorized SK Official."
      );

      expect(
        await skLedge.isOfficialAuthorizedForBarangay(
          official1.address,
          "Barangay 1"
        )
      ).to.equal(true);

      await skLedge
        .connect(owner)
        .setOfficialAuthorization(official1.address, true);
      await skLedge
        .connect(official1)
        .addRecord("Barangay 1", 1000, "Reauthorized", "Allocation");
      expect((await skLedge.getAllRecords()).length).to.equal(1);
    });

    it("Should revert if amount is zero", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();
      await expect(
        skLedge.connect(owner).addRecord("Barangay 1", 0, "Tree Planting", "Allocation")
      ).to.be.revertedWith("SkLedge: Amount must be greater than zero");
    });

    it("Should revert if recordType is invalid", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();
      await expect(
        skLedge.connect(owner).addRecord("Barangay 1", 1000, "Festival Support", "Donation")
      ).to.be.revertedWith("SkLedge: Type must be 'Allocation', 'Expense', or 'Award'");
    });

    it("Should succeed when submitting identical records twice, creating distinct IDs", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();
      await skLedge.connect(owner).addRecord("Barangay 1", 2000, "Scholarship Fund", "Allocation");
      await skLedge.connect(owner).addRecord("Barangay 1", 2000, "Scholarship Fund", "Allocation");

      const records = await skLedge.getAllRecords();
      expect(records.length).to.equal(2);
      expect(records[0].id).to.equal(1);
      expect(records[1].id).to.equal(2);
      expect(records[0].barangay).to.equal(records[1].barangay);
      expect(records[0].amount).to.equal(records[1].amount);
      expect(records[0].purpose).to.equal(records[1].purpose);
      expect(records[0].recordType).to.equal(records[1].recordType);
    });

    it("Should revert if a revoked official attempts to add a record", async function () {
      const { skLedge, owner, official1 } = await deploySkLedgeFixture();
      await skLedge.connect(owner).setOfficialAuthorization(official1.address, true);
      await skLedge
        .connect(owner)
        .setOfficialBarangayAuthorization(
          official1.address,
          "Barangay 3",
          true
        );
      await skLedge.connect(official1).addRecord("Barangay 3", 1000, "First Action", "Allocation");

      await skLedge.connect(owner).setOfficialAuthorization(official1.address, false);

      await expect(
        skLedge.connect(official1).addRecord("Barangay 3", 500, "Second Action", "Expense")
      ).to.be.revertedWith("SkLedge: Your wallet is not an authorized SK Official.");
    });
  });

  describe("Allocation Ceiling", function () {
    it("Should REVERT when allocations exceed the barangay ceiling", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();

      await skLedge.setAllocationCeiling("Barangay San Jose", 1000);

      await skLedge.addRecord("Barangay San Jose", 600, "First Allocation", "Allocation");

      await expect(
        skLedge.addRecord("Barangay San Jose", 500, "Second Allocation", "Allocation")
      ).to.be.revertedWith("SkLedge: Allocation exceeds ceiling");
    });

    it("Should correctly return the total allocated amount", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();

      await skLedge.setAllocationCeiling("Barangay San Jose", 5000);

      await skLedge.addRecord("Barangay San Jose", 1000, "First Allocation", "Allocation");
      await skLedge.addRecord("Barangay San Jose", 1500, "Second Allocation", "Allocation");

      expect(await skLedge.getAllocated("Barangay San Jose")).to.equal(2500);
    });

    it("Should REVERT when setting a zero or empty ceiling", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();

      await expect(
        skLedge.setAllocationCeiling("Barangay San Jose", 0)
      ).to.be.revertedWith("SkLedge: Ceiling must be greater than zero");

      await expect(
        skLedge.setAllocationCeiling("", 1000)
      ).to.be.revertedWithCustomError(skLedge, "StringEmpty");
    });

    it("Should use one identity for canonical and unambiguous aliases", async function () {
      const { skLedge } = await deploySkLedgeFixture();

      expect(await skLedge.canonicalizeBarangay(" \tBARANGAY adia \n")).to.equal(
        "Adia, Agoncillo"
      );
      await skLedge.setAllocationCeiling("Adia, Agoncillo", 1000);
      expect(await skLedge.allocationCeilings("Barangay Adia")).to.equal(1000);
      await skLedge.addRecord(
        "  Barangay Adia  ",
        700,
        "First Allocation",
        "Allocation"
      );

      expect(await skLedge.getAllocated("Adia")).to.equal(700);
      expect((await skLedge.getAllRecords())[0].barangay).to.equal(
        "Adia, Agoncillo"
      );
      expect((await skLedge.getRecordsByBarangay("Adia")).length).to.equal(1);
      await expect(
        skLedge.addRecord("Adia", 400, "Over ceiling", "Allocation")
      ).to.be.revertedWith("SkLedge: Allocation exceeds ceiling");

    });

    it("Should reject names that are not in the canonical registry", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();

      await expect(
        skLedge.connect(owner).addRecord(
          "Unknown Barangay, Batangas",
          100,
          "Unknown",
          "Allocation"
        )
      ).to.be.revertedWith("SkLedge: Unknown barangay");
      await expect(
        skLedge.connect(owner).setAllocationCeiling("Unknown Barangay", 100)
      ).to.be.revertedWith("SkLedge: Unknown barangay");
    });

    it("Should reject an alias that points to two canonical barangays", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();

      await expect(
        skLedge
          .connect(owner)
          .registerCanonicalBarangays(
            ["First, Town", "Second, Town"],
            ["Shared", "Shared"]
          )
      ).to.be.revertedWith("SkLedge: Barangay alias is ambiguous");
    });
  });

  describe("Record Confirmation", function () {
    async function deployWithAuditor() {
      const fixture = await deploySkLedgeFixture();
      await fixture.skLedge
        .connect(fixture.owner)
        .setApproverAuthorization(fixture.otherAccount.address, true);
      return { ...fixture, auditor: fixture.otherAccount };
    }

    it("Should allow an authorized auditor to confirm a record", async function () {
      const { skLedge, auditor } = await deployWithAuditor();

      await skLedge.addRecord("Barangay San Jose", 5000, "Test Expense", "Expense");

      await expect(skLedge.connect(auditor).confirmRecord(1))
        .to.emit(skLedge, "RecordConfirmed")
        .withArgs(1, auditor.address);

      const [record] = await skLedge.getAllRecords();
      expect(record.approved).to.equal(true);
      expect(record.approvedBy).to.equal(auditor.address);
    });

    it("Should reject confirmation from a non-auditor", async function () {
      const { skLedge, official1 } = await deploySkLedgeFixture();
      await skLedge.addRecord("Barangay A", 1000, "Purpose", "Allocation");

      await expect(
        skLedge.connect(official1).confirmRecord(1)
      ).to.be.revertedWith(
        "SkLedge: Only an authorized COA auditor can perform this action."
      );
    });

    it("Should reject confirming the same record twice", async function () {
      const { skLedge, auditor } = await deployWithAuditor();
      await skLedge.addRecord("Barangay A", 1000, "Purpose", "Allocation");
      await skLedge.connect(auditor).confirmRecord(1);

      await expect(
        skLedge.connect(auditor).confirmRecord(1)
      ).to.be.revertedWith("SkLedge: Record is already confirmed");
    });

    it("Should reject confirming a voided or nonexistent record", async function () {
      const { skLedge, auditor } = await deployWithAuditor();
      await skLedge.addRecord("Barangay A", 1000, "Purpose", "Expense");
      await skLedge.voidRecord(1, "Invalid");

      await expect(
        skLedge.connect(auditor).confirmRecord(1)
      ).to.be.revertedWith("SkLedge: Record is voided");
      await expect(
        skLedge.connect(auditor).confirmRecord(999)
      ).to.be.revertedWith("SkLedge: Record does not exist");
    });

    it("Should not lock a barangay after confirmation", async function () {
      const { skLedge, auditor } = await deployWithAuditor();
      await skLedge.addRecord("Barangay A", 1000, "First", "Expense");
      await skLedge.connect(auditor).confirmRecord(1);

      await skLedge.addRecord("Barangay A", 2000, "Second", "Expense");
      expect((await skLedge.getAllRecords()).length).to.equal(2);
    });

    it("Should let the owner and the barangay official set a ceiling", async function () {
      const { skLedge, official1, owner } = await deploySkLedgeFixture();
      await skLedge.setOfficialAuthorization(official1.address, true);
      await skLedge.setOfficialBarangayAuthorization(
        official1.address,
        "Barangay A",
        true
      );

      await skLedge.connect(official1).setAllocationCeiling("Barangay A", 5000);
      expect(await skLedge.allocationCeilings("Barangay A")).to.equal(5000);

      await skLedge.connect(owner).setAllocationCeiling("Barangay A", 7000);
      expect(await skLedge.allocationCeilings("Barangay A")).to.equal(7000);
    });

    it("Should reject a ceiling change from an official of another barangay", async function () {
      const { skLedge, official1 } = await deploySkLedgeFixture();
      await skLedge.setOfficialAuthorization(official1.address, true);
      await skLedge.setOfficialBarangayAuthorization(
        official1.address,
        "Barangay B",
        true
      );

      await expect(
        skLedge.connect(official1).setAllocationCeiling("Barangay A", 5000)
      ).to.be.revertedWith(
        "SkLedge: Only the owner or an official of this barangay can set a ceiling"
      );
    });
  });

  describe("Record Voiding", function () {
    it("should void a record while preserving its data and reason", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();

      await skLedge.addRecord("Barangay A", 5000, "Original purpose", "Allocation");

      await expect(skLedge.voidRecord(1, "Invalid supporting document"))
        .to.emit(skLedge, "RecordVoided")
        .withArgs(1, owner.address, "Invalid supporting document");

      const [record] = await skLedge.getAllRecords();
      expect(record.id).to.equal(1);
      expect(record.amount).to.equal(5000);
      expect(record.purpose).to.equal("Original purpose");
      expect(record.voided).to.equal(true);
      expect(record.voidReason).to.equal("Invalid supporting document");
      expect(await skLedge.getAllocated("Barangay A")).to.equal(0);
    });

    it("should allow only the owner to void records", async function () {
      const { skLedge, owner, official1, official2, nonOfficial } =
        await deploySkLedgeFixture();
      await skLedge.setApproverAuthorization(official1.address, true);
      await skLedge.setOfficialAuthorization(official2.address, true);
      await skLedge.addRecord("Barangay A", 1000, "Purpose", "Allocation");

      for (const signer of [official1, official2, nonOfficial]) {
        await expect(
          skLedge.connect(signer).voidRecord(1, "Invalid")
        ).to.be.revertedWith(
          "SkLedge: Only the contract owner can perform this action."
        );
      }

      await expect(skLedge.connect(owner).voidRecord(1, "Invalid"))
        .to.emit(skLedge, "RecordVoided")
        .withArgs(1, owner.address, "Invalid");
    });

    it("should reject empty and over-limit reasons using UTF-8 byte length", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();
      await skLedge.addRecord("Barangay A", 1000, "Purpose", "Allocation");

      await expect(skLedge.voidRecord(1, ""))
        .to.be.revertedWithCustomError(skLedge, "StringEmpty");

      const validReason = "ñ".repeat(128);
      expect(new TextEncoder().encode(validReason).length).to.equal(256);
      await skLedge.voidRecord(1, validReason);

      await skLedge.addRecord("Barangay A", 1000, "Purpose 2", "Allocation");
      const invalidReason = "ñ".repeat(129);
      await expect(skLedge.voidRecord(2, invalidReason))
        .to.be.revertedWithCustomError(skLedge, "VoidReasonTooLong")
        .withArgs(258, 256);
    });

    it("should reject nonexistent and repeated voids", async function () {
      const { skLedge } = await deploySkLedgeFixture();

      await expect(skLedge.voidRecord(999, "Invalid")).to.be.revertedWith(
        "SkLedge: Record does not exist"
      );

      await skLedge.addRecord("Barangay A", 1000, "Purpose", "Expense");
      await skLedge.voidRecord(1, "Invalid");
      await expect(skLedge.voidRecord(1, "Another reason")).to.be.revertedWith(
        "SkLedge: Record is already voided"
      );
    });

    it("should decrement allocation totals once and allow the released ceiling", async function () {
      const { skLedge } = await deploySkLedgeFixture();
      await skLedge.setAllocationCeiling("Barangay A", 1000);
      await skLedge.addRecord("Barangay A", 1000, "Purpose", "Allocation");

      await skLedge.voidRecord(1, "Invalid allocation");
      expect(await skLedge.getAllocated("Barangay A")).to.equal(0);

      await skLedge.addRecord("Barangay A", 1000, "Replacement", "Allocation");
      expect(await skLedge.getAllocated("Barangay A")).to.equal(1000);
    });

    it("should clear confirmation state when a confirmed record is voided", async function () {
      const { skLedge, ethers, otherAccount } = await deploySkLedgeFixture();
      await skLedge.setApproverAuthorization(otherAccount.address, true);
      await skLedge.addRecord("Barangay A", 1000, "First", "Allocation");
      await skLedge.connect(otherAccount).confirmRecord(1);

      await skLedge.voidRecord(1, "First is invalid");
      const [voidedRecord] = await skLedge.getAllRecords();
      expect(voidedRecord.approved).to.equal(false);
      expect(voidedRecord.approvedBy).to.equal(ethers.ZeroAddress);
      expect(await skLedge.getAllocated("Barangay A")).to.equal(0);
    });
  });

  describe("Input Byte Length Validation", function () {
    it("accepts a canonical barangay name at exactly 64 UTF-8 bytes", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();
      const valid64ByteName = "Barangay-Niño-" + "A".repeat(49);

      expect(new TextEncoder().encode(valid64ByteName).length).to.equal(64);
      await skLedge
        .connect(owner)
        .registerCanonicalBarangays([valid64ByteName], [""]);
      await skLedge
        .connect(owner)
        .setAllocationCeiling(valid64ByteName, 50000000);
    });

    it("rejects a barangay name longer than 64 UTF-8 bytes", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();
      const invalid65ByteName = "A".repeat(65);

      await expect(
        skLedge
          .connect(owner)
          .registerCanonicalBarangays([invalid65ByteName], [""])
      )
        .to.be.revertedWithCustomError(skLedge, "BarangayNameTooLong")
        .withArgs(65, 64);
    });

    it("rejects an empty barangay name", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();

      await expect(
        skLedge.connect(owner).registerCanonicalBarangays([""], [""])
      ).to.be.revertedWithCustomError(skLedge, "StringEmpty");
    });

    it("enforces the barangay byte limit on aliases", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();

      await expect(
        skLedge
          .connect(owner)
          .registerCanonicalBarangays(["Short Name"], ["A".repeat(65)])
      )
        .to.be.revertedWithCustomError(skLedge, "BarangayNameTooLong")
        .withArgs(65, 64);
    });

    it("accepts a purpose at exactly 256 UTF-8 bytes", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();
      const valid256BytePurpose = "ñ".repeat(128);

      expect(new TextEncoder().encode(valid256BytePurpose).length).to.equal(256);
      await skLedge
        .connect(owner)
        .addRecord("Barangay 1", 1000, valid256BytePurpose, "Allocation");
    });

    it("rejects a purpose longer than 256 UTF-8 bytes", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();
      const invalid257BytePurpose = "P".repeat(255) + "ñ";

      await expect(
        skLedge
          .connect(owner)
          .addRecord("Barangay 1", 1000, invalid257BytePurpose, "Allocation")
      )
        .to.be.revertedWithCustomError(skLedge, "PurposeTooLong")
        .withArgs(257, 256);
    });

    it("rejects an empty purpose", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();

      await expect(
        skLedge
          .connect(owner)
          .addRecord("Barangay 1", 1000, "", "Allocation")
      ).to.be.revertedWithCustomError(skLedge, "StringEmpty");
    });
  });

  describe("Bulk Operations and Queries", function () {
    it("Should correctly record and return 50 records in order with IDs 1..50", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();

      const bulkBarangays = Array.from(
        { length: 50 },
        (_, index) => `Barangay ${index + 1}`
      );
      for (let offset = 0; offset < bulkBarangays.length; offset += 20) {
        const batch = bulkBarangays.slice(offset, offset + 20);
        await skLedge
          .connect(owner)
          .registerCanonicalBarangays(batch, batch);
      }

      for (let i = 1; i <= 50; i++) {
        await skLedge
          .connect(owner)
          .setOfficialBarangayAuthorization(
            owner.address,
            `Barangay ${i}`,
            true
          );
        await skLedge
          .connect(owner)
          .addRecord(
            `Barangay ${i}`,
            i * 100,
            `Purpose ${i}`,
            i % 2 === 0 ? "Expense" : "Allocation"
          );
      }

      const records = await skLedge.getAllRecords();
      expect(records.length).to.equal(50);

      for (let i = 0; i < 50; i++) {
        expect(records[i].id).to.equal(i + 1);
        expect(records[i].barangay).to.equal(`Barangay ${i + 1}`);
        expect(records[i].amount).to.equal((i + 1) * 100);
      }
    });
  });

  describe("getRecordsByBarangay", function () {
    it("Should return only the records for the requested barangay", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();

      await skLedge.connect(owner).addRecord("Barangay A", 2000, "First A", "Allocation");
      await skLedge.connect(owner).addRecord("Barangay A", 1500, "Second A", "Expense");
      await skLedge.connect(owner).addRecord("Barangay B", 1000, "First B", "Award");

      const barangayARecords = await skLedge.getRecordsByBarangay("Barangay A");
      expect(barangayARecords.length).to.equal(2);

      const barangayBRecords = await skLedge.getRecordsByBarangay("Barangay B");
      expect(barangayBRecords.length).to.equal(1);

      const barangayCRecords = await skLedge.getRecordsByBarangay("Barangay C");
      expect(barangayCRecords.length).to.equal(0);

      expect(barangayARecords[0].barangay).to.equal("Barangay A");
      expect(barangayARecords[1].barangay).to.equal("Barangay A");
      expect(barangayARecords[0].id).to.equal(1);
      expect(barangayARecords[1].id).to.equal(2);
      expect(barangayBRecords[0].barangay).to.equal("Barangay B");
      expect(barangayBRecords[0].id).to.equal(3);
    });
  });
});