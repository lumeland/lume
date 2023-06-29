import katex from "npm:katex@0.16.8";
import { Node } from "../deps/dom.ts";

import type { Document, Element } from "../deps/dom.ts";

export { katex };

interface TrustContext {
  command: string;
  url: string;
  protocol: string;
}

/** Documentation: https://katex.org/docs/options.html */
export interface KatexOptions {
  /**
   * If `true`, math will be rendered in display mode
   * (math in display style and center math on page)
   *
   * If `false`, math will be rendered in inline mode
   * @default false
   */
  displayMode?: boolean | undefined;
  /**
   * Determines the markup language of the output. The valid choices are:
   * - `html`: Outputs KaTeX in HTML only.
   * - `mathml`: Outputs KaTeX in MathML only.
   * - `htmlAndMathml`: Outputs HTML for visual rendering
   *   and includes MathML for accessibility.
   *
   * @default 'htmlAndMathml'
   */
  output?: "html" | "mathml" | "htmlAndMathml" | undefined;
  /**
   * If `true`, display math has \tags rendered on the left
   * instead of the right, like \usepackage[leqno]{amsmath} in LaTeX.
   *
   * @default false
   */
  leqno?: boolean | undefined;
  /**
   * If `true`, display math renders flush left with a 2em left margin,
   * like \documentclass[fleqn] in LaTeX with the amsmath package.
   *
   * @default false
   */
  fleqn?: boolean | undefined;
  /**
   * If `true`, KaTeX will throw a `ParseError` when
   * it encounters an unsupported command or invalid LaTex
   *
   * If `false`, KaTeX will render unsupported commands as
   * text, and render invalid LaTeX as its source code with
   * hover text giving the error, in color given by errorColor
   * @default true
   */
  throwOnError?: boolean | undefined;
  /**
   * A Color string given in format `#XXX` or `#XXXXXX`
   */
  errorColor?: string | undefined;
  /**
   * A collection of custom macros.
   *
   * See `src/macros.js` for its usage
   */
  // deno-lint-ignore no-explicit-any
  macros?: any;
  /**
   * Specifies a minimum thickness, in ems, for fraction lines,
   * \sqrt top lines, {array} vertical lines, \hline, \hdashline,
   * \underline, \overline, and the borders of \fbox, \boxed, and
   * \fcolorbox.
   */
  minRuleThickness?: number | undefined;
  /**
   * If `true`, `\color` will work like LaTeX's `\textcolor`
   * and takes 2 arguments
   *
   * If `false`, `\color` will work like LaTeX's `\color`
   * and takes 1 argument
   *
   * In both cases, `\textcolor` works as in LaTeX
   *
   * @default false
   */
  colorIsTextColor?: boolean | undefined;
  /**
   * All user-specified sizes will be caped to `maxSize` ems
   *
   * If set to Infinity, users can make elements and space
   * arbitrarily large
   *
   * @default Infinity
   */
  maxSize?: number | undefined;
  /**
   * Limit the number of macro expansions to specified number
   *
   * If set to `Infinity`, marco expander will try to fully expand
   * as in LaTex
   *
   * @default 1000
   */
  maxExpand?: number | undefined;
  /**
   * If `false` or `"ignore"`, allow features that make
   * writing in LaTex convenient but not supported by LaTex
   *
   * If `true` or `"error"`, throw an error for such transgressions
   *
   * If `"warn"`, warn about behavior via `console.warn`
   *
   * @default "warn"
   */
  // deno-lint-ignore ban-types
  strict?: boolean | string | Function | undefined;
  /**
   * If `false` (do not trust input), prevent any commands that could enable adverse behavior, rendering them instead in errorColor.
   *
   * If `true` (trust input), allow all such commands.
   *
   * @default false
   */
  trust?: boolean | ((context: TrustContext) => boolean) | undefined;
  /**
   * Place KaTeX code in the global group.
   *
   * @default false
   */
  globalGroup?: boolean | undefined;

  /**
   * Auto-render specific options
   */
  delimiters?: Delimiter[] | undefined;
  ignoredTags?: string[] | undefined;
  ignoredClasses?: string[] | undefined;
  preProcess?: ((math: string) => string) | undefined;
}

interface Delimiter {
  left: string;
  right: string;
  display?: boolean | undefined;
}

/* Note: optionsCopy is mutated by this method. If it is ever exposed in the
 * API, we should copy it before mutating.
 */
