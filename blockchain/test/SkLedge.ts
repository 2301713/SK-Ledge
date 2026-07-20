import { expect } from "chai";
import { network } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-ethers-chai-matchers/withArgs";

describe("SkLedge Contract", function () {
  // A helper function to deploy a fresh contract before each test
  async function deploySkLedgeFixture() {
    // Get the ethers instance specifically from the network
    const { ethers } = await network.create();

    // Get test accounts
    const [owner, official, unauthorized] = await ethers.getSigners();

    // Deploy the contract using the new simplified deployContract syntax
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

      await skLedge.setOfficialAuthorization(official.address, true);
      expect(await skLedge.isAuthorizedOfficial(official.address)).to.be.true;
    });

    it("Should REVERT if a non-owner tries to authorize an official", async function () {
      const { skLedge, unauthorized, official } = await deploySkLedgeFixture();

      // Attempting to connect as an unauthorized wallet and call the owner function
      await expect(
        skLedge
          .connect(unauthorized)
          .setOfficialAuthorization(official.address, true),
      ).to.be.revertedWith(
        "SkLedge: Only the contract owner can perform this action.",
      );
    });
  });

  describe("Adding Financial Records", function () {
    it("Should allow an authorized official to add a valid record", async function () {
      const { skLedge, official } = await deploySkLedgeFixture();

      // Authorize the official first
      await skLedge.setOfficialAuthorization(official.address, true);

      // Add a record and check if it emits the exact event we need for Supabase sync
      // We use `anyValue` for the timestamp since the blockchain generates it dynamically
      await expect(
        skLedge
          .connect(official)
          .addRecord(
            "Barangay San Jose",
            5000,
            "Basketball League Supplies",
            "Expense",
          ),
      )
        .to.emit(skLedge, "RecordAdded")
        .withArgs(
          1,
          official.address,
          "Barangay San Jose",
          5000,
          anyValue,
          "Expense",
        );

      // Verify it was actually saved in the array
      const records = await skLedge.getAllRecords();
      expect(records.length).to.equal(1);
      expect(records[0].amount).to.equal(5000);
    });

    it("Should REVERT if the record type is not 'Allocation' or 'Expense'", async function () {
      const { skLedge } = await deploySkLedgeFixture();

      // The owner is authorized by default in the constructor, so we can test with it
      await expect(
        skLedge.addRecord(
          "Barangay San Jose",
          5000,
          "Invalid Test",
          "Donation",
        ),
      ).to.be.revertedWith("SkLedge: Type must be 'Allocation' or 'Expense'");
    });
  });
});
