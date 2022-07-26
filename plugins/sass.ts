import { merge } from "../core/utils.ts";
import denosass from "../deps/denosass.ts";
import { posix, toFileUrl } from "../deps/path.ts";
import { Page } from "../core/filesystem.ts";

import type { Site } from "../core.ts";

type SassOptions = Omit<denosass.StringOptions<"sync">, "url" | "syntax">;

export interface Options {
  /** Extensions processed by this plugin */
  extensions: string[];

  /** Set `true` to generate source map files */
  sourceMap: boolean;

  /** Output format */
  format: "compressed" | "expanded";

  /** SASS options */
  options: SassOptions;

  /** Custom includes paths */
  includes: string | string[];
}

const defaults: Options = {
  extensions: [".scss", ".sass"],
  sourceMap: false,
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
      const code = page.content as string;
      const filename = site.src(page.src.path + page.src.ext);
      const sassOptions: denosass.StringOptions<"sync"> = {
        ...options.options,
        sourceMap: options.sourceMap,
        loadPaths: [...includes, posix.dirname(filename)],
        style: options.format,
        syntax: page.src.ext === ".sass" ? "indented" : "scss",
        url: toFileUrl(filename),
      };

      const output = denosass.compileString(code, sassOptions);

      page.content = output.css;
      page.updateDest({ ext: ".css" });

      if (output.sourceMap) {
        page.content += `\n/*# sourceMappingURL=${
          posix.basename(page.dest.path)
        }.css.map */`;

        // Add a `file` property to the sourcemap
        output.sourceMap.file = page.dest.path + page.dest.ext;
        const base = toFileUrl(posix.dirname(filename)).href;

        // sass source-maps use file URLs (eg. "file:///foo/bar"), but
        // relative paths (eg. "../bar") look better in the dev-tools.
        // Also, the sass CLI tool produces relative paths.
        output.sourceMap.sources = output.sourceMap.sources.map(
          (fileUrl: string) => posix.relative(base, fileUrl),
        );

        site.pages.push(Page.create(
          page.dest.path + ".css.map",
          JSON.stringify(output.sourceMap),
        ));
      }
    }
  };
}
