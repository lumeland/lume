export * from "https://esm.sh/liquidjs@9.35.0";

export interface LiquidOptions {
  /** A directory or an array of directories from where to resolve layout and include templates, and the filename passed to `.renderFile()`. If it's an array, the files are looked up in the order they occur in the array. Defaults to `["."]` */
  root?: string | string[];
  /** Add a extname (if filepath doesn't include one) before template file lookup. Eg: setting to `".html"` will allow including file by basename. Defaults to `""`. */
  extname?: string;
  /** Whether or not to cache resolved templates. Defaults to `false`. */
  cache?: boolean;
  /** Use Javascript Truthiness. Defaults to `false`. */
  jsTruthy?: boolean;
  /** If set, treat the `filepath` parameter in `{%include filepath %}` and `{%layout filepath%}` as a variable, otherwise as a literal value. Defaults to `true`. */
  dynamicPartials?: boolean;
  /** Whether or not to assert filter existence. If set to `false`, undefined filters will be skipped. Otherwise, undefined filters will cause an exception. Defaults to `false`. */
  strictFilters?: boolean;
  /** Whether or not to assert variable existence.  If set to `false`, undefined variables will be rendered as empty string.  Otherwise, undefined variables will cause an exception. Defaults to `false`. */
  strictVariables?: boolean;
  /** Modifies the behavior of `strictVariables`. If set, a single undefined variable will *not* cause an exception in the context of the `if`/`elsif`/`unless` tag and the `default` filter. Instead, it will evaluate to `false` and `null`, respectively. Irrelevant if `strictVariables` is not set. Defaults to `false`. **/
  lenientIf?: boolean;
  /** JavaScript timezoneOffset for `date` filter, default to local time. That means if you're in Australia (UTC+10), it'll default to -600 */
  timezoneOffset?: number;
  /** Strip blank characters (including ` `, `\t`, and `\r`) from the right of tags (`{% %}`) until `\n` (inclusive). Defaults to `false`. */
  trimTagRight?: boolean;
  /** Similar to `trimTagRight`, whereas the `\n` is exclusive. Defaults to `false`. See Whitespace Control for details. */
  trimTagLeft?: boolean;
  /** Strip blank characters (including ` `, `\t`, and `\r`) from the right of values (`{{ }}`) until `\n` (inclusive). Defaults to `false`. */
  trimOutputRight?: boolean;
  /** Similar to `trimOutputRight`, whereas the `\n` is exclusive. Defaults to `false`. See Whitespace Control for details. */
  trimOutputLeft?: boolean;
  /** The left delimiter for liquid tags. **/
  tagDelimiterLeft?: string;
  /** The right delimiter for liquid tags. **/
  tagDelimiterRight?: string;
  /** The left delimiter for liquid outputs. **/
  outputDelimiterLeft?: string;
  /** The right delimiter for liquid outputs. **/
  outputDelimiterRight?: string;
  /** Whether input strings to date filter preserve the given timezone **/
  preserveTimezones?: boolean;
  /** Whether `trim*Left`/`trim*Right` is greedy. When set to `true`, all consecutive blank characters including `\n` will be trimed regardless of line breaks. Defaults to `true`. */
  greedy?: boolean;
  /** the global environment passed down to all partial templates, i.e. templates included by `include`, `layout` and `render` tags. */
  globals?: Record<string, unknown>;
  /** Whether or not to keep value type when writing the Output, not working for streamed rendering. Defaults to `false`. */
  keepOutputType?: boolean;
  /** Respect parameter order when using filters like "for ... reversed limit", Defaults to `false`. */
  orderedFilterParameters?: boolean;
}
