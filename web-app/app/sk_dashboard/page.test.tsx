// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import type { UserAccount } from "@/lib/useAuthStore";
import {
  createSupabaseMockState,
  type SupabaseMockState,
} from "@/test-utils/supabaseMock";

const mockRef = vi.hoisted(() => ({
  state: null as unknown as SupabaseMockState,
  nav: { push: vi.fn(), replace: vi.fn() },
  chain: {
    ceiling: undefined as bigint | undefined,
    records: [] as Array<Record<string, unknown>>,
  },
  auth: {
    currentUser: null as unknown as UserAccount,
    isLoading: false,
    setCurrentUser: vi.fn(),
    setIsLoading: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mockRef.nav,
  usePathname: () => "/sk_dashboard",
}));

vi.mock("@/lib/useAuthStore", () => ({
  useAuthStore: () => mockRef.auth,
}));

vi.mock("wagmi", () => ({
  useReadContract: (config: { functionName?: string }) => {
    if (config.functionName === "allocationCeilings") {
      return { data: mockRef.chain.ceiling, isLoading: false };
    }
    if (config.functionName === "getAllRecords") {
      return { data: mockRef.chain.records, isLoading: false };
    }
    return { data: undefined, isLoading: false };
  },
}));

vi.mock("@/components/dashboard/SideBar", () => ({ default: () => null }));
vi.mock("@/components/dashboard/ui/TopBar", () => ({ default: () => null }));

vi.mock("@/lib/supabase", async () => {
  const { buildSupabaseBrowserModule } = await import(
    "@/test-utils/supabaseBrowserMock"
  );
  return buildSupabaseBrowserModule(mockRef);
});

import SKDashboard from "./page";

const official = (barangay: string): UserAccount => ({
  id: "user-1",
  username: "maria",
  full_name: "Maria Santos",
  role_type: "SK_Chairperson",
  barangay,
  email: "maria@example.com",
  approval_status: "approved",
});

beforeEach(() => {
  const state = createSupabaseMockState();
  mockRef.state = state;
  state.authUser = { id: "user-1" };
  state.rows.profiles = [
    {
      id: "user-1",
      username: "maria",
      full_name: "Maria Santos",
      role_type: "SK_Chairperson",
      barangay: "Adia",
      email: "maria@example.com",
      approval_status: "approved",
    },
  ];
  state.rows.projects = [
    {
      id: 7,
      name: "Barangay Sports Fest",
      category: "Sports",
      status: "Pending",
      budget: 50000,
      barangay: "Adia, Agoncillo",
      created_at: "2026-11-01T00:00:00.000Z",
    },
  ];

  mockRef.chain.ceiling = BigInt(200000000);
  mockRef.chain.records = [
    {
      recordType: "Allocation",
      barangay: "Adia, Agoncillo",
      amount: BigInt(100000000),
      voided: false,
    },
    {
      recordType: "Expense",
      barangay: "Adia, Agoncillo",
      amount: BigInt(25000000),
      voided: false,
    },
  ];

  mockRef.auth.currentUser = official("Adia");
  mockRef.auth.isLoading = false;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SK dashboard page scoping", () => {
  it("queries projects for the official's canonical barangay only", async () => {
    render(<SKDashboard />);

    expect(await screen.findByText("Barangay Sports Fest")).toBeTruthy();

    expect(
      mockRef.state.filterCalls.filter((call) => call.table === "projects"),
    ).toEqual([
      {
        table: "projects",
        column: "barangay",
        value: "Adia, Agoncillo",
        mode: "eq",
      },
    ]);
  });

  it("does not query projects when the profile barangay is ambiguous", async () => {
    // "San Jose" names more than one Batangas barangay, so it cannot be
    // canonicalized and the page must not fall back to listing every barangay.
    mockRef.auth.currentUser = official("San Jose");

    render(<SKDashboard />);

    expect(await screen.findByText("No active projects found.")).toBeTruthy();
    expect(
      mockRef.state.filterCalls.filter((call) => call.table === "projects"),
    ).toHaveLength(0);
  });
});
