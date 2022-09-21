import { katex, KatexOptions } from "../deps/katex.ts";
import { Page, Site } from "../core.ts";
import { merge } from "../core/utils.ts";

interface Options {
  extensions: string[];
  querySelector: string;
  katexOptions: KatexOptions;
}

const defaultOptions: Options = {
  extensions: [".html"],
  querySelector: "code.language-math",
  katexOptions: {
    strict: true,
    displayMode: true,
    throwOnError: true,
  },
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaultOptions, userOptions);
  return (site: Site) => {
    site.process(options.extensions, (page: Page) => {
      page.document!.querySelectorAll(options.querySelector)
        .forEach((element) => {
          try {
            const rendered = katex.renderToString(
              element.textContent,
              options.katexOptions,
            );
            const div = page.document!.createElement("div");
            div.innerHTML = rendered.trim();
            // we've selected the <code> element, we want to also replace the parent <pre>
            element.parentElement!._replaceWith(div.firstChild);
          } catch (e) {
            throw Error(`katex render failed: ${e}`);
          }
        });
    });
  };
}
