import {
  isAbsolutePath,
  isUrl,
  merge,
  normalizePath,
  readDenoConfig,
  replaceExtension,
} from "../core/utils.ts";
import { build, BuildOptions, OutputFile, stop } from "../deps/esbuild.ts";
import { extname, fromFileUrl, posix, toFileUrl } from "../deps/path.ts";
import { prepareAsset, saveAsset } from "./source_maps.ts";
import { Page } from "../core/filesystem.ts";
import textLoader from "../core/loaders/text.ts";

import type { DenoConfig, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /**
   * Global options for esm.sh CDN used to fetch NPM packages
   * @see https://esm.sh/#docs
   */
  esm: EsmOptions;

  /** The options for esbuild */
  options: BuildOptions;
}

export interface EsmOptions {
  /** To include the ?dev option to all packages */
  dev?: boolean;

  /** Configure the cjs-exports option for each package */
  cjsExports?: Record<string, string[] | string>;

  /** Configure the deps for each package */
  deps?: Record<string, string[] | string>;
}

const denoConfig = await readDenoConfig();

// Default options
const defaults: Options = {
  extensions: [".ts", ".js"],
  esm: {},
  options: {
    plugins: [],
    bundle: true,
    format: "esm",
    minify: true,
    keepNames: true,
    platform: "browser",
    target: "esnext",
    treeShaking: true,
  },
};

const contentSymbol = Symbol.for("contentSymbol");

interface LumeBuildOptions extends BuildOptions {
  [contentSymbol]: Record<string, string>;
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

