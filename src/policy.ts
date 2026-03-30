export type PolicyResult =
  | { level: "ok" }
  | { level: "warning"; reason: string }
  | { level: "error"; reason: string };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function evaluateAccountPolicy(
  email: string | null,
  allowedEmails: string[],
): PolicyResult {
  if (!email) {
    return {
      level: "warning",
      reason: "No cached Cursor email found (signed out or storage changed).",
    };
  }

  const norm = normalizeEmail(email);
  const allowed = allowedEmails.map((e) => normalizeEmail(e)).filter(Boolean);
  if (allowed.length > 0 && !allowed.includes(norm)) {
    return {
      level: "error",
      reason: `Email is not in the configured allow list (${norm}).`,
    };
  }

  return { level: "ok" };
}
