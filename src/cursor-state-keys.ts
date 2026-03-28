/**
 * Cursor stores session fields in globalStorage/state.vscdb → table ItemTable (key TEXT, value BLOB).
 * These keys are undocumented and may change in future Cursor releases.
 *
 * Do not read token keys (e.g. cursorAuth/accessToken) from this extension.
 */
export const KEYS = {
  cachedEmail: "cursorAuth/cachedEmail",
  stripeMembershipType: "cursorAuth/stripeMembershipType",
  stripeSubscriptionStatus: "cursorAuth/stripeSubscriptionStatus",
  cachedSignUpType: "cursorAuth/cachedSignUpType",
} as const;
