import removeMarkdown from "npm:remove-markdown@0.6.0";

export function plainText(md: string, options?: RemoveMarkdownOptions): string {
  return removeMarkdown(md, options).replaceAll(/\s+/g, " ").trim();
}

export interface RemoveMarkdownOptions {
  /** strip list leaders (default: true) */
  stripListLeaders?: boolean;

  /** char to insert instead of stripped list leaders (default: '') */
  listUnicodeChar?: string;

  /** support GitHub-Flavored Markdown (default: true) */
  gfm?: boolean;

  /** replace images with alt-text, if present (default: true) */
  useImgAltText: boolean;

  abbr?: boolean;

  /** replace links with URLs instead anchor text (default: false) */
  replaceLinksWithURL?: boolean;
  htmlTagsToSkip?: string[];
}
