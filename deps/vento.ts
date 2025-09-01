export { default as engine } from "https://deno.land/x/vento@v2.0.0/mod.ts";
export { default as autotrim } from "https://deno.land/x/vento@v2.0.0/plugins/auto_trim.ts";
export { stringifyError, VentoError } from "https://deno.land/x/vento@v2.0.0/core/errors.ts";

export type {
  Environment,
  Loader,
  Plugin,
} from "https://deno.land/x/vento@v2.0.0/core/environment.ts";
export type { Token } from "https://deno.land/x/vento@v2.0.0/core/tokenizer.ts";
