import {
  autoprefixer,
  postcss,
  postcssImport,
  postcssNesting,
} from "../deps/postcss.ts";
import { merge } from "../core/utils.ts";
import { Helper, Page, Site } from "../core.ts";
import { SitePage } from "../core/filesystem.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Set `true` to generate source map files */
  sourceMap: boolean;

  /** Custom includes path for `postcss-import` */
  includes: string | string[] | false;

  /** Plugins to use by postcss */
  plugins: unknown[];

  /** Set `true` append your plugins to the defaults */
  keepDefaultPlugins: boolean;
}

// Default options
const defaults: Options = {
  extensions: [".css"],
  sourceMap: false,
  includes: [],
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
      plugins.unshift(postcssImport({
        path: Array.isArray(options.includes)
          ? options.includes.map((path) => site.src(path))
          : site.src(options.includes),
      }));
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
        const mapFile = new SitePage();
        mapFile.dest = {
          path: file.dest.path,
          ext: ".css.map",
        };
        mapFile.content = result.map.toString();
        site.pages.push(mapFile);
      }
    }

    async function filter(code: string) {
      const result = await runner.process(code, { from: undefined });
      return result.css;
    }
  };
}
