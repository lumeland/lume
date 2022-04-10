export * from "https://cdn.jsdelivr.net/gh/lumeland/terser-deno@v5.12.1/deno/mod.js";

/** Terser options */
export interface TerserOptions {
  /** Use when minifying an ES6 module. */
  module: boolean;

  /** To compress the code */
  compress: boolean;

  /** Pass false to skip mangling names */
  mangle: boolean;

  /** To generate a source map */
  sourceMap?: {
    filename: string;
    url: string;
  };
}
