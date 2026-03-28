export type PolicyResult =
  | { level: "ok" }
  | { level: "warning"; reason: string }
  | { level: "error"; reason: string };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function domainOf(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) {
    return null;
  }
  return email
    .slice(at + 1)
    .trim()
    .toLowerCase();
}

export function evaluateAccountPolicy(
  email: string | null,
  flaggedDomains: string[],
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
      reason: `Email is not in cursorLoggedUser.allowedEmails (${norm}).`,
    };
  }

  const domain = domainOf(norm);
  const flagged = flaggedDomains
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  if (domain && flagged.some((f) => domain === f || domain.endsWith(`.${f}`))) {
    return {
      level: "error",
      reason: `Email domain matches a flagged domain (@${domain}).`,
    };
  }

  return { level: "ok" };
}
