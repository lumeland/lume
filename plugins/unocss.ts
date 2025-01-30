import { merge } from "../core/utils/object.ts";
import { read } from "../core/utils/read.ts";
import { insertContent } from "../core/utils/page_content.ts";
import {
  createGenerator,
  MagicString,
  presetUno,
  resetUrl,
  transformerDirectives,
  transformerVariantGroup,
} from "../deps/unocss.ts";

import type Site from "../core/site.ts";
import type {
  SourceCodeTransformer,
  UnocssPluginContext,
  UserConfig,
} from "../deps/unocss.ts";

export interface Options {
  /**
   * Configurations for UnoCSS.
   * @see https://unocss.dev/guide/config-file
   * @default
   * {
   *  presets: [presetUno()]
   * }
   */
  options?: UserConfig;

  /**
   * Set the css filename for all generated styles,
   * Set to `false` to insert a <style> tag per page.
   * @default "unocss.css"
   */
  cssFile?: false | string;

  /**
   * A placeholder to replace with the generated CSS.
   * Only used when `cssFile` is set.
   */
  placeholder?: string;

  /**
   * Process CSS files using UnoCSS transformers.
   * @default
   * [
   *  transformerVariantGroup(),
   *  transformerDirectives()
   * ]
   */
  transformers?: SourceCodeTransformer[];

  /**
   * Supported CSS reset options.
   * @see https://github.com/unocss/unocss/tree/main/packages/reset
   * @default false
   */
  reset?: false | "tailwind" | "tailwind-compat" | "eric-meyer";
}

export const defaults: Options = {
  options: {
    presets: [presetUno()],
  },
  transformers: [
    transformerVariantGroup(),
    transformerDirectives(),
  ],
  reset: false,
};

/**
 * A plugin to generate CSS using UnoCSS
 * @see https://lume.land/plugins/unocss/
 */
export function unoCSS(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    let uno: ReturnType<typeof createGenerator>;
    function getGenerator() {
      if (!uno) {
        uno = createGenerator(options.options);
      }
      return uno;
    }
    const { transformers, cssFile = site.options.cssFile, reset } = options;

    if (transformers.length > 0) {
      site.add([".css"]);
      site.process([".css"], async (files) => {
        const uno = await getGenerator();
        for (const file of files) {
          const content = file.text;
          if (content) {
            const code = new MagicString(content);
            for await (const { transform } of transformers) {
              await transform(
                code,
                file.src.path,
                { uno } as unknown as UnocssPluginContext,
              );
            }
            file.content = code.toString();
          }
        }
      });
    }

    if (cssFile === false) {
      // Insert a <style> tag for each page
      site.process([".html"], async (pages) => {
        const resetCss = await getResetCss(reset);
        const uno = await getGenerator();

        await Promise.all(pages.map(async (page) => {
          const { document } = page;
          const result = await uno.generate(
            document.documentElement?.innerHTML ?? "",
          );
          const css = resetCss ? `${resetCss}\n${result.css}` : result.css;

          if (css) {
            const style = document.createElement("style");
            style.innerText = css;
            document.head.appendChild(style);
          }
        }));
      });
      return;
    }

    // Generate the stylesheets for all pages
    site.process([".html"], async (pages) => {
      const classes = new Set<string>();
      const uno = await getGenerator();

      await Promise.all(
        pages.map(async (page) =>
          await uno.generate(
            page.document.documentElement?.innerHTML ?? "",
          )
            .then((res) => res.matched)
            .then((matched) => matched.forEach((match) => classes.add(match)))
        ),
      );

      // Create & merge stylesheets for all pages
      const resetCss = await getResetCss(reset);
      const result = await uno.generate(classes);
      const css = resetCss ? `${resetCss}\n${result.css}` : result.css;

      // Output the CSS file
      const output = await site.getOrCreatePage(cssFile);
      insertContent(output, css, options.placeholder);
    });
  };
}

/**
 * TODO: Replace with CSS Modules Import
 * @remarks Deno does not currently support CSS Modules.
 * @see https://github.com/denoland/deno/issues/11961
 */
async function getResetCss(reset: Options["reset"]) {
  return reset === false ? "" : await read(`${resetUrl}/${reset}.css`, false);
}

export default unoCSS;
