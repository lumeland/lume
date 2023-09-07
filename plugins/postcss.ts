import {
  autoprefixer,
  postcss,
  postcssImport,
  postcssNesting,
} from "../deps/postcss.ts";
import { merge, resolveInclude } from "../core/utils.ts";
import { Page } from "../core/filesystem.ts";
import { prepareAsset, saveAsset } from "./source_maps.ts";
import textLoader from "../core/loaders/text.ts";

import type { Helper, Site, SourceMap } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /**
   * Custom includes path for `postcss-import`
   * @default `site.options.includes`
   */
  includes: string | false;

  /**
   * Plugins to use by postcss
   * @default `[postcssNesting(), autoprefixer()]`
   */
  plugins: unknown[];

  /** Set `false` to remove the default plugins */
  useDefaultPlugins: boolean;
}

// Default options
export const defaults: Options = {
  extensions: [".css"],
  includes: "",
  plugins: [],
  useDefaultPlugins: true,
};

const defaultPlugins = [
  // @ts-expect-error: postcss-nesting provides wrong types under node16 module resolution: https://github.com/csstools/postcss-plugins/issues/1031
  postcssNesting(),
  autoprefixer(),
];

/** A plugin to load all CSS files and process them using PostCSS */
export default function (userOptions?: Partial<Options>) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    const plugins = [...options.plugins];

    if (options.useDefaultPlugins) {
      plugins.unshift(...defaultPlugins);
    }

    if (options.includes) {
      site.includes(options.extensions, options.includes, false);

      plugins.unshift(configureImport(site));
    }

    // @ts-ignore: Argument of type 'unknown[]' is not assignable to parameter of type 'AcceptedPlugin[]'.
    const runner = postcss(plugins);

    site.hooks.addPostcssPlugin = (plugin) => {
      runner.use(plugin);
    };
    site.hooks.postcss = (callback) => callback(runner);

    site.loadAssets(options.extensions);
    site.process(options.extensions, postCss);
    site.filter("postcss", filter as Helper, true);

    async function postCss(file: Page) {
      const { content, filename, sourceMap, enableSourceMap } = prepareAsset(
        site,
        file,
      );
      const to = site.dest(file.outputPath!);
      const map = enableSourceMap
        ? {
          inline: false,
          prev: sourceMap,
          annotation: false,
        }
        : undefined;

      // Process the code with PostCSS
      const result = await runner.process(content, { from: filename, to, map });

      saveAsset(
        site,
        file,
        result.css,
        result.map?.toJSON() as unknown as SourceMap,
      );
    }

    async function filter(code: string) {
      const result = await runner.process(code, { from: undefined });
      return result.css;
    }
  };
}

/**
 * Function to configure the postcssImport
 * using the Lume reader and the includes loader
 */
function configureImport(site: Site) {
  const { formats } = site;
  const { includes } = site.options;

  return postcssImport({
    /** Resolve the import path */
    resolve(id: string, basedir: string) {
      const format = formats.search(id);
      const includesPath = format?.includesPath ?? includes;

      return resolveInclude(id, includesPath, basedir);
    },

    /** Load the content (using the Lume reader) */
    async load(file: string) {
      return await site.getContent(file, textLoader) as string;
    },
  });
}
