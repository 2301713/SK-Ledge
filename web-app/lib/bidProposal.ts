export const PROPOSAL_BUCKET = "proposals";
export const PROPOSAL_MAX_BYTES = 10 * 1024 * 1024;
export const PROPOSAL_URL_PREFIX = "/api/bids/proposal?path=";
export const PROPOSAL_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const STORAGE_PATH_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[A-Za-z0-9._-]{1,120}$/i;

export function isValidProposalStoragePath(path: string): boolean {
  return STORAGE_PATH_RE.test(path);
}

export function buildProposalUrl(path: string): string {
  return `${PROPOSAL_URL_PREFIX}${encodeURIComponent(path)}`;
}

/** Returns the storage path for an app-issued proposal URL, or null. */
export function parseProposalUrl(value: string): string | null {
  if (!value.startsWith(PROPOSAL_URL_PREFIX)) {
    return null;
  }

  try {
    const path = decodeURIComponent(value.slice(PROPOSAL_URL_PREFIX.length));
    return isValidProposalStoragePath(path) ? path : null;
  } catch {
    return null;
  }
}

export function sanitizeProposalFileName(name: string): string {
  const cleaned = name
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^[.-]+/, "")
    .slice(-120);

  return cleaned || "proposal";
}
