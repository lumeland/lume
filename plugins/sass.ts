import { merge, replaceExtension } from "../core/utils.ts";
import denosass from "../deps/denosass.ts";
import { posix, toFileUrl } from "../deps/path.ts";
import { Page } from "../core/filesystem.ts";
import { prepareAsset, saveAsset } from "./source_maps.ts";

import type { Site } from "../core.ts";

type SassOptions = Omit<denosass.StringOptions<"sync">, "url" | "syntax">;

export interface Options {
  /** Extensions processed by this plugin */
  extensions: string[];

  /** Output format */
  format: "compressed" | "expanded";

  /** SASS options */
  options: SassOptions;

  /** Custom includes paths */
  includes: string | string[];
}

const defaults: Options = {
  extensions: [".scss", ".sass"],
  format: "compressed",
  options: {},
  includes: [],
};

/** A plugin to use SASS in Lume */
export default function (userOptions?: Partial<Options>) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    const includes = Array.isArray(options.includes)
      ? options.includes.map((path) => site.src(path))
      : [site.src(options.includes)];

    site.loadAssets(options.extensions);
    site.process(options.extensions, sass);

    function sass(page: Page) {
      const { content, filename, enableSourceMap } = prepareAsset(site, page);

      const sassOptions: denosass.StringOptions<"sync"> = {
        ...options.options,
        sourceMap: enableSourceMap,
        loadPaths: [...includes, posix.dirname(filename)],
        style: options.format,
        syntax: page.src.ext === ".sass" ? "indented" : "scss",
        url: toFileUrl(filename),
      };

      const output = denosass.compileString(content, sassOptions);

      saveAsset(site, page, output.css, output.sourceMap);
      page.data.url = replaceExtension(page.data.url, ".css");
    }
  };
}
