export { default as postcss } from "https://deno.land/x/postcss@8.3.11/mod.js";
export { default as postcssImport } from "https://deno.land/x/postcss_import@0.1.4/mod.js";
export { default as postcssNesting } from "https://cdn.jsdelivr.net/gh/csstools/postcss-nesting@9.0.0/mod.js";
export { default as autoprefixer } from "https://deno.land/x/postcss_autoprefixer@0.1.1/mod.js";

export interface SourceMapOptions {
  inline?: boolean
  prev?: string | boolean | object | ((file: string) => string)
  sourcesContent?: boolean
  annotation?: string | boolean | ((file: string, root: any) => string)
  from?: string
  absolute?: boolean
}
