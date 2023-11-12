import { katex, KatexOptions } from "../deps/katex.ts";
import { renderMathInElement } from "../deps/katex-auto-render/auto-render.ts";
import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";
import type { Page } from "../core/file.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /** The css selector to apply katex */
  cssSelector?: string;

  /** Configuration to pass to katex */
  options?: KatexOptions;
}

export const defaults: Options = {
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

export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);
  return (site: Site) => {
    site.process(options.extensions, (page: Page) => {
      const { document } = page;

      if (!document) {
        return;
      }

      document.querySelectorAll(options.cssSelector)
        .forEach((element) => {
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
              parent.replaceWith(div.firstChild!);
            } else {
              element.replaceWith(div.firstChild!);
            }
          } catch (cause) {
            throw new Error(
              `Katex failed to render in the page ${page.outputPath}`,
              { cause },
            );
          }
        });

      if (options.options.delimiters) {
        renderMathInElement(document.body, options.options);
      }
    });
  };
}
