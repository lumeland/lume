/**
 * Code generated from:
 *
 * ```ts
 * import { getCompatibleVersions } from "npm:baseline-browser-mapping@2.4.4";
 *
 * const results = getCompatibleVersions({
 *   widelyAvailableOnDate: "2025-05-07", // Lume 3.0.0 release date
 * });
 * ```
 *
 * Not run directly to avoid importing this package that requires read access.
 */
export const browsers = {
  chrome: [107, 0],
  chrome_android: [107, 0],
  edge: [107, 0],
  firefox: [104, 0],
  firefox_android: [104, 0],
  safari: [16, 0],
  safari_ios: [16, 0],
} as Record<string, [number, number]>;

export function version(browser: [number, number]): number {
  return (browser[0] << 16) | (browser[1] << 8);
}
export function versionString(browser: [number, number]): string {
  return `${browser[0]}.${browser[1]}`;
}
