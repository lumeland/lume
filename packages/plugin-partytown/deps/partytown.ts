export { partytownSnippet } from "@qwik.dev/partytown/integration";

export type { PartytownConfig } from "@qwik.dev/partytown/integration";

export function getLibFiles(debug?: boolean) {
  const index = import.meta.resolve(`@qwik.dev/partytown`);
  return index.replace(/index\.mjs$/, debug ? "lib/**/*.js" : "lib/*.js");
}
