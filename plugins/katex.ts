import { assetsUrl, katex as Katex, KatexOptions } from "../deps/katex.ts";
import { renderMathInElement } from "../deps/katex-auto-render/auto-render.ts";
import { merge } from "../core/utils/object.ts";
import { posix } from "../deps/path.ts";
import { read, readFile } from "../core/utils/read.ts";
import { walkUrls } from "../core/utils/css_urls.ts";
import { insertContent } from "../core/utils/page_content.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** The css selector to apply katex */
  cssSelector?: string;

  /** The CSS file to output the CSS styles */
  cssFile?: string;

  /** The folder to save the fonts */
  fontsFolder?: string;

  /** A placeholder to replace with the generated CSS */
  placeholder?: string;

  /**
   * Documentation for katex options:
   * @see https://katex.org/docs/options.html
   *
   * Documentation for auto-render options:
   * @see https://katex.org/docs/autorender.html
   */
  options?: KatexOptions;
}

export const defaults: Options = {
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

/**
 * A plugin to render math equations using katex
 * @see https://lume.land/plugins/katex/
 */
export function katex(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    let cssCode = "";
    const cssFile = posix.join("/", options.cssFile || site.options.cssFile);
    const fontsFolder = posix.join(
      "/",
      options.fontsFolder || site.options.fontsFolder,
    );

    const relativePath = posix.relative(
      posix.dirname(cssFile),
      posix.join(fontsFolder),
    );

    // Download the fonts and generate the CSS
    site.addEventListener("beforeBuild", async () => {
      const css = await readFile(`${assetsUrl}/katex.css`);
      const fonts = new Map<string, string>();

      // Fix the urls in the CSS file
      cssCode = await walkUrls(css, (url) => {
        const file = posix.basename(url);
        fonts.set(`${assetsUrl}/${url}`, posix.join("/", fontsFolder, file));
        return posix.join(relativePath, file);
      });

      // Download the fonts
      await Promise.all(
        Array.from(fonts).map(async ([src, url]) => {
          const content = await read(src, true);
          site.page({ content, url });
        }),
      );
    });

    // Output the CSS file
    site.process(async () => {
      const page = await site.getOrCreatePage(cssFile);
      page.text = insertContent(page.text, cssCode, options.placeholder);
    });

    // Process the html pages and output the CSS file
    site.process([".html"], (pages) => {
      for (const page of pages) {
        const { document } = page;

        document.querySelectorAll(options.cssSelector)
          .forEach((element) => {
            try {
              const rendered = Katex.renderToString(
                element.textContent || "",
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
      }
    });
  };
}

export default katex;
