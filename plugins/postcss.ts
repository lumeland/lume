import {
  autoprefixer,
  postcss,
  postcssImport,
  postcssNesting,
} from "../deps/postcss.ts";
import { isUrl, merge } from "../core/utils.ts";
import { Page } from "../core/filesystem.ts";
import { posix } from "../deps/path.ts";

import type { Helper, Site } from "../core.ts";
import type { SourceMapOptions } from "../deps/postcss.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Set `true` to generate source map files */
  sourceMap: boolean | SourceMapOptions;

  /** Custom includes path for `postcss-import` */
  includes: string | false;

  /** Plugins to use by postcss */
  plugins: unknown[];

  /** Set `true` append your plugins to the defaults */
  keepDefaultPlugins: boolean;
}

// Default options
export const defaults: Options = {
  extensions: [".css"],
  sourceMap: false,
  includes: false,
  plugins: [
    postcssNesting(),
    autoprefixer(),
  ],
  keepDefaultPlugins: false,
};

/** A plugin to load all CSS files and process them using PostCSS */
export default function (userOptions?: Partial<Options>) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    if (options.keepDefaultPlugins && userOptions?.plugins?.length) {
      options.plugins = defaults.plugins.concat(userOptions.plugins);
    }

    const plugins = [...options.plugins];

    if (options.includes) {
      site.includes(options.extensions, options.includes);

      plugins.unshift(configureImport(site));
    }

    // @ts-ignore: Argument of type 'unknown[]' is not assignable to parameter of type 'AcceptedPlugin[]'.
    const runner = postcss(plugins);

    site.loadAssets(options.extensions);
    site.process(options.extensions, postCss);
    site.filter("postcss", filter as Helper, true);

    async function postCss(file: Page) {
      const from = site.src(file.src.path + file.src.ext);
      const to = site.dest(file.dest.path + file.dest.ext);
      const map = options.sourceMap;

      // Process the code with PostCSS
      const result = await runner.process(file.content!, { from, to, map });

      file.content = result.css;

      if (result.map) {
        const mapFile = Page.create(
          file.dest.path + ".css.map",
          result.map.toString(),
        );
        site.pages.push(mapFile);
      }
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
  const { includesLoader, formats, reader } = site;

  return postcssImport({
    /** Resolve the import path */
    async resolve(id: string, basedir: string) {
      if (isUrl(id)) {
        return id;
      }

      /** Relative path */
      if (id.startsWith(".")) {
        return posix.join(basedir, id);
      }

      if (!id.startsWith("/")) {
        const path = posix.join(basedir, id);
        const exists = await reader.getInfo(path);
        if (exists) {
          return path;
        }
      }

      /** Search the path in the includes */
      const format = formats.search(id);
      if (format) {
        const path = includesLoader.resolve(id, format, basedir);

        if (path) {
          return site.src(path);
        }
      }
    },

    /** Load the content (using the Lume reader) */
    async load(file: string) {
      const format = formats.search(file);

      if (format && format.pageLoader) {
        const relative = file.slice(site.src().length);
        const content = await reader.read(relative, format.pageLoader);

        if (content) {
          return content.content as string;
        }
      }
    },
  });
}
