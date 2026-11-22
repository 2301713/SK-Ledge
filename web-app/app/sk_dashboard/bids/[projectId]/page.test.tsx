// @vitest-environment jsdom

import { Suspense } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  createSupabaseMockState,
  type SupabaseMockState,
} from "@/test-utils/supabaseMock";

const mockRef = vi.hoisted(() => ({
  state: null as unknown as SupabaseMockState,
  nav: { push: vi.fn(), replace: vi.fn() },
  address: "0x2222222222222222222222222222222222222222" as `0x${string}`,
  isAuthorizedOfficial: true,
  isAuthorizedForBarangay: true,
  writeContract: vi.fn(),
  resetWrite: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mockRef.nav,
  usePathname: () => "/sk_dashboard/bids/7",
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: mockRef.address }),
  useReadContract: (config: { functionName?: string }) => {
    if (config.functionName === "isAuthorizedOfficial") {
      return { data: mockRef.isAuthorizedOfficial };
    }
    if (config.functionName === "isOfficialAuthorizedForBarangay") {
      return { data: mockRef.isAuthorizedForBarangay };
    }
    return { data: undefined };
  },
  useWriteContract: () => ({
    data: undefined,
    writeContract: mockRef.writeContract,
    isPending: false,
    error: null,
    reset: mockRef.resetWrite,
  }),
  useWaitForTransactionReceipt: () => ({ isSuccess: false, error: null }),
}));

vi.mock("@/lib/syncRecord", () => ({
  syncRecord: vi.fn(async () => ({ data: null })),
}));

vi.mock("@/components/dashboard/SideBar", () => ({ default: () => null }));
vi.mock("@/components/dashboard/ui/TopBar", () => ({ default: () => null }));

vi.mock("@/lib/supabase", async () => {
  const { buildSupabaseBrowserModule } = await import(
    "@/test-utils/supabaseBrowserMock"
  );
  return buildSupabaseBrowserModule(mockRef);
});

import BidsPage from "./page";

async function renderPage() {
  // `use(params)` suspends, so the first render is the Suspense fallback.
  await act(async () => {
    render(
      <Suspense fallback={<div>Loading project…</div>}>
        <BidsPage params={Promise.resolve({ projectId: "7" })} />
      </Suspense>,
    );
  });
}

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
      id: "7",
      name: "Barangay Sports Fest",
      location: "Adia",
      status: "Approved",
      award_tx_hash: null,
    },
  ];
  state.rows.bids = [
    {
      id: "bid-1",
      project_id: "7",
      vendor_id: "vendor-1",
      vendor_name: "ABC Trading",
      amount_php: 100000,
      timeline: "30 days",
      notes: null,
      proposal_path: null,
      proposal_url: null,
      status: "recommended",
      created_at: "2026-11-01T00:00:00.000Z",
    },
  ];

  mockRef.isAuthorizedOfficial = true;
  mockRef.isAuthorizedForBarangay = true;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SK bid award page guards", () => {
  it("redirects away from a project belonging to another barangay", async () => {
    mockRef.state.rows.projects[0].location = "Bagong Sikat, Agoncillo";

    await renderPage();

    await waitFor(() =>
      expect(mockRef.nav.replace).toHaveBeenCalledWith(
        "/sk_dashboard/projects",
      ),
    );
  });

  it("stays on a project in the official's own barangay", async () => {
    await renderPage();

    expect(
      await screen.findByText(/Bids for: Barangay Sports Fest/),
    ).toBeTruthy();
    expect(mockRef.nav.replace).not.toHaveBeenCalled();
  });

  it("writes the award with the canonical project barangay when both authorizations are present", async () => {
    await renderPage();

    fireEvent.click(
      await screen.findByRole("button", { name: /award winner/i }),
    );

    expect(mockRef.writeContract).toHaveBeenCalledTimes(1);
    expect(mockRef.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "addRecord",
        args: [
          "Adia, Agoncillo",
          BigInt(10000000),
          "Award: Barangay Sports Fest to ABC Trading",
          "Award",
        ],
      }),
    );
  });

  it("refuses to sign when the wallet is not authorized for the project barangay", async () => {
    mockRef.isAuthorizedForBarangay = false;

    await renderPage();

    fireEvent.click(
      await screen.findByRole("button", { name: /award winner/i }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(
      "not authorized for Adia, Agoncillo",
    );
    expect(mockRef.writeContract).not.toHaveBeenCalled();
  });
});
