import { merge } from "../core/utils/object.ts";
import createSlugifier from "../core/slugifier.ts";
import { log } from "../core/utils/log.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** Minimum level to apply anchors. */
  minLevel?: number;

  /** Custom slugify function to generate ids */
  slugify?: (x: string) => string;

  /** Value of the tabindex attribute on headings, set to false to disable. */
  tabIndex?: number | false;

  /**
   * Function to include the anchor in the header
   * Set `false` to disable it
   */
  anchor?: ((header: Element) => void) | false;
}

export const defaults = {
  minLevel: 2,
  slugify: createSlugifier(),
  tabIndex: -1,
  anchor: headerLink(),
} satisfies Options;

const STARTS_WITH_LETTER = /^[a-z]/i;

export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process([".html"], (pages) => {
      for (const { document } of pages) {
        const uniqueIds = new Set<string>();

        for (const element of document.querySelectorAll("[toc]")) {
          buildToc(element, uniqueIds);
        }
      }
    });
  };

  function buildToc(element: Element, uniqueIds: Set<string>) {
    const document = element.ownerDocument;

    const id = element.getAttribute("toc");
    if (!id) {
      return log.error(`[toc plugin] Empty toc attribute`);
    }

    const target = document.getElementById(id);
    if (!target) {
      return log.error(`[toc plugin] Target with id "${id}" not found`);
    }

    const toc = scanToc(target, uniqueIds);
    const ol = document.createElement("ol");
    ol.innerHTML = renderToc(toc);
    element.appendChild(ol);
    element.removeAttribute("toc");
  }

  function scanToc(element: Element, uniqueIds: Set<string>) {
    const ast: Node = { level: 0, text: "", id: "", children: [] };
    const stack = [ast];

    for (const header of element.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
      const level = parseInt(header.tagName.slice(1), 10);

      if (level < options.minLevel) {
        continue;
      }

      if (header.hasAttribute("no-toc")) {
        header.removeAttribute("no-toc");
        continue;
      }

      const text = header.textContent;
      let id = header.getAttribute("id") || options.slugify(text);

      // Make sure the id starts with a letter
      if (!STARTS_WITH_LETTER.test(id)) {
        id = `h_${id}`;
      }

      // Make sure the id is unique
      while (uniqueIds.has(id)) {
        id += "-1";
      }
      uniqueIds.add(id);
      header.setAttribute("id", id);

      if (options.tabIndex !== false && !header.hasAttribute("tabindex")) {
        header.setAttribute("tabindex", `${options.tabIndex}`);
      }

      if (options.anchor) {
        options.anchor(header);
      }

      const node: Node = {
        level,
        text,
        id,
        children: [],
      };

      if (node.level > stack[0].level) {
        stack[0].children.push(node);
        stack.unshift(node);
        continue;
      }

      if (node.level === stack[0].level) {
        stack[1].children.push(node);
        stack[0] = node;
        continue;
      }

      while (node.level <= stack[0].level) {
        stack.shift();
      }
      stack[0].children.push(node);
      stack.unshift(node);
    }

    return ast.children;
  }
}

interface Node {
  level: number;
  text: string;
  id: string;
  children: Node[];
}

function renderToc(nodes: Node[]): string {
  const code: string[] = [];
  for (const node of nodes) {
    code.push("<li>");
    code.push(`<a href="#${node.id}">${node.text}</a>`);
    if (node.children.length) {
      code.push("<ol>");
      code.push(renderToc(node.children));
      code.push("</ol>");
    }
    code.push("</li>");
  }
  return code.join("\n");
}

interface HeaderLinkOptions {
  class?: string;
}

/**
 * Generate the anchor with the whole header. Example:
 *
 * ```html
 * <h1 id="foo">This is the title</h1>
 * is converted to:
 * <h1 id="foo"><a href="#foo">This is the title</a></h1>
 * ```
 */
export function headerLink(options: HeaderLinkOptions = {}) {
  return (header: Element) => {
    const id = header.getAttribute("id");
    const link = header.ownerDocument.createElement("a");
    link.setAttribute("href", `#${id}`);
    if (options.class) {
      link.setAttribute("class", options.class);
    }
    link.innerHTML = header.innerHTML;
    header.innerHTML = "";
    header.append(link);
  };
}

export interface LinkInsideHeaderOptions {
  class?: string;
  append?: boolean;
  ariaHidden?: boolean;
  content?: string;
}

/**
 * Generate the anchor inside the header. Example:
 *
 * ```html
 * <h1 id="foo">This is the title</h1>
 * is converted to:
 * <h1 id="foo"><a href="#foo">#</a>This is the title</h1>
 * ```
 */
export function linkInsideHeader(
  options: LinkInsideHeaderOptions = {},
) {
  return (header: Element) => {
    const id = header.getAttribute("id");
    const link = header.ownerDocument.createElement("a");

    link.setAttribute("href", `#${id}`);
    if (options.class) {
      link.setAttribute("class", options.class);
    }
    if (options.ariaHidden) {
      link.setAttribute("aria-hidden", "true");
    }
    link.innerText = options.content ?? "#";

    if (options.append) {
      header.append(" ", link);
    } else {
      header.prepend(link, " ");
    }
  };
}
