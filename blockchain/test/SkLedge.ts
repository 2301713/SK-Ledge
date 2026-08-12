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
    });

    it("Should allow an authorized official to add an Expense record", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();
      await skLedge.connect(owner).addRecord("Barangay 2", 1500, "Equipment Purchase", "Expense");
      const records = await skLedge.getAllRecords();
      expect(records.length).to.equal(1);
      expect(records[0].recordType).to.equal("Expense");
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