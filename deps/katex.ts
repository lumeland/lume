import katex, { type KatexOptions as BaseOptions } from "npm:katex@0.16.20";

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
