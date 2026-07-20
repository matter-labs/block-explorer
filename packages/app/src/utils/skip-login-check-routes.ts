// Single source of truth for routes that skip login check
export const SKIP_LOGIN_CHECK_ROUTES = ["/auth/callback"] as const;

export type SkipLoginCheckRoutePath = (typeof SKIP_LOGIN_CHECK_ROUTES)[number];
