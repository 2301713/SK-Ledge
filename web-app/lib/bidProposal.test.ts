import { describe, expect, it } from "vitest";
import {
  buildProposalUrl,
  isValidProposalStoragePath,
  parseProposalUrl,
  sanitizeProposalFileName,
  PROPOSAL_URL_PREFIX,
} from "./bidProposal";

const OWNER_ID = "11111111-1111-4111-8111-111111111111";
const FILE_ID = "22222222-2222-4222-8222-222222222222";
const VALID_PATH = `${OWNER_ID}/${FILE_ID}-proposal.pdf`;

describe("isValidProposalStoragePath", () => {
  it("accepts an app-generated storage path", () => {
    expect(isValidProposalStoragePath(VALID_PATH)).toBe(true);
  });

  it.each([
    ["", "empty string"],
    ["proposal.pdf", "missing owner folder"],
    [`${OWNER_ID}/proposal.pdf`, "missing file uuid"],
    [`${OWNER_ID}/../secrets.pdf`, "path traversal"],
    [`${OWNER_ID}/${FILE_ID}-`, "empty file name"],
    [`${OWNER_ID}/${FILE_ID}-name with spaces.pdf`, "spaces"],
    [`${OWNER_ID}/${FILE_ID}-${"a".repeat(121)}.pdf`, "name over 120 chars"],
    [`owner/${FILE_ID}-proposal.pdf`, "non-uuid owner"],
    [`${OWNER_ID}/${FILE_ID}-proposal.pdf/extra`, "nested path"],
  ])("rejects %s (%s)", (path) => {
    expect(isValidProposalStoragePath(path)).toBe(false);
  });
});

describe("buildProposalUrl / parseProposalUrl", () => {
  it("round-trips a valid storage path", () => {
    const url = buildProposalUrl(VALID_PATH);

    expect(url.startsWith(PROPOSAL_URL_PREFIX)).toBe(true);
    expect(parseProposalUrl(url)).toBe(VALID_PATH);
  });

  it("encodes the path so one query parameter carries it", () => {
    const path = `${OWNER_ID}/${FILE_ID}-proposal.pdf`;
    const url = buildProposalUrl(path);

    expect(url).toContain("%2F");
    expect(url.split("?path=")[1]).not.toContain("/");
    expect(parseProposalUrl(url)).toBe(path);
  });

  it.each([
    ["https://example.com/proposal.pdf", "external URL"],
    [`${PROPOSAL_URL_PREFIX}`, "prefix with no path"],
    [`${PROPOSAL_URL_PREFIX}${encodeURIComponent("not/a/valid/path")}`, "invalid path"],
    [`${PROPOSAL_URL_PREFIX}%E0%A4%A`, "invalid percent encoding"],
  ])("returns null for %s (%s)", (value) => {
    expect(parseProposalUrl(value)).toBeNull();
  });
});

describe("sanitizeProposalFileName", () => {
  it("keeps safe characters", () => {
    expect(sanitizeProposalFileName("proposal_v2.docx")).toBe(
      "proposal_v2.docx",
    );
  });

  it("replaces unsafe characters", () => {
    expect(sanitizeProposalFileName("my proposal (final).pdf")).toBe(
      "my-proposal-final-.pdf",
    );
  });

  it("strips leading dots and dashes", () => {
    expect(sanitizeProposalFileName(".../etc/passwd")).toBe("etc-passwd");
  });

  it("limits the result to 120 characters", () => {
    expect(sanitizeProposalFileName("a".repeat(500)).length).toBe(120);
  });

  it("falls back to a default when nothing usable remains", () => {
    expect(sanitizeProposalFileName("///")).toBe("proposal");
  });
});
