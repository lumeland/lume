import {
  isAbsolutePath,
  isUrl,
  normalizePath,
  replaceExtension,
} from "../core/utils/path.ts";
import { merge } from "../core/utils/object.ts";
import { readDenoConfig } from "../core/utils/deno_config.ts";
import { log } from "../core/utils/log.ts";
import { readFile } from "../core/utils/read.ts";
import {
  build,
  BuildOptions,
  Metafile,
  OutputFile,
  stop,
} from "../deps/esbuild.ts";
import { dirname, extname, fromFileUrl, toFileUrl } from "../deps/path.ts";
import { prepareAsset, saveAsset } from "./source_maps.ts";
import { Page } from "../core/file.ts";
import textLoader from "../core/loaders/text.ts";

import type Site from "../core/site.ts";
import type { DenoConfig } from "../core/utils/deno_config.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /**
   * Global options for esm.sh CDN used to fetch NPM packages
   * @see https://esm.sh/#docs
   */
  esm?: EsmOptions;

  /**
   * The options for esbuild
   * @see https://esbuild.github.io/api/#general-options
   */
  options?: BuildOptions;
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
export const defaults: Options = {
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
    outdir: "./",
    outbase: ".",
  },
};

/**
 * A plugin to use esbuild in Lume
 * @see https://lume.land/plugins/esbuild/
 */
