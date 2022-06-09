import { getDenoConfig, merge, toUrl } from "../core/utils.ts";
import * as esbuild from "../deps/esbuild.ts";
import { extname } from "../deps/path.ts";

import type { Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** The options for esbuild */
  options: esbuild.BuildOptions;
}

const denoConfig = await getDenoConfig();
const importMapURL = denoConfig?.importMap
  ? await toUrl(denoConfig.importMap)
  : undefined;

// Default options
const defaults: Options = {
  extensions: [".ts", ".js"],
  options: {
    plugins: [esbuild.denoPlugin({ importMapURL })],
    bundle: true,
    format: "esm",
    minify: true,
    keepNames: true,
    platform: "browser",
    target: "esnext",
    incremental: true,
    treeShaking: true,
  },
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions);

    const lumeLoaderPlugin = {
      name: "lumeLoader",
      // deno-lint-ignore no-explicit-any
      setup(build: any) {
        // deno-lint-ignore no-explicit-any
        build.onLoad({ filter: /^file:/ }, async (args: any) => {
          const root = await toUrl(site.src(), false);
          const path = args.path.replace(root, "");
          const content = await site.getContent(path);

          if (content) {
            return {
              contents: content,
              loader: getLoader(path),
            };
          }
        });
      },
    };
    options.options.plugins?.unshift(lumeLoaderPlugin);

    site.addEventListener("beforeSave", () => esbuild.stop());

    site.process(options.extensions, async (page) => {
      const name = `${page.src.path}${page.src.ext}`;
      const filename = await toUrl(site.src(name), false);
      site.logger.log("📦", name);

      const buildOptions: esbuild.BuildOptions = {
        ...options.options,
        write: false,
        incremental: false,
        watch: false,
        metafile: false,
        entryPoints: [filename.href],
      };

      const { outputFiles, warnings, errors } = await esbuild.build(
        buildOptions,
      );

      if (errors.length) {
        site.logger.warn("esbuild errors", { errors });
      }

      if (warnings.length) {
        site.logger.warn("esbuild warnings", { warnings });
      }

      if (outputFiles?.length) {
        page.content = outputFiles[0].text;
        page.updateDest({ ext: ".js" });
      }
    });
  };
}

function getLoader(path: string) {
  const ext = extname(path).replace(".", "").toLowerCase();

  switch (ext) {
    case "mjs":
      return "js";
    case "mts":
      return "ts";
    default:
      return ext;
  }
}
