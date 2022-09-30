import { dynamicSourcesSymbol, merge, read } from "../core/utils.ts";
import { Page } from "../core/filesystem.ts";
import { basename, toFileUrl } from "../deps/path.ts";

import type { Site, SourceMap } from "../core.ts";

export interface Options {
  /** Set true to inline the source map in the output file */
  inline: boolean;

  /** Set true to include the content of the source files */
  sourceContent: boolean;
}

export const defaults: Options = {
  inline: false,
  sourceContent: false,
};

/** Generate the source map files of assets */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process("*", async (file: Page, files: Page[]) => {
      const sourceMap = file.data.sourceMap as SourceMap | undefined;
      file.data.sourceMap = undefined;

      if (!sourceMap) {
        return;
      }

      // Add the content of the source files
      try {
        if (options.sourceContent) {
          sourceMap.sourcesContent = await Promise.all(
            sourceMap.sources.map((url: string) => {
              const content = sourceMap[dynamicSourcesSymbol]?.[url];

              return content ? content : read(url, false);
            }),
          );
        }
      } catch (err) {
        console.error(err);
      }

      // Relative paths (eg. "../bar") look better in the dev-tools.
      sourceMap.sourceRoot = toFileUrl(site.root()).href;
      sourceMap.sources = sourceMap.sources.map((url: string) =>
        url.replace(sourceMap.sourceRoot!, "")
      );

      if (options.inline) {
        throw new Error("Inline source maps are not supported yet");
      }

      // Create a source map file
      const url = file.dest.path + file.dest.ext + ".map";
      sourceMap.file = url;
      file.content += `\n/*# sourceMappingURL=./${basename(url)} */`;
      files.push(Page.create(url, JSON.stringify(sourceMap)));
    });
  };
}
