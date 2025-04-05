import katex, { type KatexOptions as BaseOptions } from "npm:katex@0.16.21";

export const assetsUrl = "https://cdn.jsdelivr.net/npm/katex@0.16.21/dist";

export { katex };

/**
 * Auto-render specific options
 */

interface Delimiter {
  left: string;
  right: string;
  display?: boolean | undefined;
}

export interface KatexOptions extends BaseOptions {
  delimiters?: Delimiter[] | undefined;
  ignoredTags?: string[] | undefined;
  ignoredClasses?: string[] | undefined;
  preProcess?: ((math: string) => string) | undefined;
}
