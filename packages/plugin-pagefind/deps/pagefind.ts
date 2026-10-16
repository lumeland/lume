export * as pagefind from "pagefind";
export type { CustomRecord } from "pagefind";

export function getAssets() {
  return {
    js: import.meta.resolve("@pagefind/component-ui"),
    css: import.meta.resolve("@pagefind/component-ui/css"),
  };
}
