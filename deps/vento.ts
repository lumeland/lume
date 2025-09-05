export { default as engine } from "https://deno.land/x/vento@v2.0.1/mod.ts";
export { default as autotrim } from "https://deno.land/x/vento@v2.0.1/plugins/auto_trim.ts";
export {
  stringifyError,
  VentoError,
} from "https://deno.land/x/vento@v2.0.1/core/errors.ts";

export type {
  Environment,
  Loader,
  Plugin,
} from "https://deno.land/x/vento@v2.0.1/core/environment.ts";
export type { Token } from "https://deno.land/x/vento@v2.0.1/core/tokenizer.ts";
