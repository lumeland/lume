export { default as markdownIt, type MarkdownItOptions } from "markdown-it";
export { default as markdownItAttrs } from "markdown-it-attrs";
// @ts-expect-error no types for markdown-it-deflist
export { default as markdownItDeflist } from "markdown-it-deflist";

import type { MarkdownIt } from "markdown-it";

export type MarkdownItPlugin<Params extends unknown[] = unknown[]> = (
  md: MarkdownIt,
  ...params: Params
) => void;
