import { merge } from "../core/utils.ts";
import { Page } from "../core/filesystem.ts";
import {
  Config,
  CSSParser,
  HTMLParser,
  Processor,
  StyleSheet,
} from "../deps/windi_css.ts";

import type { Element, HTMLDocument } from "../deps/dom.ts";
import type { Site } from "../core.ts";

export interface Options {
  /** Whether minify the css code or not */
  minify: boolean;

  /**
   * Operating mode for Windi CSS.
   * @see https://windicss.org/posts/modes.html
   */
  mode: "interpret" | "compile";

  /**
   * Set the css filename for all generated styles
   * Set false to insert a <style> tag per page
   */
  cssFile: string | false;

  /**
   * Configurations for the Windi CSS processor
   * @see https://windicss.org/guide/configuration.html
   */
  config: Config;
}

const defaults: Options = {
  minify: false,
  mode: "interpret",
  cssFile: "/windi.css",
  config: {},
};

/**
 * A lume plugin for windicss, the next generation utility-first css framework
 *
 * classnames from all built pages will be read/extracted
 * and only the necessary css will be generated
 *
 * the output css file must be manually included in your document's
 * head e.g. <link rel="stylesheet" href="/windi.css">
 */
export default function (userOptions: Partial<Options> = {}) {
  const options = merge(defaults, userOptions) as Options;

  return (site: Site) => {
    // Create & configure a windicss instance
    const processor = new Processor();
    options.config = processor.loadConfig(options.config);

    // Load and process all .windi.css files
    site.loadAssets([".windi.css"]);
    site.process([".windi.css"], (page) => {
      const parser = new CSSParser(page.content as string, processor);

      page.content = parser.parse().build(options.minify);
      page.updateDest({ ext: ".css" });
    });

    // Process html files
    const { cssFile } = options;

    if (cssFile === false) {
      // Insert a <style> tag for each page
      site.process([".html"], (page) => {
        const scopedsheet = windi(page, processor, options).sort().combine();
        const code = scopedsheet.build(options.minify);

        if (code) {
          const style = page.document!.createElement("style");
          style.innerText = scopedsheet.build(options.minify);
          page.document?.head?.appendChild(style);
        }
      });
    } else {
      // Generate the stylesheets for all pages
      site.addEventListener("afterRender", () => {
        let stylesheet = new StyleSheet();

        const pages = site.pages
          .filter((page) => page.dest.ext === ".html");

        // Create & merge stylesheets for all pages
        stylesheet = pages
          .map((page) => windi(page, processor, options))
          .reduce(
            (previous, current) => previous.extend(current),
            stylesheet,
          ).sort().combine();

        // output css as a page
        const exists = site.pages.find((page) => page.data.url === cssFile);

        if (exists) {
          exists.content = `${exists.content}\n${
            stylesheet.build(options.minify)
          }`;
        } else {
          site.pages.push(
            Page.create(cssFile, stylesheet.build(options.minify)),
          );
        }
      });
    }
  };
}

/**
 * Run windicss on a HTML page
 */
export function windi(page: Page, processor: Processor, options: Options) {
  const content = page.content as string;
  const parser = new HTMLParser(content);

  // Update page content with classnames output from windi
  // e.g. to expand variant:(class groups) and to support compile mode
  let stylesheet = new StyleSheet();
  let html = "";
  let index = 0;

  for (const className of parser.parseClasses()) {
    html += content.substring(index, className.start);
    index = className.end;

    // Interpret or compile the classname
    if (options.mode === "interpret") {
      const interpreted = processor.interpret(className.result);
      html += [...interpreted.success, ...interpreted.ignored].join(" ");
      stylesheet = stylesheet.extend(interpreted.styleSheet);
    } else if (options.mode === "compile") {
      const compiled = processor.compile(
        className.result,
        options.config.prefix,
      );
      html += [compiled.className, ...compiled.ignored].join(" ");
      stylesheet = stylesheet.extend(compiled.styleSheet);
    }
  }

  page.content = html + content.substring(index);

  // Attributify: https://windicss.org/features/attributify.html
  // Taken from https://github.com/windicss/windicss/blob/cf3067b9272704adab30d568bdaa5f64bd44b7b5/src/cli/index.ts#L188
  if (options.config.attributify) {
    const attrs: { [key: string]: string | string[] } = parser
      .parseAttrs()
      .reduceRight((a: { [key: string]: string | string[] }, b) => {
        if (b.key === "class" || b.key === "className") return a;
        if (b.key in a) {
          a[b.key] = Array.isArray(a[b.key])
            ? Array.isArray(b.value)
              ? [...(a[b.key] as string[]), ...b.value]
              : [...(a[b.key] as string[]), b.value]
            : [
              a[b.key] as string,
              ...(Array.isArray(b.value) ? b.value : [b.value]),
            ];
          return a;
        }
        return Object.assign(a, { [b.key]: b.value });
      }, {});
    const attributified = processor.attributify(attrs);
    stylesheet = stylesheet.extend(attributified.styleSheet);
  }

  // Style blocks: use @apply etc. in a style tag
  // will always replace the inline style block with the generated styles
  // https://windicss.org/features/directives.html
  // https://windicss.org/posts/language.html
  // https://windicss.org/integrations/cli.html#style-block
  (page.document as HTMLDocument).querySelectorAll('style[lang="windi"]')
    .forEach((node) => {
      const $style = node as Element,
        translatedSheet = new CSSParser($style.innerText, processor).parse();
      $style.removeAttribute("lang");
      $style.innerText = translatedSheet.build(options.minify);
    });

  if (!options.config.preflight) return stylesheet;
  const preflightSheet = processor.preflight(content);
  return stylesheet.extend(preflightSheet);
}
