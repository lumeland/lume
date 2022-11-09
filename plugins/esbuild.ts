import {
  merge,
  read,
  readDenoConfig,
  replaceExtension,
} from "../core/utils.ts";
import { build, BuildOptions, stop } from "../deps/esbuild.ts";
import { extname, toFileUrl } from "../deps/path.ts";
import { prepareAsset, saveAsset } from "./source_maps.ts";

import type { DenoConfig, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** The options for esbuild */
  options: BuildOptions;
}

const denoConfig = await readDenoConfig();

// Default options
const defaults: Options = {
  extensions: [".ts", ".js"],
  options: {
    plugins: [],
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

const contentSymbol = Symbol.for("contentSymbol");

interface LumeBuildOptions extends BuildOptions {
  [contentSymbol]: string;
}

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  // Configure jsx automatically
  if (
    options.extensions.includes(".tsx") || options.extensions.includes(".jsx")
  ) {
    options.options = {
      ...buildJsxConfig(denoConfig?.config),
      ...options.options,
    };
  }

  return (site: Site) => {
    site.loadAssets(options.extensions);

    const prefix = toFileUrl(site.src()).href;

    const lumeLoaderPlugin = {
      name: "lumeLoader",
      // deno-lint-ignore no-explicit-any
      setup(build: any) {
        const { initialOptions } = build;
        build.onResolve({ filter: /.*/ }, (args: ResolveArguments) => {
          let { path } = args;
          const { importer } = args;

          // Absolute url
          if (path.match(/^(https?):\/\//)) {
            return { path, namespace: "deno" };
          }

          // Resolve the relative url
          if (
            importer.match(/^(https?|file):\/\//) && path.match(/^[./]/)
          ) {
            path = new URL(path, importer).href;
          }

          // Resolve the import map
          path = import.meta.resolve(path);

          // It's a npm package
          if (path.startsWith("npm:")) {
            path = path.replace(/^npm:/, "https://esm.sh/");
          }

          return {
            path,
            namespace: "deno",
          };
        });

        build.onLoad({ filter: /.*/ }, async (args: LoadArguments) => {
          const { path, namespace } = args;

          // It's the entry point file
          if (
            path === initialOptions.entryPoints[0] &&
            initialOptions[contentSymbol]
          ) {
            return {
              contents: initialOptions[contentSymbol],
              loader: getLoader(path),
            };
          }

          // Read files from Lume
          if (namespace === "deno") {
            if (path.startsWith(prefix)) {
              const file = path.replace(prefix, "");
              const content = await site.getContent(file);

              if (content) {
                return {
                  contents: content,
                  loader: getLoader(path),
                };
              }
            }
          }

          // Read other files from the filesystem/url
          const content = await read(path, false);
          return {
            contents: content,
            loader: getLoader(path),
          };
        });
      },
    };
    options.options.plugins?.unshift(lumeLoaderPlugin);

    site.addEventListener("beforeSave", () => stop());

    site.process(options.extensions, async (page) => {
      const { content, filename, enableSourceMap } = prepareAsset(site, page);

      const buildOptions: LumeBuildOptions = {
        ...options.options,
        write: false,
        incremental: false,
        watch: false,
        metafile: false,
        entryPoints: [toFileUrl(filename).href],
        sourcemap: enableSourceMap ? "external" : undefined,
        outfile: `${page.dest.path}.js`,
        [contentSymbol]: content,
      };

      const { outputFiles, warnings, errors } = await build(
        buildOptions,
      );

      if (errors.length) {
        site.logger.warn("esbuild errors", { errors });
      }

      if (warnings.length) {
        site.logger.warn("esbuild warnings", { warnings });
      }

      // deno-lint-ignore no-explicit-any
      let mapFile: any, jsFile: any;

      outputFiles?.forEach((file) => {
        if (file.path.endsWith(".map")) {
          mapFile = file;
        } else {
          jsFile = file;
        }
      });

      saveAsset(site, page, jsFile?.text, mapFile?.text);
      page.data.url = replaceExtension(page.data.url, ".js");
    });
  };
}

function getLoader(path: string) {
  const ext = extname(path).toLowerCase();

  switch (ext) {
    case ".ts":
    case ".mts":
      return "ts";
    case ".tsx":
      return "tsx";
    case ".jsx":
      return "jsx";
    default:
      return "js";
  }
}

interface LoadArguments {
  path: string;
  namespace: string;
  suffix: string;
  pluginData: unknown;
}

interface ResolveArguments {
  path: string;
  importer: string;
  namespace: string;
  resolveDir: string;
  kind: string;
  pluginData: unknown;
}

function buildJsxConfig(config?: DenoConfig): BuildOptions | undefined {
  if (!config) {
    return;
  }

  const { compilerOptions } = config;

  if (compilerOptions?.jsxImportSource) {
    return {
      jsx: "automatic",
      jsxImportSource: compilerOptions.jsxImportSource,
    };
  }
}
