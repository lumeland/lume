export { default } from "https://jspm.dev/highlight.js@11.2.0";

/** Options of the code highlighter */
export interface HighlightOptions {
  ignoreUnescapedHTML: boolean;

  /** A regex to configure which CSS classes are to be skipped completely. **/
  noHighlightRe: RegExp;

  /** A regex to configure how CSS class names map to language */
  languageDetectRe: RegExp;

  /**
   * A string prefix added before class names in the generated markup,
   * used for backwards compatibility with stylesheets.
   */
  classPrefix: string;

  /** A CSS selector to configure which elements are affected */
  cssSelector: string;

  /** An array of language names and aliases restricting auto detection to only these languages. */
  languages: unknown;
}
