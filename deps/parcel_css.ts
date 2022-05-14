export {
  default,
  transform,
  transformStyleAttribute,
} from "https://unpkg.com/@parcel/css-wasm@1.8.3/index.js";

/**
 * Types from /index.d.ts
 */
export interface TransformOptions {
  /** The filename being transformed. Used for error messages and source maps. */
  filename: string;
  /** The source code to transform. */
  code: Uint8Array;
  /** Whether to enable minification. */
  minify?: boolean;
  /** Whether to output a source map. */
  sourceMap?: boolean;
  /** The browser targets for the generated code. */
  targets?: Targets;
  /** Whether to enable various draft syntax. */
  drafts?: Drafts;
  /** Whether to compile this file as a CSS module. */
  cssModules?: boolean;
  /**
   * Whether to analyze dependencies (e.g. `@import` and `url()`).
   * When enabled, `@import` rules are removed, and `url()` dependencies
   * are replaced with hashed placeholders that can be replaced with the final
   * urls later (after bundling). Dependencies are returned as part of the result.
   */
  analyzeDependencies?: boolean;
  /**
   * Replaces user action pseudo classes with class names that can be applied from JavaScript.
   * This is useful for polyfills, for example.
   */
  pseudoClasses?: PseudoClasses;
  /**
   * A list of class names, ids, and custom identifiers (e.g. @keyframes) that are known
   * to be unused. These will be removed during minification. Note that these are not
   * selectors but individual names (without any . or # prefixes).
   */
  unusedSymbols?: string[];
}

export interface PseudoClasses {
  hover?: string;
  active?: string;
  focus?: string;
  focusVisible?: string;
  focusWithin?: string;
}

export interface Drafts {
  /** Whether to enable CSS nesting. */
  nesting?: boolean;
  /** Whether to enable @custom-media rules. */
  customMedia?: boolean;
}

export interface Targets {
  android?: number;
  chrome?: number;
  edge?: number;
  firefox?: number;
  ie?: number;
  ios_saf?: number;
  opera?: number;
  safari?: number;
  samsung?: number;
}
