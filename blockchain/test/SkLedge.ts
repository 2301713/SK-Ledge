import { expect } from "chai";
import { network } from "hardhat";

declare global {
  namespace Chai {
    interface Assertion {
      revertedWith(reason: string | RegExp): Promise<void>;
      revertedWithCustomError(contract: any, errorName: string): Assertion;
      withArgs(...args: any[]): Promise<void>;
      reverted: Promise<void>;
    }
  }
}

describe("SkLedge Contract Test Suite", function () {
  async function deploySkLedgeFixture() {
    const { ethers } = await (network as any).create();
    const [owner, official1, official2, nonOfficial] = await ethers.getSigners();

    const SkLedgeFactory = await ethers.getContractFactory("SkLedge");
    const skLedge = await SkLedgeFactory.deploy();

    return { skLedge, owner, official1, official2, nonOfficial, ethers };
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
  });

  describe("Record Approval", function () {
    it("Should allow the owner to approve and unapprove a record", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();

      await skLedge.addRecord("Barangay San Jose", 5000, "Test Expense", "Expense");

      await skLedge.setRecordApproval(1, true);

      let records = await skLedge.getAllRecords();

      expect(records[0].approved).to.be.true;
      expect(records[0].approvedBy).to.equal(owner.address);

      await skLedge.setRecordApproval(1, false);

      records = await skLedge.getAllRecords();

      expect(records[0].approved).to.be.false;
      expect(records[0].approvedBy).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
    });

    it("Should REVERT when approving a nonexistent record", async function () {
      const { skLedge } = await deploySkLedgeFixture();

      await expect(
        skLedge.setRecordApproval(999, true)
      ).to.be.revertedWith("SkLedge: Record does not exist");
    });
  });

  describe("Record Locking After Approval", function () {
    it("Should REVERT when adding an Expense for a locked barangay", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();

      await skLedge.connect(owner).addRecord("Barangay A", 5000, "First Allocation", "Allocation");
      await skLedge.connect(owner).setRecordApproval(1, true);

      expect(await skLedge.isBarangayLocked("Barangay A")).to.equal(true);

      await expect(
        skLedge.connect(owner).addRecord("Barangay A", 1000, "Expense after approval", "Expense")
      ).to.be.revertedWith("SkLedge: Barangay is locked after approval");
    });

    it("Should REVERT when adding an Award for a locked barangay", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();

      await skLedge.connect(owner).addRecord("Barangay B", 5000, "First Allocation", "Allocation");
      await skLedge.connect(owner).setRecordApproval(1, true);

      await expect(
        skLedge.connect(owner).addRecord("Barangay B", 2000, "Award after approval", "Award")
      ).to.be.revertedWith("SkLedge: Barangay is locked after approval");
    });

    it("Should ALLOW adding an Allocation for a locked barangay", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();

      await skLedge.connect(owner).addRecord("Barangay A", 5000, "First Allocation", "Allocation");
      await skLedge.connect(owner).setRecordApproval(1, true);

      await skLedge.connect(owner).addRecord("Barangay A", 2000, "Second Allocation", "Allocation");

      const records = await skLedge.getAllRecords();
      expect(records.length).to.equal(2);
      expect(records[1].recordType).to.equal("Allocation");
    });

    it("Should ALLOW adding an Expense after unapproving the record", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();

      await skLedge.connect(owner).addRecord("Barangay A", 5000, "First Allocation", "Allocation");
      await skLedge.connect(owner).setRecordApproval(1, true);
      await skLedge.connect(owner).setRecordApproval(1, false);

      expect(await skLedge.isBarangayLocked("Barangay A")).to.equal(false);

      await skLedge.connect(owner).addRecord("Barangay A", 1000, "Expense after unlock", "Expense");

      const records = await skLedge.getAllRecords();
      expect(records.length).to.equal(2);
      expect(records[1].recordType).to.equal("Expense");
    });

    it("Should keep the barangay locked if another approved record exists", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();

      await skLedge.connect(owner).addRecord("Barangay A", 5000, "First Allocation", "Allocation");
      await skLedge.connect(owner).addRecord("Barangay A", 3000, "Second Allocation", "Allocation");
      await skLedge.connect(owner).setRecordApproval(1, true);
      await skLedge.connect(owner).setRecordApproval(2, true);

      await skLedge.connect(owner).setRecordApproval(1, false);

      expect(await skLedge.isBarangayLocked("Barangay A")).to.equal(true);

      await expect(
        skLedge.connect(owner).addRecord("Barangay A", 1000, "Expense while still locked", "Expense")
      ).to.be.revertedWith("SkLedge: Barangay is locked after approval");
    });
  });

  describe("Bulk Operations and Queries", function () {
    it("Should correctly record and return 50 records in order with IDs 1..50", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();

      for (let i = 1; i <= 50; i++) {
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

  describe("Input Byte Length and UTF-8 Validation", function () {
    it("should accept barangay name at exactly 64 bytes", async function () {
      const { skLedge } = await deploySkLedgeFixture();
      const valid64ByteName = "A".repeat(64);
      await skLedge.setAllocationCeiling(valid64ByteName, 50000000);
    });

    it("should revert if barangay name exceeds 64 bytes (65 bytes)", async function () {
      const { skLedge } = await deploySkLedgeFixture();
      const invalid65ByteName = "A".repeat(65);
      await expect(skLedge.setAllocationCeiling(invalid65ByteName, 50000000))
        .to.be.revertedWithCustomError(skLedge, "BarangayNameTooLong")
        .withArgs(65, 64);
    });

    it("should revert if barangay name is empty", async function () {
      const { skLedge } = await deploySkLedgeFixture();
      await expect(skLedge.setAllocationCeiling("", 50000000))
        .to.be.revertedWithCustomError(skLedge, "StringEmpty");
    });

    it("should correctly calculate multibyte UTF-8 characters for barangay name", async function () {
      const { skLedge } = await deploySkLedgeFixture();
      // 'ñ' is 2 bytes in UTF-8 -> "Barangay-Niño-" (15 bytes) + 49 'A's = 64 bytes total
      const validMultiByteName = "Barangay-Niño-" + "A".repeat(49);
      await skLedge.setAllocationCeiling(validMultiByteName, 50000000);
    });

    it("should accept purpose at exactly 256 bytes", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();
      const valid256BytePurpose = "P".repeat(256);
      await skLedge.connect(owner).addRecord("Barangay 1", 1000, valid256BytePurpose, "Allocation");
    });

    it("should revert if purpose exceeds 256 bytes (257 bytes)", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();
      const invalid257BytePurpose = "P".repeat(257);
      await expect(skLedge.connect(owner).addRecord("Barangay 1", 1000, invalid257BytePurpose, "Allocation"))
        .to.be.revertedWithCustomError(skLedge, "PurposeTooLong")
        .withArgs(257, 256);
    });

    it("should revert if purpose is empty", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();
      await expect(skLedge.connect(owner).addRecord("Barangay 1", 1000, "", "Allocation"))
        .to.be.revertedWithCustomError(skLedge, "StringEmpty");
    });
  });
});