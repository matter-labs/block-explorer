// Single source of truth for public routes in the application
// These routes are accessible without authentication and don't show the header/footer
export const PUBLIC_ROUTES = ["/login", "/not-authorized", "/reviewing-permissions"] as const;

// Type for public route paths
export type PublicRoutePath = (typeof PUBLIC_ROUTES)[number];
