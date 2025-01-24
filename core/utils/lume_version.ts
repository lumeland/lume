/** Return the current installed version */
export function getCurrentVersion(
  url = new URL(import.meta.resolve("../")),
): string {
  const { pathname } = url;
  return pathname.match(/@([^/]+)/)?.[1] ?? `local (${pathname})`;
}

/** Return the Lume generator value (for <meta>, Feed, etc) */
export function getGenerator() {
  const version = getCurrentVersion();

  if (version.startsWith("local")) {
    return "Lume";
  }

  return `Lume ${version}`;
}
