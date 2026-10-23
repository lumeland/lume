import { merge } from "@lumeland/core/utils/object.ts";
import { log } from "@lumeland/core/utils/log.ts";

import type { MarkdownIt, StateBlock, StateCore, StateInline, Token } from "../deps/markdown.ts";
import type Site from "@lumeland/core/site.ts";

export interface Options {
  /** The prefix to assign to all ids */
  idPrefix?: string;

  /** The prefix to assign to all references ids */
  referenceIdPrefix?: string;

  /** HTML attributes to the element used for the reference */
  referenceAttrs?: Record<string, string>;

  /**
   * The function to transform the HTML content of the reference.
   * It receives the label and attributes (already propagated with href and id) of the reference as its arguments.
   */
  referenceFn?: (label: string, attrs: Record<string, string>) => string;
}

export const defaults = {
  idPrefix: "fn-",
  referenceIdPrefix: "fnref-",
  referenceAttrs: {
    class: "footnote-ref",
  },
  referenceFn: (label, attrs) =>
    `<sup><a ${Object.entries(attrs)
      .map(([key, value]) => `${key}="${value}"`)
      .join(" ")}>${label}</a></sup>`,
} satisfies Options;

export function markdownFootnotes(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return function (site: Site) {
    site.hooks.addMarkdownItPlugin(markdownItFootnotes, options);
  };
}

export default markdownFootnotes;

interface Footnote {
  id: string;
  label?: string;
  content?: string;
  refId?: string;
  refIds?: string[];
}

