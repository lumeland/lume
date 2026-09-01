export {
  default as markdownIt,
  type MarkdownItOptions,
} from "npm:markdown-it@15.0.1";
export { default as markdownItAttrs } from "npm:markdown-it-attrs@5.0.1";
export { default as markdownItDeflist } from "npm:markdown-it-deflist@4.0.0";

import { MarkdownIt } from "npm:markdown-it@15.0.1";

export type MarkdownItPlugin<Params extends unknown[] = unknown[]> = (
  md: MarkdownIt,
  ...params: Params
) => void;
