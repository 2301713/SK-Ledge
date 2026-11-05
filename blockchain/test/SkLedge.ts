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

      await skLedge.setRecordApproval(1, true);
      expect(await skLedge.isBarangayLocked("Adia, Agoncillo")).to.equal(true);
      await expect(
        skLedge.addRecord("Adia", 100, "Locked expense", "Expense")
      ).to.be.revertedWith("SkLedge: Barangay is locked after approval");
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

  describe("Record Approval", function () {
    it("Should allow the owner to approve and unapprove a record", async function () {
      const { skLedge, owner, ethers } = await deploySkLedgeFixture();

      await skLedge.addRecord("Barangay San Jose", 5000, "Test Expense", "Expense");

      await skLedge.setRecordApproval(1, true);

      let records = await skLedge.getAllRecords();

      expect(records[0].approved).to.be.true;
      expect(records[0].approvedBy).to.equal(owner.address);

      await skLedge.setRecordApproval(1, false);

      records = await skLedge.getAllRecords();

      expect(records[0].approved).to.be.false;
      expect(records[0].approvedBy).to.equal(ethers.ZeroAddress);
    });

    it("Should REVERT when approving a nonexistent record", async function () {
      const { skLedge } = await deploySkLedgeFixture();

      await expect(
        skLedge.setRecordApproval(999, true)
      ).to.be.revertedWith("SkLedge: Record does not exist");
    });

    it("Should allow an authorized approver to approve and record their address", async function () {
      const { skLedge, owner, official1 } = await deploySkLedgeFixture();
      await skLedge.connect(owner).setApproverAuthorization(official1.address, true);
      await skLedge.connect(owner).addRecord("Barangay San Jose", 5000, "Test Expense", "Expense");

      await skLedge.connect(official1).setRecordApproval(1, true);

      const [record] = await skLedge.getAllRecords();
      expect(record.approved).to.equal(true);
      expect(record.approvedBy).to.equal(official1.address);
      expect(await skLedge.isBarangayLocked("Barangay San Jose")).to.equal(true);
    });

    it("Should allow an authorized approver to unapprove a record", async function () {
      const { skLedge, owner, official1, ethers } = await deploySkLedgeFixture();
      await skLedge.connect(owner).setApproverAuthorization(official1.address, true);
      await skLedge.connect(owner).addRecord("Barangay San Jose", 5000, "Test Expense", "Expense");
      await skLedge.connect(official1).setRecordApproval(1, true);

      await skLedge.connect(official1).setRecordApproval(1, false);

      const [record] = await skLedge.getAllRecords();
      expect(record.approved).to.equal(false);
      expect(record.approvedBy).to.equal(ethers.ZeroAddress);
      expect(await skLedge.isBarangayLocked("Barangay San Jose")).to.equal(false);
    });

    it("Should reject approval by an unauthorized wallet", async function () {
      const { skLedge, owner, nonOfficial } = await deploySkLedgeFixture();
      await skLedge.connect(owner).addRecord("Barangay San Jose", 5000, "Test Expense", "Expense");

      await expect(
        skLedge.connect(nonOfficial).setRecordApproval(1, true)
      ).to.be.revertedWith(
        "SkLedge: Only the contract owner or an authorized approver can perform this action."
      );
    });

    it("Should reject approval by a revoked approver", async function () {
      const { skLedge, owner, official1 } = await deploySkLedgeFixture();
      await skLedge.connect(owner).setApproverAuthorization(official1.address, true);
      await skLedge.connect(owner).setApproverAuthorization(official1.address, false);
      await skLedge.connect(owner).addRecord("Barangay San Jose", 5000, "Test Expense", "Expense");

      await expect(
        skLedge.connect(official1).setRecordApproval(1, true)
      ).to.be.revertedWith(
        "SkLedge: Only the contract owner or an authorized approver can perform this action."
      );
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