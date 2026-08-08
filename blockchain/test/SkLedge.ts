import { expect } from "chai";
import { network } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-ethers-chai-matchers/withArgs";

describe("SkLedge", function () {
  async function deploySkLedgeFixture() {
    const { ethers } = await (network as any).create();
    const [owner, official, unauthorized] = await ethers.getSigners();
    const skLedge = (await ethers.deployContract("SkLedge")) as any;
    return { skLedge, owner, official, unauthorized };
  }

  describe("Deployment", function () {
    it("Should set the deployer as the owner and auto-authorize them", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();
      expect(await skLedge.owner()).to.equal(owner.address);
      expect(await skLedge.isAuthorizedOfficial(owner.address)).to.be.true;
    });
  });

  describe("Authorization", function () {
    it("Should allow the owner to authorize an official", async function () {
      const { skLedge, official } = await deploySkLedgeFixture();
      await skLedge.setOfficialAuthorization(official.address, true);
      expect(await skLedge.isAuthorizedOfficial(official.address)).to.be.true;
    });

    it("Should REVERT when a non-owner tries to authorize an official", async function () {
      const { skLedge, unauthorized, official } = await deploySkLedgeFixture();
      let error: any;
      try {
        await skLedge.connect(unauthorized).setOfficialAuthorization(official.address, true);
      } catch (e) {
        error = e;
      }
      expect(error).to.exist;
    });

    it("Should REVERT when authorizing the zero address", async function () {
      const { skLedge } = await deploySkLedgeFixture();
      const { ethers } = await (network as any).create();
      
      await expect(
        skLedge.setOfficialAuthorization(ethers.ZeroAddress, true)
      ).to.be.revertedWith("SkLedge: Invalid wallet address");
    });

    it("Should allow the owner to revoke an official", async function () {
      const { skLedge, official } = await deploySkLedgeFixture();
      
      await skLedge.setOfficialAuthorization(official.address, true);
      expect(await skLedge.isAuthorizedOfficial(official.address)).to.be.true;

      await skLedge.setOfficialAuthorization(official.address, false);
      expect(await skLedge.isAuthorizedOfficial(official.address)).to.be.false;

      await expect(
        skLedge.connect(official).addRecord("Barangay 1", 1000, "Supplies", "Expense")
      ).to.be.revertedWith("SkLedge: Your wallet is not an authorized SK Official.");
    });

    it("Should emit OfficialAuthorizationChanged when authorization changes", async function () {
      const { skLedge, official } = await deploySkLedgeFixture();

      await expect(skLedge.setOfficialAuthorization(official.address, true))
        .to.emit(skLedge, "OfficialAuthorizationChanged")
        .withArgs(official.address, true);

      await expect(skLedge.setOfficialAuthorization(official.address, false))
        .to.emit(skLedge, "OfficialAuthorizationChanged")
        .withArgs(official.address, false);
    });
  });

  describe("Records Management", function () {
    it("Should allow an authorized official to add a valid Expense record", async function () {
      const { skLedge, official } = await deploySkLedgeFixture();
      await skLedge.setOfficialAuthorization(official.address, true);

      await skLedge.connect(official).addRecord("Barangay 1", 1500, "Office Supplies", "Expense");
    });

    it("Should REVERT when an invalid record type is provided", async function () {
      const { skLedge } = await deploySkLedgeFixture();
      let error: any;
      try {
        await skLedge.addRecord("Barangay 1", 1500, "Office Supplies", "InvalidType");
      } catch (e) {
        error = e;
      }
      expect(error).to.exist;
    });

    it("Should REVERT when an unauthorized official tries to add a record", async function () {
      const { skLedge, unauthorized } = await deploySkLedgeFixture();
      
      await expect(
        skLedge.connect(unauthorized).addRecord("Barangay 2", 2000, "Sports Equipment", "Expense")
      ).to.be.revertedWith("SkLedge: Your wallet is not an authorized SK Official.");
    });

    it("Should REVERT when the amount is zero", async function () {
      const { skLedge } = await deploySkLedgeFixture();
      
      await expect(
        skLedge.addRecord("Barangay 3", 0, "Snacks", "Expense")
      ).to.be.revertedWith("SkLedge: Amount must be greater than zero");
    });

    it("Should allow adding an Allocation record", async function () {
      const { skLedge, official } = await deploySkLedgeFixture();
      await skLedge.setOfficialAuthorization(official.address, true);

      const tx = await skLedge.connect(official).addRecord("Barangay 1", 50000, "Annual Budget", "Allocation");
      
      await expect(tx)
        .to.emit(skLedge, "RecordAdded")
        .withArgs(1, official.address, "Barangay 1", 50000, anyValue, "Allocation");

      const records = await skLedge.getAllRecords();
      expect(records.length).to.equal(1);
      expect(records[0].barangay).to.equal("Barangay 1");
      expect(records[0].amount).to.equal(50000);
      expect(records[0].purpose).to.equal("Annual Budget");
      expect(records[0].recordType).to.equal("Allocation");
    });

    it("Should store multiple records with incrementing ids", async function () {
      const { skLedge } = await deploySkLedgeFixture();

      await skLedge.addRecord("Barangay A", 100, "Purpose 1", "Expense");
      await skLedge.addRecord("Barangay B", 200, "Purpose 2", "Allocation");
      await skLedge.addRecord("Barangay C", 300, "Purpose 3", "Expense");

      const records = await skLedge.getAllRecords();
      
      expect(records.length).to.equal(3);
      expect(records[0].id).to.equal(1);
      expect(records[1].id).to.equal(2);
      expect(records[2].id).to.equal(3);
    });
  });
});