const renderMathInText = function (
  document: Document,
  text: string,
  optionsCopy: KatexOptions,
) {
  const data = splitAtDelimiters(text, optionsCopy.delimiters);
  if (data.length === 1 && data[0].type === "text") {
    // There is no formula in the text.
    // Let's return null which means there is no need to replace
    // the current text node with a new one.
    return null;
  }

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < data.length; i++) {
    if (data[i].type === "text") {
      fragment.appendChild(document.createTextNode(data[i].data));
    } else {
      const span = document.createElement("span");
      let math = data[i].data;
      // Override any display mode defined in the settings with that
      // defined by the text itself
      optionsCopy.displayMode = data[i].display;
      if (optionsCopy.preProcess) {
        math = optionsCopy.preProcess(math);
      }
      const rendered = katex.renderToString(
        math,
        optionsCopy,
      );
      const div = document.createElement("div");
      div.innerHTML = rendered.trim();

      span.appendChild(div.firstChild as Node);
      fragment.appendChild(span);
    }
  }

  return fragment;
};

function renderElem(elem: Element, optionsCopy: KatexOptions) {
  for (let i = 0; i < elem.childNodes.length; i++) {
    const childNode = elem.childNodes[i];
    if (childNode.nodeType === 3) {
      // Text node
      let textContentConcat = childNode.textContent || "";
      let sibling = childNode.nextSibling;
      let nSiblings = 0;
      while (sibling && (sibling.nodeType === Node.TEXT_NODE)) {
        textContentConcat += sibling.textContent;
        sibling = sibling.nextSibling;
        nSiblings++;
      }
      const frag = renderMathInText(
        elem.ownerDocument!,
        textContentConcat,
        optionsCopy,
      );
      if (frag) {
        // Remove extra text nodes
        for (let j = 0; j < nSiblings; j++) {
          childNode.nextSibling?.remove();
        }
        i += frag.childNodes.length - 1;
        elem.replaceChild(frag, childNode);
      } else {
        // If the concatenated text does not contain math
        // the siblings will not either
        i += nSiblings;
      }
    } else if (childNode.nodeType === 1) {
      // Element node
      const className = " " + (childNode as Element).className + " ";
      const shouldRender = optionsCopy.ignoredTags!.indexOf(
            childNode.nodeName.toLowerCase(),
          ) === -1 &&
        optionsCopy.ignoredClasses!.every(
          (x) => className.indexOf(" " + x + " ") === -1,
        );

      if (shouldRender) {
        renderElem(childNode as Element, optionsCopy);
      }
    }
    // Otherwise, it's something else, and ignore it.
  }
}

export function renderMathInElement(
  elem: Element | undefined,
  options: KatexOptions,
) {
  if (!elem) {
    throw new Error("No element provided to render");
  }

  renderElem(elem, Object.assign({}, options));
}

const findEndOfMath = function (
  delimiter: [],
  text: string,
  startIndex: number,
) {
  // Adapted from
  // https://github.com/Khan/perseus/blob/master/src/perseus-markdown.jsx
  let index = startIndex;
  let braceLevel = 0;

  const delimLength = delimiter.length;

  while (index < text.length) {
    const character = text[index];

    if (
      braceLevel <= 0 &&
      text.slice(index, index + delimLength) === delimiter
    ) {
      return index;
    } else if (character === "\\") {
      index++;
    } else if (character === "{") {
      braceLevel++;
    } else if (character === "}") {
      braceLevel--;
    }

    index++;
  }

  return -1;
};

const escapeRegex = function (string: string) {
  return string.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
};

const amsRegex = /^\\begin{/;

const splitAtDelimiters = function (text: string, delimiters: Delimiter[]) {
  let index;
  const data = [];

  const regexLeft = new RegExp(
    "(" + delimiters.map((x) => escapeRegex(x.left)).join("|") + ")",
  );

  while (true) {
    index = text.search(regexLeft);
    if (index === -1) {
      break;
    }
    if (index > 0) {
      data.push({
        type: "text",
        data: text.slice(0, index),
      });
      text = text.slice(index); // now text starts with delimiter
    }
    // ... so this always succeeds:
    const i = delimiters.findIndex((delim) => text.startsWith(delim.left));
    index = findEndOfMath(delimiters[i].right, text, delimiters[i].left.length);
    if (index === -1) {
      break;
    }
    const rawData = text.slice(0, index + delimiters[i].right.length);
    const math = amsRegex.test(rawData)
      ? rawData
      : text.slice(delimiters[i].left.length, index);
    data.push({
      type: "math",
      data: math,
      rawData,
      display: delimiters[i].display,
    });
    text = text.slice(index + delimiters[i].right.length);
  }

  if (text !== "") {
    data.push({
      type: "text",
      data: text,
    });
  }

  return data;
};
