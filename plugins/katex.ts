import { katex, KatexOptions, renderMathInElement } from "../deps/katex.ts";
import { merge } from "../core/utils.ts";
import { Exception } from "../core/errors.ts";

import type { Element } from "../deps/dom.ts";
import type { DeepPartial, Page, Site } from "../core.ts";

export interface Options {
  extensions: string[];
  cssSelector: string;
  options: KatexOptions;
}

const defaultOptions: Options = {
  extensions: [".html"],
  cssSelector: ".language-math",
  options: {
    strict: true,
    displayMode: true,
    throwOnError: true,
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\(", right: "\\)", display: false },
      { left: "\\begin{equation}", right: "\\end{equation}", display: true },
      { left: "\\begin{align}", right: "\\end{align}", display: true },
      { left: "\\begin{alignat}", right: "\\end{alignat}", display: true },
      { left: "\\begin{gather}", right: "\\end{gather}", display: true },
      { left: "\\begin{CD}", right: "\\end{CD}", display: true },
      { left: "\\[", right: "\\]", display: true },
    ],
    ignoredTags: [
      "script",
      "noscript",
      "style",
      "textarea",
      "pre",
      "code",
      "option",
    ],
    ignoredClasses: [],
    macros: {},
  },
};

export default function (userOptions?: DeepPartial<Options>) {
  const options = merge(defaultOptions, userOptions);
  return (site: Site) => {
    site.process(options.extensions, (page: Page) => {
      const { document } = page;

      if (!document) {
        return;
      }

      document.querySelectorAll(options.cssSelector)
        .forEach((node) => {
          const element = node as Element;

          try {
            const rendered = katex.renderToString(
              element.textContent,
              options.options,
            );
            const div = document.createElement("div");
            div.innerHTML = rendered.trim();

            // we've selected the <code> element, we want to also replace the parent <pre>
            const parent = element.parentElement;
            if (parent && parent.tagName === "PRE") {
              parent.replaceWith(div.firstChild);
            } else {
              element.replaceWith(div.firstChild);
            }
          } catch (cause) {
            throw new Exception("Katex failed to render", {
              page,
              cause,
            });
          }
        });

      if (options.options.delimiters) {
        renderMathInElement(document.body, options.options);
      }
    });
  };
}
