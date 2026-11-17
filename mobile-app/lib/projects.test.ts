import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import {
  bidStatusGroup,
  bidStatusLabel,
  canWithdrawBid,
  daysLeftLabel,
  formatDate,
  formatPeso,
  getDaysLeft,
  getErrorMessage,
  toProject,
  uniqueCategories,
  type Project,
  type ProjectRow,
} from "./projects";

const DAY_MS = 24 * 60 * 60 * 1000;

function projectRow(overrides: Partial<ProjectRow> = {}): ProjectRow {
  return {
    id: "project-1",
    name: "Barangay Health Center",
    category: "Infrastructure",
    budget: "250000.00",
    status: "Open",
    location: null,
    barangay: "Adia, Agoncillo",
    description: null,
    bid_deadline: new Date(Date.now() + 5 * DAY_MS).toISOString(),
    is_open_for_bidding: true,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("formatPeso", () => {
  it("formats numeric strings as pesos", () => {
    expect(formatPeso("250000")).toBe("₱250,000");
  });

  it("formats numbers with up to two decimals", () => {
    expect(formatPeso(1234.567)).toBe("₱1,234.57");
  });

  it("falls back to zero for nullish values", () => {
    expect(formatPeso(null)).toBe("₱0");
    expect(formatPeso(undefined)).toBe("₱0");
  });
});

describe("formatDate", () => {
  it("renders a dash for missing values", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("returns the raw value when it is not a date", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });

  it("formats a valid date", () => {
    expect(formatDate("2026-03-15T00:00:00.000Z")).toMatch(/Mar 1[45], 2026/);
  });
});

describe("getDaysLeft", () => {
  it("returns null for a missing or invalid deadline", () => {
    expect(getDaysLeft(null)).toBeNull();
    expect(getDaysLeft("nope")).toBeNull();
  });

  it("rounds a future deadline up to whole days", () => {
    expect(getDaysLeft(new Date(Date.now() + 2.5 * DAY_MS).toISOString())).toBe(3);
  });

  it("returns a negative number for a passed deadline", () => {
    expect(
      getDaysLeft(new Date(Date.now() - 2 * DAY_MS).toISOString()),
    ).toBe(-2);
  });
});

describe("toProject", () => {
  it("normalizes a project row", () => {
    const project = toProject(projectRow());

    expect(project).toMatchObject({
      id: "project-1",
      name: "Barangay Health Center",
      category: "Infrastructure",
      location: "Adia, Agoncillo",
      budget: 250000,
      status: "Open",
      acceptingBids: true,
    });
  });

  it("uses defaults for missing optional fields", () => {
    const project = toProject(
      projectRow({
        category: null,
        location: null,
        barangay: null,
        status: null,
        bid_deadline: null,
      }),
    );

    expect(project.category).toBe("General");
    expect(project.location).toBe("Batangas");
    expect(project.status).toBe("Open");
    expect(project.daysLeft).toBeNull();
  });

  it("stops accepting bids when the flag is off", () => {
    expect(toProject(projectRow({ is_open_for_bidding: false })).acceptingBids).toBe(
      false,
    );
  });

  it.each(["Awarded", "evaluation", "AWARDED"])(
    "stops accepting bids when the status is %s",
    (status) => {
      expect(toProject(projectRow({ status })).acceptingBids).toBe(false);
    },
  );

  it("stops accepting bids after the deadline", () => {
    const project = toProject(
      projectRow({
        bid_deadline: new Date(Date.now() - DAY_MS).toISOString(),
      }),
    );

    expect(project.acceptingBids).toBe(false);
  });

  it("treats a missing deadline as open-ended", () => {
    const project = toProject(projectRow({ bid_deadline: null }));

    expect(project.acceptingBids).toBe(true);
    expect(project.daysLeft).toBeNull();
  });
});

describe("daysLeftLabel", () => {
  const baseProject: Project = {
    id: "p",
    name: "P",
    category: "General",
    location: "Batangas",
    description: "",
    budget: 1,
    deadline: null,
    createdAt: null,
    status: "Awarded",
    acceptingBids: false,
    daysLeft: null,
    winningBidder: null,
  };

  it("shows the status when bids are closed", () => {
    expect(daysLeftLabel(baseProject)).toBe("Awarded");
  });

  it("describes an open-ended project", () => {
    expect(
      daysLeftLabel({ ...baseProject, acceptingBids: true, status: "Open" }),
    ).toBe("Open for bids");
  });

  it("marks a deadline that closes today", () => {
    expect(
      daysLeftLabel({ ...baseProject, acceptingBids: true, daysLeft: 0 }),
    ).toBe("Closing today");
  });

  it("counts down remaining days", () => {
    expect(
      daysLeftLabel({ ...baseProject, acceptingBids: true, daysLeft: 4 }),
    ).toBe("Closes in 4d");
  });
});

describe("bid status mapping", () => {
  it.each([
    ["pending", "Pending"],
    ["recommended", "Pending"],
    ["won", "Won"],
    ["awarded", "Won"],
    ["lost", "Lost"],
    ["rejected", "Lost"],
    ["declined", "Lost"],
    ["withdrawn", "Withdrawn"],
    ["  PENDING  ", "Pending"],
    [null, "Pending"],
    [undefined, "Pending"],
  ])("groups %j as %s", (status, group) => {
    expect(bidStatusGroup(status)).toBe(group);
  });

  it("keeps the recommended label distinct", () => {
    expect(bidStatusLabel("recommended")).toBe("Recommended");
  });

  it("falls back to the status group label otherwise", () => {
    expect(bidStatusLabel("won")).toBe("Won");
    expect(bidStatusLabel(null)).toBe("Pending");
  });

  it.each([
    ["pending", true],
    ["recommended", true],
    ["won", false],
    ["lost", false],
    ["withdrawn", false],
    [null, false],
  ])("allows withdrawal for %j: %s", (status, allowed) => {
    expect(canWithdrawBid(status)).toBe(allowed);
  });
});

describe("uniqueCategories", () => {
  it("deduplicates, trims, drops blanks, and sorts", () => {
    const categories = uniqueCategories([
      { ...toProject(projectRow()), category: "Infrastructure" },
      { ...toProject(projectRow()), category: " Education " },
      { ...toProject(projectRow()), category: "Infrastructure" },
      { ...toProject(projectRow()), category: "   " },
    ]);

    expect(categories).toEqual(["Education", "Infrastructure"]);
  });
});

describe("getErrorMessage", () => {
  it("prefers an Error message", () => {
    expect(getErrorMessage(new Error("boom"), "fallback")).toBe("boom");
  });

  it("uses a non-empty string", () => {
    expect(getErrorMessage("  boom  ", "fallback")).toBe("  boom  ");
  });

  it("falls back for empty values", () => {
    expect(getErrorMessage("   ", "fallback")).toBe("fallback");
    expect(getErrorMessage(null, "fallback")).toBe("fallback");
    expect(getErrorMessage({}, "fallback")).toBe("fallback");
  });
});
