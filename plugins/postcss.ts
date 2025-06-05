import { autoprefixer, postcss, postcssImport } from "../deps/postcss.ts";
import { merge } from "../core/utils/object.ts";
import { concurrent } from "../core/utils/concurrent.ts";
import { resolveInclude } from "../core/utils/path.ts";
import { readFile } from "../core/utils/read.ts";
import { Page } from "../core/file.ts";
import { prepareAsset, saveAsset } from "./source_maps.ts";
import { warnUntil } from "../core/utils/log.ts";
import { bytes } from "../core/utils/format.ts";

import type Site from "../core/site.ts";
import type { SourceMap } from "./source_maps.ts";
import type { Item } from "../deps/debugbar.ts";

export interface Options {
  /**
   * Custom includes path for `postcss-import`
   * @default `site.options.includes`
   */
  includes?: string | false;

  /**
   * Plugins to use by postcss
   * @default `[autoprefixer()]`
   */
  plugins?: unknown[];

  /** Set `false` to remove the default plugins */
  useDefaultPlugins?: boolean;
}

// Default options
export const defaults: Options = {
  useDefaultPlugins: true,
};

const defaultPlugins = [
  autoprefixer(),
];

/**
 * A plugin to load all CSS files and process them using PostCSS
 * @see https://lume.land/plugins/postcss/
 */
export function postCSS(userOptions?: Options) {
  return (site: Site) => {
    const options = merge<Options>(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    const plugins = [...options.plugins ?? []];

    if (options.useDefaultPlugins) {
      plugins.unshift(...defaultPlugins);
    }

    if (options.includes) {
      plugins.unshift(configureImport(site, options.includes));
      site.ignore(options.includes);
    }

    // @ts-ignore: Argument of type 'unknown[]' is not assignable to parameter of type 'AcceptedPlugin[]'.
    const runner = postcss(plugins);

    site.hooks.postcss = (callback) => callback(runner);
    site.hooks.addPostcssPlugin = (plugin) => {
      runner.use(plugin);
    };
    site.process([".css"], processPostcss);
    site.filter("postcss", filter, true);

    function processPostcss(files: Page[]) {
      const hasPages = warnUntil(
        "[postcss plugin] No CSS files found. Make sure to add the CSS files with <code>site.add()</code>",
        files.length,
      );

      if (!hasPages) {
        return;
      }

      const item = site.debugBar?.buildItem(
        "[postcss plugin] Processing completed",
      );

      return concurrent(files, (file) => postCss(file, item));
    }

    async function postCss(file: Page, item?: Item) {
      const { content, filename, sourceMap, enableSourceMap } = prepareAsset(
        site,
        file,
      );
      const to = site.dest(file.outputPath);
      const map = enableSourceMap
        ? {
          inline: false,
          prev: sourceMap,
          annotation: false,
        }
        : undefined;

      // Process the code with PostCSS
      const result = await runner.process(content, { from: filename, to, map });

      if (item) {
        item.items ??= [];
        item.items.push({
          title: file.data.url,
          details: bytes(result.css.length),
          items: result.warnings().map((warning) => ({
            title: warning.toString(),
            context: "warning",
          })),
        });
      }

      saveAsset(
        site,
        file,
        result.css,
        result.map?.toJSON() as unknown as SourceMap,
      );
    }

    async function filter(code: string): Promise<string> {
      const result = await runner.process(code, { from: undefined });
      return result.css;
    }
  };
}

/**
 * Function to configure the postcssImport
 * using the Lume reader and the includes loader
 */
function configureImport(site: Site, includes: string) {
  return postcssImport({
    /** Resolve the import path */
    resolve(id: string, basedir: string) {
      if (id.startsWith("npm:")) {
        return "/" + id;
      }

      return resolveInclude(id, includes, basedir);
    },

    /** Load the content (using the Lume reader) */
    async load(file: string) {
      if (file.startsWith("/npm:")) {
        const url = file.replace("/npm:", "https://cdn.jsdelivr.net/npm/");
        return await readFile(url);
      }

      const content = await site.getContent(file, false);
      if (content === undefined) {
        throw new Error(`File ${file} not found`);
      }

      return content;
    },
  });
}

export default postCSS;

/** Extends Helpers interface */
declare global {
  namespace Lume {
    export interface Helpers {
      /** @see https://lume.land/plugins/postcss/ */
      postcss: (code: string) => Promise<string>;
    }
  }
}