export function esbuild(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  // Configure jsx automatically
  if (
    options.extensions.some((ext) =>
      ext.endsWith(".tsx") || ext.endsWith(".jsx")
    )
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

    function resolve(path: string) {
      path = import.meta.resolve(path);
      const esmSpecifier = handleEsm(path, options.esm);

      return {
        path: esmSpecifier || path,
        namespace: "deno",
      };
    }

    site.hooks.addEsbuildPlugin = (plugin) => {
      options.options.plugins!.unshift(plugin);
    };

    site.addEventListener("beforeSave", stop);

    const basePath = options.options.absWorkingDir || site.src();

    const prefix = toFileUrl(site.src()).href;

    /** Run esbuild and returns the output files */
    const entryContent: Record<string, string> = {};

    async function runEsbuild(
      pages: Page[],
    ): Promise<[OutputFile[], Metafile, boolean]> {
      let enableAllSourceMaps = false;
      const entryPoints: string[] = [];

      pages.forEach((page) => {
        const { content, filename, enableSourceMap } = prepareAsset(site, page);
        if (enableSourceMap) {
          enableAllSourceMaps = true;
        }
        entryPoints.push(filename);
        entryContent[toFileUrl(filename).href] = content;
      });

      const buildOptions: BuildOptions = {
        ...options.options,
        write: false,
        metafile: true,
        absWorkingDir: basePath,
        entryPoints,
        sourcemap: enableAllSourceMaps ? "external" : undefined,
      };

      buildOptions.plugins!.push({
        name: "lume-loader",
        // deno-lint-ignore no-explicit-any
        setup(build: any) {
          build.onResolve({ filter: /.*/ }, (args: ResolveArguments) => {
            const { path, importer } = args;

            // Absolute url
            if (isUrl(path)) {
              return resolve(path);
            }

            // Resolve the relative url
            if (isUrl(importer) && path.match(/^[./]/)) {
              return resolve(new URL(path, importer).href);
            }

            // It's a npm package
            if (path.startsWith("npm:")) {
              return resolve(path);
            }

            if (!isUrl(path)) {
              return resolve(
                isAbsolutePath(path) ? toFileUrl(path).href : path,
              );
            }

            return resolve(path);
          });

          build.onLoad({ filter: /.*/ }, async (args: LoadArguments) => {
            let { path, namespace } = args;

            // It's one of the entry point files
            if (entryContent[path]) {
              return {
                contents: entryContent[path],
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
      });

      const { outputFiles, metafile, warnings, errors } = await build(
        buildOptions,
      );

      if (errors.length) {
        log.error(`[esbuild plugin] Build errors: \n${errors.join("\n")}`);
      }

      if (warnings.length) {
        log.warn(
          `[esbuild plugin] Build warnings: \n${warnings.join("\n")}`,
        );
      }

      return [outputFiles || [], metafile!, enableAllSourceMaps];
    }

    site.process(options.extensions, async (pages, allPages) => {
      const [outputFiles, metafile, enableSourceMap] = await runEsbuild(pages);

      // Save the output code
      for (const [outputPath, output] of Object.entries(metafile.outputs)) {
        if (outputPath.endsWith(".map")) {
          continue;
        }

        const normalizedOutPath = normalizePath(outputPath);
        const outputFile = outputFiles.find((file) => {
          const relativeFilePath = normalizePath(
            normalizePath(file.path).replace(basePath, ""),
          );

          return relativeFilePath === normalizedOutPath;
        });
        if (!outputFile) {
          log.error(
            `[esbuild plugin] Could not match the metafile ${normalizedOutPath} to an output file.`,
          );
          continue;
        }

        // Replace .tsx and .jsx extensions with .js
        const content = (!options.options.splitting && !options.options.bundle)
          ? resolveImports(outputFile.text, options.esm)
          : outputFile.text;

        // Get the associated source map
        const map = enableSourceMap
          ? outputFiles.find((f) => f.path === `${outputFile.path}.map`)
          : undefined;

        // The page is a chunk
        if (!output.entryPoint) {
          const page = Page.create({ url: normalizedOutPath });
          saveAsset(site, page, content, map?.text);
          allPages.push(page);
          continue;
        }

        let outputRelativeEntryPoint = output.entryPoint;
        if (outputRelativeEntryPoint.startsWith("deno:")) {
          outputRelativeEntryPoint = outputRelativeEntryPoint.slice(
            "deno:".length,
          );
        }
        if (outputRelativeEntryPoint.startsWith(prefix)) {
          outputRelativeEntryPoint = outputRelativeEntryPoint.slice(
            prefix.length,
          );
        }
        if (outputRelativeEntryPoint.startsWith("file://")) {
          outputRelativeEntryPoint = fromFileUrl(outputRelativeEntryPoint);
        }
        outputRelativeEntryPoint = normalizePath(
          outputRelativeEntryPoint,
          basePath,
        );

        // Search the entry point of this output file
        const entryPoint = pages.find((page) =>
          page.sourcePath === outputRelativeEntryPoint
        );
        if (!entryPoint) {
          log.error(
            `[esbuild plugin] Could not match the entrypoint ${outputRelativeEntryPoint} of metafile ${normalizedOutPath} to an page.`,
          );
          continue;
        }

        // The page is an entry point
        entryPoint.data.url = normalizedOutPath.replaceAll(
          dirname(entryPoint.sourcePath) + "/",
          dirname(entryPoint.data.url) + "/",
        );
        saveAsset(site, entryPoint, content, map?.text);
      }
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
    case ".json":
      return "json";
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

function resolveImports(
  content: string,
  esm: EsmOptions,
): string {
  return content.replaceAll(
    /(from\s*)["']([^"']+)["']/g,
    (_, from, path) => {
      if (path.startsWith(".") || path.startsWith("/")) {
        const resolved = path.endsWith(".json")
          ? path
          : replaceExtension(path, ".js");
        return `${from}"${resolved}"`;
      }
      const resolved = import.meta.resolve(path);
      return `${from}"${handleEsm(resolved, esm) || resolved}"`;
    },
  );
}

function handleEsm(path: string, options: EsmOptions): string | undefined {
  const match = path.match(/^(npm|jsr):(.*)$/);

  if (!match) {
    return;
  }

  const [, prefix, name] = match;
  const url = prefix === "npm"
    ? new URL(`https://esm.sh/${name}`)
    : new URL(`https://esm.sh/jsr/${name}`);

  if (options.dev) {
    url.searchParams.set("dev", "true");
  }

  // cjs exports
  const cjs_exports = options.cjsExports?.[name];

  if (cjs_exports) {
    url.searchParams.set(
      "cjs-exports",
      Array.isArray(cjs_exports) ? cjs_exports.join(",") : cjs_exports,
    );
  }

  // deps
  const deps = options.deps?.[name];

  if (deps) {
    url.searchParams.set(
      "deps",
      Array.isArray(deps) ? deps.join(",") : deps,
    );
  }

  return url.href;
}

export default esbuild;
