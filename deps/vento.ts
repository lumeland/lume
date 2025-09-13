export { default as engine } from "https://deno.land/x/vento@v2.0.2/mod.ts";
export { default as autotrim } from "https://deno.land/x/vento@v2.0.2/plugins/auto_trim.ts";
export {
  SourceError,
  stringifyError,
  VentoError,
} from "https://deno.land/x/vento@v2.0.2/core/errors.ts";

export type {
  Environment,
  Loader,
  Plugin,
} from "https://deno.land/x/vento@v2.0.2/core/environment.ts";
export type { Token } from "https://deno.land/x/vento@v2.0.2/core/tokenizer.ts";
