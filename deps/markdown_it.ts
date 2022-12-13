export { default as markdownIt } from "npm:markdown-it@13.0.1";
export { default as markdownItAttrs } from "npm:markdown-it-attrs@4.1.6";
export { default as markdownItDeflist } from "npm:markdown-it-deflist@2.1.0";

export interface MarkdownItOptions {
  /** Set `true` to enable HTML tags in source */
  html?: boolean;

  /**
   * Use '/' to close single tags (<br />).
   * This is only for full CommonMark compatibility.
   */
  xhtmlOut?: boolean;

  /** Convert '\n' in paragraphs into <br> */
  breaks?: boolean;

  /**
   * CSS language prefix for fenced blocks.
   * Can be useful for external highlighters.
   */
  langPrefix?: string;

  /** Autoconvert URL-like text to links */
  linkify?: boolean;

  /** Enable some language-neutral replacement + quotes beautification */
  typographer?: boolean;

  /**
   * Double + single quotes replacement pairs, when typographer enabled,
   * and smartquotes on. Could be either a String or an Array.
   * For example, you can use '«»„“' for Russian, '„“‚‘' for German,
   * and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
   */
  quotes?: string | string[];

  /**
   * Highlighter function. Should return escaped HTML,
   * or '' if the source string is not changed and should be escaped externally.
   * If result starts with <pre... internal wrapper is skipped.
   */
  highlight?: (str: string, lang: string) => string | null;
}
