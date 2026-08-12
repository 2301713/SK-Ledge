import { expect } from "chai";
import { network } from "hardhat";

declare global {
  namespace Chai {
    interface Assertion {
      revertedWith(reason: string | RegExp): Promise<void>;
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
      ).to.be.revertedWith("SkLedge: Invalid barangay");
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
});