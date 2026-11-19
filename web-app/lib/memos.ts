export const MEMO_PRIORITIES = ["standard", "urgent", "event"] as const;
export const MEMO_AUDIENCES = [
  "all",
  "chairpersons",
  "treasurers",
  "barangays",
] as const;

export type MemoPriority = (typeof MEMO_PRIORITIES)[number];
export type MemoAudience = (typeof MEMO_AUDIENCES)[number];

export const MEMO_PRIORITY_LABELS: Record<MemoPriority, string> = {
  standard: "Standard",
  urgent: "Urgent",
  event: "Event",
};

export const MEMO_AUDIENCE_LABELS: Record<MemoAudience, string> = {
  all: "All Federation Officials",
  chairpersons: "SK Chairpersons",
  treasurers: "SK Treasurers",
  barangays: "Barangays",
};

export const MEMO_SUBJECT_MAX_LENGTH = 200;
export const MEMO_BODY_MAX_LENGTH = 5000;

export interface FederationMemo {
  id: string;
  sender_id?: string | null;
  subject: string;
  body: string;
  priority: MemoPriority;
  audience: MemoAudience;
  created_at: string;
}

export function isMemoPriority(value: unknown): value is MemoPriority {
  return (
    typeof value === "string" &&
    (MEMO_PRIORITIES as readonly string[]).includes(value)
  );
}

export function isMemoAudience(value: unknown): value is MemoAudience {
  return (
    typeof value === "string" &&
    (MEMO_AUDIENCES as readonly string[]).includes(value)
  );
}

export function normalizeMemoText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Returns a user-facing error, or null when the memo is valid. */
export function validateMemo(
  subject: unknown,
  body: unknown,
  priority: unknown,
  audience: unknown,
): string | null {
  const normalizedSubject = normalizeMemoText(subject);
  if (normalizedSubject.length === 0) {
    return "A subject is required.";
  }
  if (normalizedSubject.length > MEMO_SUBJECT_MAX_LENGTH) {
    return `Subject must be ${MEMO_SUBJECT_MAX_LENGTH} characters or fewer.`;
  }

  const normalizedBody = normalizeMemoText(body);
  if (normalizedBody.length === 0) {
    return "A message body is required.";
  }
  if (normalizedBody.length > MEMO_BODY_MAX_LENGTH) {
    return `Message body must be ${MEMO_BODY_MAX_LENGTH} characters or fewer.`;
  }

  if (!isMemoPriority(priority)) {
    return "Select a valid memo priority.";
  }

  if (!isMemoAudience(audience)) {
    return "Select a valid audience.";
  }

  return null;
}
