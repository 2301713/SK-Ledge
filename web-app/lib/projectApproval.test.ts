import { describe, expect, it } from "vitest";
import {
  BIDDING_NOT_APPROVED_MESSAGE,
  biddingAvailability,
  canPublishForBidding,
  canRecordProjectDecision,
  isAcceptingBids,
  isProjectApproved,
  projectDisplayStatus,
} from "./projectApproval";

const NOW = Date.parse("2026-11-21T00:00:00.000Z");
const future = "2026-12-25T00:00:00.000Z";
const past = "2026-11-01T00:00:00.000Z";

const approvedOpen = {
  status: "Approved",
  is_open_for_bidding: true,
  bid_deadline: future,
};

describe("canRecordProjectDecision", () => {
  it("allows only an approved SK Chairperson", () => {
    expect(canRecordProjectDecision("SK_Chairperson", "approved")).toBe(true);
  });

  it.each([
    ["SK_Treasurer", "approved"],
    ["SK_Chairperson", "pending"],
    ["Admin", "approved"],
    ["Vendor", "approved"],
    [null, "approved"],
  ])("rejects role %s with status %s", (role, status) => {
    expect(canRecordProjectDecision(role, status)).toBe(false);
  });
});

describe("biddingAvailability", () => {
  it("allows an approved project that is open with a future deadline", () => {
    expect(biddingAvailability(approvedOpen, NOW)).toEqual({
      allowed: true,
      reason: null,
    });
    expect(isAcceptingBids(approvedOpen, NOW)).toBe(true);
  });

  it.each(["Proposed", "Rejected", "Awarded", "Completed", "Evaluation"])(
    "rejects a %s project with the unapproved message",
    (status) => {
      expect(
        biddingAvailability({ ...approvedOpen, status }, NOW),
      ).toMatchObject({
        allowed: false,
        reason: BIDDING_NOT_APPROVED_MESSAGE,
      });
    },
  );

  it("rejects an approved project that was never opened", () => {
    expect(
      biddingAvailability(
        { ...approvedOpen, is_open_for_bidding: false },
        NOW,
      ).allowed,
    ).toBe(false);
  });

  it("rejects an approved project without a deadline", () => {
    expect(
      biddingAvailability({ ...approvedOpen, bid_deadline: null }, NOW).reason,
    ).toBe("This project does not have a valid bidding deadline.");
  });

  it("rejects an approved project whose deadline passed", () => {
    expect(
      biddingAvailability({ ...approvedOpen, bid_deadline: past }, NOW).reason,
    ).toBe("The bidding deadline for this project has passed.");
  });
});

describe("approval lifecycle helpers", () => {
  it("only approves a Proposed project for bidding", () => {
    expect(canPublishForBidding({ status: "Approved" })).toBe(true);
    expect(canPublishForBidding({ status: "Proposed" })).toBe(false);
    expect(canPublishForBidding({ status: "Rejected" })).toBe(false);
    expect(isProjectApproved({ status: "approved" })).toBe(true);
  });

  it("labels an approved open project as Open for Bidding", () => {
    expect(projectDisplayStatus(approvedOpen)).toBe("Open for Bidding");
    expect(projectDisplayStatus({ ...approvedOpen, is_open_for_bidding: false })).toBe(
      "Approved",
    );
    expect(projectDisplayStatus({ status: "Rejected" })).toBe("Rejected");
    expect(projectDisplayStatus({ status: null })).toBe("Proposed");
  });
});
