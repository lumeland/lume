export { default as katex } from "katex";
import "katex/contrib/mhchem";

import type { KatexOptions as BaseOptions } from "katex";

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

export function getAssetPath(file: string) {
  return import.meta.resolve(`katex/dist/${file}`);
}
