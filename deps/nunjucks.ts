export { default } from "https://deno.land/x/nunjucks@3.2.3/mod.js";

export interface NunjucksOptions {
  /** Controls if output with dangerous characters are escaped automatically. */
  autoescape: boolean;

  /** Throw errors when outputting a null/undefined value */
  throwOnUndefined: boolean;

  /** Automatically remove trailing newlines from a block/tag */
  trimBlocks: boolean;

  /** Automatically remove leading whitespace from a block/tag */
  lstripBlocks: boolean;
}