  // Sync the jsxDev option with esm.dev
  if (options.esm.dev) {
    options.options.jsxDev = true;
  } else if (options.options.jsxDev) {
    options.esm.dev = true;
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
          const { path, importer } = args;

          // Absolute url
          if (isUrl(path)) {
            return {
              path: import.meta.resolve(path),
              namespace: "deno",
            };
          }

          // Resolve the relative url
          if (isUrl(importer) && path.match(/^[./]/)) {
            return {
              path: import.meta.resolve(new URL(path, importer).href),
              namespace: "deno",
            };
          }

          // It's a npm package
          if (path.startsWith("npm:")) {
            const name = path.replace(/^npm:/, "");
            const url = new URL(`https://esm.sh/${name}`);

            if (options.esm.dev) {
              url.searchParams.set("dev", "true");
            }

            // cjs exports
            const cjs_exports = options.esm.cjsExports?.[name];

            if (cjs_exports) {
              url.searchParams.set(
                "cjs-exports",
                Array.isArray(cjs_exports)
                  ? cjs_exports.join(",")
                  : cjs_exports,
              );
            }

            // deps
            const deps = options.esm.deps?.[name];

            if (deps) {
              url.searchParams.set(
                "deps",
                Array.isArray(deps) ? deps.join(",") : deps,
              );
            }

            return {
              path: url.href,
              namespace: "deno",
            };
          }

          if (!isUrl(path)) {
            return {
              path: isAbsolutePath(path)
                ? toFileUrl(path).href
                : import.meta.resolve(path),
              namespace: "deno",
            };
          }

          return {
            path: import.meta.resolve(path),
            namespace: "deno",
          };
        });

        build.onLoad({ filter: /.*/ }, async (args: LoadArguments) => {
          let { path, namespace } = args;

          // It's one of the entry point files
          if (initialOptions[contentSymbol][path]) {
            return {
              contents: initialOptions[contentSymbol][path],
              loader: getLoader(path),
            };
          }

          // Read files from Lume
          if (namespace === "deno") {
            if (path.startsWith(prefix)) {
              const file = path.replace(prefix, "");
              const content = await site.getContent(file, textLoader);

              if (content) {
                return {
                  contents: content,
                  loader: getLoader(path),
                };
              }
            }
          }

          // Convert file:// urls to paths
          if (path.startsWith("file://")) {
            path = normalizePath(fromFileUrl(path));
          }

          // Read other files from the filesystem/url
          const content = await readFile(path);
          return {
            contents: content,
            loader: getLoader(path),
          };
        });
      },
    };
    options.options.plugins?.unshift(lumeLoaderPlugin);

    site.hooks.addEsbuildPlugin = (plugin) => {
      options.options.plugins?.push(plugin);
    };

    /** Run esbuild and returns the output files */
    async function runEsbuild(
      pages: Page[],
      extraOptions: BuildOptions = {},
    ): Promise<[OutputFile[], boolean]> {
      let enableAllSourceMaps = false;
      const entryContent: Record<string, string> = {};
      const entryPoints: string[] = [];

      pages.forEach((page) => {
        const { content, filename, enableSourceMap } = prepareAsset(site, page);
        if (enableSourceMap) {
          enableAllSourceMaps = true;
        }
        entryPoints.push(filename);
        entryContent[toFileUrl(filename).href] = content;
      });

      const buildOptions: LumeBuildOptions = {
        ...options.options,
        write: false,
        metafile: false,
        entryPoints,
        sourcemap: enableAllSourceMaps ? "external" : undefined,
        ...extraOptions,
        [contentSymbol]: entryContent,
      };

      const { outputFiles, warnings, errors } = await build(
        // @ts-expect-error: esbuild uses a SameShape type to prevent the passing
        // of extra options (which we use to pass the entryContent)
        buildOptions,
      );

      if (errors.length) {
        site.logger.warn("esbuild errors", { errors });
      }

      if (warnings.length) {
        site.logger.warn("esbuild warnings", { warnings });
      }

      return [outputFiles || [], enableAllSourceMaps];
    }

    site.addEventListener("beforeSave", () => stop());

    // Splitting mode needs to run esbuild with all pages at the same time
    if (options.options.splitting) {
      // Define default options for splitting mode
      options.options.absWorkingDir ||= site.src();
      options.options.outdir ||= "./";
      options.options.outbase ||= ".";
      const basePath = options.options.absWorkingDir;

      site.processAll(options.extensions, async (pages, allPages) => {
        const [outputFiles, enableSourceMap] = await runEsbuild(pages);

        // Save the output code
        outputFiles?.forEach((file) => {
          if (file.path.endsWith(".map")) {
            return;
          }

          // Search the entry point of this output file
          const url = normalizePath(
            normalizePath(file.path).replace(basePath, ""),
          );
          const urlWithoutExt = pathWithoutExtension(url);
          const entryPoint = pages.find((page) => {
            const outdir = posix.join(
              "/",
              options.options.outdir || ".",
              pathWithoutExtension(page.data.url as string),
            );

            return outdir === urlWithoutExt;
          });

          // Get the associated source map
          const map = enableSourceMap
            ? outputFiles.find((f) => f.path === `${file.path}.map`)
            : undefined;

          // The page is an entry point
          if (entryPoint) {
            entryPoint.data.url = url; // Update the url to .js extension
            saveAsset(site, entryPoint, file.text, map?.text);
          } else {
            // The page is a chunk
            const page = Page.create(url, "");
            saveAsset(site, page, file.text, map?.text);
            allPages.push(page);
          }
        });
      });
    } else {
      // Normal mode runs esbuild for each page
      site.process(options.extensions, async (page) => {
        const [outputFiles] = await runEsbuild([page], {
          outfile: replaceExtension(page.outputPath!, ".js") as string,
        });

        let mapFile: OutputFile | undefined;
        let jsFile: OutputFile | undefined;

        outputFiles?.forEach((file) => {
          if (file.path.endsWith(".map")) {
            mapFile = file;
          } else {
            jsFile = file;
          }
        });

        saveAsset(site, page, jsFile?.text!, mapFile?.text);
        page.data.url = replaceExtension(page.data.url, ".js");
      });
    }
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

function pathWithoutExtension(path: string): string {
  return path.replace(/\.\w+$/, "");
}

const cache = new Map<string, string | Uint8Array>();

export async function readFile(path: string): Promise<string | Uint8Array> {
  if (!isUrl(path)) {
    return await Deno.readTextFile(path);
  }

  if (!cache.has(path)) {
    const response = await fetch(path);
    const content = await response.text();
    cache.set(path, content);
  }

  return cache.get(path)!;
}
