// Only same-origin relative paths are allowed, so a redirect can't run `javascript:` or leave the app's origin.
export function isValidRedirectPath(path: unknown): path is string {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return false;
  }
  try {
    return new URL(path, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}
