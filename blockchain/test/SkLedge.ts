import { expect } from "chai";
import { network } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-ethers-chai-matchers/withArgs";

describe("SkLedge Contract", function () {
  async function deploySkLedgeFixture() {
    const { ethers } = await network.create();

    const [owner, official, unauthorized] = await ethers.getSigners();

    const skLedge = (await ethers.deployContract("SkLedge")) as any;

    return { skLedge, owner, official, unauthorized };
  }

  describe("Deployment & Access Control", function () {
    it("Should set the deployer as the owner", async function () {
      const { skLedge, owner } = await deploySkLedgeFixture();

      expect(await skLedge.owner()).to.equal(owner.address);
    });

    it("Should allow the owner to authorize an official", async function () {
      const { skLedge, official } = await deploySkLedgeFixture();

      await skLedge.setOfficialAuthorization(
        official.address,
        true
      );

      expect(
        await skLedge.isAuthorizedOfficial(official.address)
      ).to.be.true;
    });

    it("Should REVERT if a non-owner tries to authorize an official", async function () {
      const { skLedge, unauthorized, official } =
        await deploySkLedgeFixture();

      await expect(
        skLedge
          .connect(unauthorized)
          .setOfficialAuthorization(
            official.address,
            true
          )
      ).to.be.revertedWith(
        "SkLedge: Only the contract owner can perform this action."
      );
    });
  });

  describe("Adding Financial Records", function () {
    it("Should allow an authorized official to add a valid record", async function () {
      const { skLedge, official } =
        await deploySkLedgeFixture();

      await skLedge.setOfficialAuthorization(
        official.address,
        true
      );

      await expect(
        skLedge
          .connect(official)
          .addRecord(
            "Barangay San Jose",
            5000,
            "Basketball League Supplies",
            "Expense"
          )
      )
        .to.emit(skLedge, "RecordAdded")
        .withArgs(
          1,
          official.address,
          "Barangay San Jose",
          5000,
          anyValue,
          "Expense"
        );

      const records = await skLedge.getAllRecords();

      expect(records.length).to.equal(1);
      expect(records[0].amount).to.equal(5000);
    });

    it("Should REVERT if the record type is not 'Allocation' or 'Expense'", async function () {
      const { skLedge } =
        await deploySkLedgeFixture();

      await expect(
        skLedge.addRecord(
          "Barangay San Jose",
          5000,
          "Invalid Test",
          "Donation"
        )
      ).to.be.revertedWith(
        "SkLedge: Type must be 'Allocation' or 'Expense'"
      );
    });
  });

  describe("Allocation Ceiling", function () {
    it("Should REVERT when allocations exceed the barangay ceiling", async function () {
      const { skLedge } =
        await deploySkLedgeFixture();

      await skLedge.setAllocationCeiling(
        "Barangay San Jose",
        1000
      );

      await skLedge.addRecord(
        "Barangay San Jose",
        600,
        "First Allocation",
        "Allocation"
      );

      await expect(
        skLedge.addRecord(
          "Barangay San Jose",
          500,
          "Second Allocation",
          "Allocation"
        )
      ).to.be.revertedWith(
        "SkLedge: Allocation exceeds ceiling"
      );
    });

    it("Should correctly return the total allocated amount", async function () {
      const { skLedge } =
        await deploySkLedgeFixture();

      await skLedge.setAllocationCeiling(
        "Barangay San Jose",
        5000
      );

      await skLedge.addRecord(
        "Barangay San Jose",
        1000,
        "First Allocation",
        "Allocation"
      );

      await skLedge.addRecord(
        "Barangay San Jose",
        1500,
        "Second Allocation",
        "Allocation"
      );

      expect(
        await skLedge.getAllocated("Barangay San Jose")
      ).to.equal(2500);
    });
  });

  describe("Record Approval", function () {
    it("Should allow the owner to approve and unapprove a record", async function () {
      const { skLedge, owner } =
        await deploySkLedgeFixture();

      await skLedge.addRecord(
        "Barangay San Jose",
        5000,
        "Test Expense",
        "Expense"
      );

      await skLedge.setRecordApproval(1, true);

      let records = await skLedge.getAllRecords();

      expect(records[0].approved).to.be.true;
      expect(records[0].approvedBy).to.equal(
        owner.address
      );

      await skLedge.setRecordApproval(1, false);

      records = await skLedge.getAllRecords();

      expect(records[0].approved).to.be.false;
      expect(records[0].approvedBy).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
    });

    it("Should REVERT when approving a nonexistent record", async function () {
      const { skLedge } =
        await deploySkLedgeFixture();

      await expect(
        skLedge.setRecordApproval(999, true)
      ).to.be.revertedWith(
        "SkLedge: Record does not exist"
      );
    });
  });
});