function markdownItFootnotes(md: MarkdownIt, options: Required<Options>) {
  const parseLinkLabel = md.helpers.parseLinkLabel;
  const isSpace = md.utils.isSpace;

  md.renderer.rules.footnote_reference = function (tokens, idx) {
    const meta = tokens[idx]?.meta;

    if (!meta) {
      return "";
    }

    const { id, subId } = meta as { id: number; subId: number };
    const attrs = Object.assign({}, options.referenceAttrs, {
      href: `#${options.idPrefix}${id}`,
      id: `${options.referenceIdPrefix}${idSuffix(id, subId)}`,
    } as Record<string, string>);

    const label = subId > 0 ? `${id}:${subId}` : id.toString();
    return options.referenceFn(label, attrs);
  };

  function idSuffix(id: number, subId: number): string {
    return subId > 0 ? `${id}:${subId}` : `${id}`;
  }

  // Process footnote block definition
  function blocks(state: StateBlock, startLine: number, endLine: number, silent: boolean) {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];

    /* Line should be at least 5 characters: [^x]: */
    if (
      start + 4 > max ||
      state.src.charCodeAt(start) !== 0x5b /* [ */ ||
      state.src.charCodeAt(start + 1) !== 0x5e /* ^ */
    ) {
      return false;
    }

    let pos;

    for (pos = start + 2; pos < max; pos++) {
      if (state.src.charCodeAt(pos) === 0x20) {
        return false;
      }
      if (state.src.charCodeAt(pos) === 0x5d /* ] */) {
        break;
      }
    }

    // no empty footnote labels
    if (pos === start + 2) {
      return false;
    }

    if (pos + 1 >= max || state.src.charCodeAt(++pos) !== 0x3a /* : */) {
      return false;
    }

    if (silent) {
      return true;
    }

    pos++;

    const footnotes = getFootnotes(state);
    const label = state.src.slice(start + 2, pos - 2);
    const id = footnotes.size + 1;

    const openToken = new state.Token("footnote_reference_open", "", 1);
    openToken.meta = { id };
    openToken.level = state.level++;
    state.tokens.push(openToken);

    footnotes.set(id, { id, label, subId: -1 });

    const oldBMark = state.bMarks[startLine];
    const oldTShift = state.tShift[startLine];
    const oldSCount = state.sCount[startLine];
    const oldParentType = state.parentType;

    const posAfterColon = pos;
    const initial =
      state.sCount[startLine] + pos - (state.bMarks[startLine] + state.tShift[startLine]);
    let offset = initial;

    while (pos < max) {
      const ch = state.src.charCodeAt(pos);

      if (!isSpace(ch)) {
        break;
      }
      if (ch === 0x09) {
        offset += 4 - (offset % 4);
      } else {
        offset++;
      }

      pos++;
    }

    state.tShift[startLine] = pos - posAfterColon;
    state.sCount[startLine] = offset - initial;
    state.bMarks[startLine] = posAfterColon;
    state.blkIndent += 4;
    state.parentType = "footnote";

    if (state.sCount[startLine] < state.blkIndent) {
      state.sCount[startLine] += state.blkIndent;
    }

    state.md.block.tokenize(state, startLine, endLine);

    state.parentType = oldParentType;
    state.blkIndent -= 4;
    state.tShift[startLine] = oldTShift;
    state.sCount[startLine] = oldSCount;
    state.bMarks[startLine] = oldBMark;

    const closeToken = new state.Token("footnote_reference_close", "", -1);
    closeToken.level = --state.level;
    state.tokens.push(closeToken);

    return true;
  }

  // Process inline footnotes (^[...])
  function inlineFootnotes(state: StateInline, silent: boolean) {
    const max = state.posMax;
    const start = state.pos;

    /* Line should be at least 2 characters: ^[ */
    if (
      start + 2 >= max ||
      state.src.charCodeAt(start) !== 0x5e ||
      state.src.charCodeAt(start + 1) !== 0x5b
    ) {
      return false;
    }

    const labelStart = start + 2;
    const labelEnd = parseLinkLabel(state, start + 1);

    // parser failed to find ']', so it's not a valid note
    if (labelEnd < 0) {
      return false;
    }

    // We found the end of the link, and know for a fact it's a valid link;
    // so all that's left to do is to call tokenizer.
    if (!silent) {
      const footnotes = getFootnotes(state);
      const id = footnotes.size + 1;
      const label = id.toString();
      const token = state.push("footnote_reference", "", 0);
      token.meta = { id, label, subId: 0 };

      footnotes.set(id, {
        id,
        subId: 0,
        label,
        content: `<p>${state.src.slice(labelStart, labelEnd)}</p>`,
      });
    }

    state.pos = labelEnd + 1;
    state.posMax = max;
    return true;
  }

  // Process footnote references ([^...])
  function references(state: StateInline, silent: boolean) {
    const max = state.posMax;
    const start = state.pos;

    /* Line should be at least 4 characters: [^x] */
    if (
      start + 3 > max ||
      state.src.charCodeAt(start) !== 0x5b /* [ */ ||
      state.src.charCodeAt(start + 1) !== 0x5e /* ^ */
    ) {
      return false;
    }

    const labelStart = start + 2;
    let labelEnd = 0;

    for (labelEnd = labelStart; labelEnd < max; labelEnd++) {
      const char = state.src.charCodeAt(labelEnd);

      if (char === 0x20 || char === 0x0a) {
        return false;
      }

      if (char === 0x5d /* ] */) {
        break;
      }
    }

    if (labelStart === labelEnd || labelEnd >= max) {
      return false;
    }

    if (!silent) {
      const label = state.src.slice(labelStart, labelEnd);
      const footnote = searchFootnote(state, label);

      if (footnote) {
        const token = state.push("footnote_reference", "", 0);
        footnote.subId++;
        token.meta = { ...footnote };
      }

      if (!footnote) {
        if (state.env.filename) {
          log.error(
            `[markdown-footnotes plugin] Footnote "[^${label}]" not found in the page ${state.env.filename}`,
          );
        } else {
          log.debug(`[markdown-footnotes plugin] Footnote "[^${label}]" not found`);
        }
      }
    }

    state.pos = ++labelEnd;
    state.posMax = max;
    return true;
  }

  // Glue footnote tokens to end of token stream
  function footnote_tail(state: StateCore) {
    const footnotes = getFootnotes(state);

    if (!footnotes.size) {
      return;
    }

    let currentFootnote: FootnoteItem | undefined;
    let currentTokens: Token[] | undefined;

    state.tokens = state.tokens.filter(function (tok) {
      if (tok.type === "footnote_reference_open") {
        currentFootnote = footnotes.get(tok.meta!.id as number)!;
        currentTokens = [];
        return false;
      }

      if (tok.type === "footnote_reference_close") {
        currentFootnote!.content = md.renderer.render(currentTokens!, state.md.options, state.env);
        currentTokens = undefined;
        return false;
      }

      if (currentTokens) {
        currentTokens.push(tok);
      }

      return !currentTokens;
    });
  }

  md.block.ruler.before("reference", "footnote_block", blocks, {
    alt: ["paragraph", "reference"],
  });
  md.inline.ruler.after("image", "footnote_inline", inlineFootnotes);
  md.inline.ruler.after("footnote_inline", "footnote_reference", references);
  md.core.ruler.after("inline", "footnote_tail", footnote_tail);

  md.core.ruler.push("saveFootnotes", function (state) {
    const data = (state.env.data as { page?: { data?: Record<string, unknown> } } | undefined)?.page
      ?.data;

    if (!data || data.footnotes) {
      return;
    }

    const footnotes = getFootnotes(state);
    data.footnotes = Array.from(footnotes.values()).map((footnote) => {
      const refIds = Array.from(
        { length: footnote.subId + 1 },
        (_, i) => `${options.referenceIdPrefix}${idSuffix(footnote.id, i)}`,
      );

      return {
        id: `${options.idPrefix}${footnote.id}`,
        refId: refIds.at(-1),
        refIds,
        label: footnote.label,
        content: footnote.content,
      } satisfies Footnote;
    });
  });
}

interface FootnoteItem {
  id: number;
  subId: number;
  label?: string;
  content?: string;
  tokens?: Token[];
}

function getFootnotes(state: StateCore | StateBlock | StateInline): Map<number, FootnoteItem> {
  if (!state.env.fn) {
    state.env.fn = new Map<number, FootnoteItem>();
  }

  return state.env.fn as Map<number, FootnoteItem>;
}

function searchFootnote(state: StateInline, label: string) {
  const map = getFootnotes(state);

  for (const value of map.values()) {
    if (value.label === label) {
      return value;
    }
  }
}

/** Extends global data interface */
declare global {
  namespace Lume {
    export interface GlobalData {
      /**
       * Footnotes info
       * @see https://lume.land/plugins/markdown-footnotes/
       */
      footnotes: FootnoteItem[];
    }
  }
}
