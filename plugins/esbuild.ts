import {
  MediaType,
  RequestedModuleType,
  ResolutionMode,
  Workspace,
} from "../deps/deno_loader.ts";
import { getPathAndExtension, normalizePath } from "../core/utils/path.ts";
import { merge } from "../core/utils/object.ts";
import { log, warnUntil } from "../core/utils/log.ts";
import { bytes } from "../core/utils/format.ts";
import { browsers, versionString } from "../core/utils/browsers.ts";
import {
  build,
  BuildOptions,
  Loader,
  Metafile,
  OutputFile,
  stop,
} from "../deps/esbuild.ts";
import { extname, fromFileUrl, posix, toFileUrl } from "../deps/path.ts";
import { prepareAsset, saveAsset } from "./source_maps.ts";
import { Page } from "../core/file.ts";
import textLoader from "../core/loaders/text.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** File extensions to bundle */
  extensions?: string[];

  /**
   * The options for esbuild
   * @see https://esbuild.github.io/api/#general-options
   */
  options?: BuildOptions;

  /**
   * The Deno config file to use
   */
  denoConfig?: string;
}

// Default options
export const defaults: Options = {
  extensions: [".ts", ".js", ".tsx", ".jsx"],
  options: {
    plugins: [],
    bundle: true,
    format: "esm",
    minify: true,
    keepNames: true,
    platform: "browser",
    target: [
      `chrome${versionString(browsers.chrome)}`,
      `edge${versionString(browsers.edge)}`,
      `firefox${versionString(browsers.firefox)}`,
      `ios${versionString(browsers.safari_ios)}`,
      `safari${versionString(browsers.safari)}`,
    ],
    treeShaking: true,
    jsx: "automatic",
    outdir: "./",
    outbase: ".",
  },
};

let resolver: ((specifier: string, referrer?: string) => string) | undefined;

interface EntryPoint {
  in: string;
  out: string;
  content: string;
}

/**
 * A plugin to use esbuild in Lume
 * @see https://lume.land/plugins/esbuild/
 */
export function esbuild(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.hooks.addEsbuildPlugin = (plugin) => {
      options.options.plugins!.unshift(plugin);
    };

    const basePath = options.options.absWorkingDir || site.src();
    let configPath: string | undefined;

    // Use deno.json to configure esbuild options
    try {
      const denoJson = options.denoConfig
        ? site.root(options.denoConfig)
        : site.root("deno.json");

      const content = Deno.readTextFileSync(denoJson);
      const config = JSON.parse(content);
      const { compilerOptions } = config;

      options.options.jsxImportSource ??= compilerOptions.jsxImportSource;
      options.options.jsx ??= compilerOptions.jsx;
      configPath = denoJson;
    } catch {
      // deno.json doesn't exist.
    }

    async function runEsbuild(
      pages: Page[],
    ): Promise<[OutputFile[], Metafile, boolean]> {
      let sourcemap;
      const entryPoints: EntryPoint[] = [];

      pages.forEach((page) => {
        const { content, filename, enableSourceMap } = prepareAsset(site, page);
        if (enableSourceMap) {
          sourcemap = "external";
        }

        let [out] = getPathAndExtension(page.outputPath);
        if (out.startsWith("/")) {
          out = out.slice(1); // This prevents Esbuild to generate urls with _.._/_.._/
        }

        entryPoints.push({ in: toFileUrl(filename).toString(), out, content });
      });

      const buildOptions: BuildOptions = {
        ...options.options,
        write: false,
        metafile: true,
        absWorkingDir: basePath,
        entryPoints: entryPoints.map((p) => ({ in: p.in, out: p.out })),
        sourcemap,
      };

      buildOptions.plugins = [...options.options.plugins || []];
      buildOptions.plugins!.push(
        {
          name: "lume-loader",
          async setup(build) {
            const workspace = new Workspace({
              configPath,
              nodeConditions: build.initialOptions.conditions,
            });

            const loader = await workspace.createLoader();
            await loader.addEntrypoints(entryPoints.map((ep) => ep.in));

            build.onResolve(
              { filter: /.*/ },
              async ({ kind, path, importer }) => {
                // Entry points are already loaded by Lume
                if (kind === "entry-point") {
                  const entryPoint = entryPoints.find((entry) =>
                    entry.in === path
                  );

                  return {
                    path: path.startsWith("file:") ? fromFileUrl(path) : path,
                    namespace: "file",
                    pluginData: { entryPoint },
                  };
                }

                // Other imports are resolved by Deno loader
                const mode =
                  kind === "require-call" || kind === "require-resolve"
                    ? ResolutionMode.Require
                    : ResolutionMode.Import;

                const res = await loader.resolve(path, importer, mode);

                let namespace: string | undefined;
                if (res.startsWith("file:")) {
                  namespace = "file";
                } else if (res.startsWith("http:")) {
                  namespace = "http";
                } else if (res.startsWith("https:")) {
                  namespace = "https";
                } else if (res.startsWith("npm:")) {
                  namespace = "npm";
                } else if (res.startsWith("jsr:")) {
                  namespace = "jsr";
                } else if (res.startsWith("data:")) {
                  namespace = "data";
                }

                const resolved = res.startsWith("file:")
                  ? fromFileUrl(res)
                  : res;

                return {
                  path: resolved,
                  namespace,
                };
              },
            );

            build.onLoad(
              { filter: /.*/ },
              async ({ path, pluginData, namespace, with: withAttr }) => {
                // If the file is an entry point, return its content
                if (pluginData?.entryPoint) {
                  return {
                    contents: pluginData.entryPoint.content,
                    loader: getLoader(path),
                  };
                }

                // If it's a file, check if it's already loaded by Lume
                if (namespace === "file") {
                  const src = normalizePath(path, basePath);
                  const entry = site.fs.entries.get(src);

                  if (entry) {
                    const { content } = await entry.getContent(textLoader);

                    return {
                      contents: content,
                      loader: getLoader(path),
                    };
                  }
                }

                // Load the module with the Deno loader
                const url = namespace === "file"
                  ? toFileUrl(path).toString()
                  : path;

                // Load the file from the workspace's loader
                const moduleType = getModuleType(withAttr);
                const res = await loader.load(url, moduleType);
                if (res.kind === "external") {
                  return null;
                }
                return {
                  contents: res.code,
                  loader: mediaToLoader(res.mediaType),
                };
              },
            );
          },
        },
      );

      const { outputFiles, metafile, warnings, errors } = await build(
        buildOptions,
      );

      await stop();

      if (errors.length) {
        log.error(`[esbuild plugin] ${errors.length} errors `);
      }

      if (warnings.length) {
        log.warn(
          `[esbuild plugin] ${warnings.length} warnings`,
        );
      }

      return [outputFiles || [], metafile!, !!sourcemap];
    }

    site.process(
      options.extensions,
      async function processEsbuild(pages, allPages) {
        const hasPages = warnUntil(
          `[esbuild plugin] No ${
            options.extensions.map((e) => e.slice(1).toUpperCase()).join(", ")
          } files found. Use <code>site.add()</code> to add files. For example: <code>site.add("script.js")</code>`,
          pages.length,
        );

        if (!hasPages) {
          return;
        }

        const [outputFiles, metafile, enableSourceMap] = await runEsbuild(
          pages,
        );

        const item = site.debugBar?.buildItem(
          "[esbuild plugin] Build completed",
        );

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
          const content = options.options.bundle
            ? outputFile.text
            : resolveImports(
              outputFile.text,
              output.entryPoint
                ? relativePathFromUri(output.entryPoint, basePath)
                : outputPath,
              outputPath,
              basePath,
              metafile,
            );

          // Get the associated source map
          const map = enableSourceMap
            ? outputFiles.find((f) => f.path === `${outputFile.path}.map`)
            : undefined;

          // Search the entry point of this output file
          let entryPoint: Page | undefined;

          if (output.entryPoint) {
            const outputRelativeEntryPoint = relativePathFromUri(
              output.entryPoint,
              basePath,
            );

            entryPoint = pages.find((page) =>
              page.sourcePath === outputRelativeEntryPoint ||
              (page.sourcePath === "(generated)" &&
                page.outputPath === outputRelativeEntryPoint)
            );
          }

          // The page is a chunk
          if (!entryPoint) {
            const page = Page.create({ url: normalizedOutPath });
            saveAsset(site, page, content, map?.text);
            allPages.push(page);
            continue;
          }

          if (item) {
            item.items ??= [];
            item.items.push({
              title: normalizedOutPath,
              details: bytes(outputFile.contents.length),
              items: Object.entries(output.inputs)
                .map(([title, { bytesInOutput }]) => ({
                  title,
                  details: bytes(bytesInOutput),
                })),
            });
          }

          // The page is an entry point
          entryPoint.data.url = normalizedOutPath;
          saveAsset(site, entryPoint, content, map?.text);
        }
      },
    );
  };
}

function relativePathFromUri(uri: string, basePath?: string): string {
  if (uri.startsWith("deno:")) {
    uri = uri.slice("deno:".length);
  }

  if (uri.startsWith("file://")) {
    uri = fromFileUrl(uri);
  }

  return normalizePath(uri, basePath);
}

function resolveImports(
  source: string,
  sourcePath: string,
  outputPath: string,
  basePath: string,
  metafile: Metafile,
): string {
  source = source.replaceAll(
    /\bfrom\s*["']([^"']+)["']/g,
    (_, path) =>
      `from "${
        resolveImport(path, sourcePath, outputPath, basePath, metafile)
      }"`,
  );

  source = source.replaceAll(
    /\bimport\s*["']([^"']+)["']/g,
    (_, path) =>
      `import "${
        resolveImport(path, sourcePath, outputPath, basePath, metafile)
      }"`,
  );

  source = source.replaceAll(
    /\bimport\([\s\n]*["']([^"']+)["'](?=[\s\n]*[,)])/g,
    (_, path) =>
      `import("${
        resolveImport(path, sourcePath, outputPath, basePath, metafile)
      }"`,
  );

  return source;
}

function resolveImport(
  importPath: string,
  sourcePath: string,
  outputPath: string,
  basePath: string,
  metafile: Metafile,
): string {
  if (importPath.startsWith(".") || importPath.startsWith("/")) {
    const sourcePathOfImport = posix.join(
      "/",
      posix.dirname(sourcePath),
      importPath,
    );

    const outputOfImport = Object.entries(metafile.outputs)
      .find(([_, output]) => {
        if (!output.entryPoint) {
          return false;
        }

        const outputRelativeEntryPoint = relativePathFromUri(
          output.entryPoint,
          basePath,
        );

        return outputRelativeEntryPoint === sourcePathOfImport;
      });

    if (!outputOfImport) {
      return importPath;
    }

    const outputPathOfImport = outputOfImport[0];
    const relativeOutputPathOfImport = posix.relative(
      posix.dirname(outputPath),
      outputPathOfImport,
    );

    return "./" + relativeOutputPathOfImport;
  }

  return resolve(importPath, "").path;
}

function resolve(path: string, referrer: string) {
  if (referrer && resolver) {
    path = resolver(path, referrer) || path;
  }

  return {
    path,
    namespace: "deno",
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

function mediaToLoader(type: MediaType): Loader {
  switch (type) {
    case MediaType.Jsx:
      return "jsx";
    case MediaType.JavaScript:
    case MediaType.Mjs:
    case MediaType.Cjs:
      return "js";
    case MediaType.TypeScript:
    case MediaType.Mts:
    case MediaType.Dmts:
    case MediaType.Dcts:
      return "ts";
    case MediaType.Tsx:
      return "tsx";
    case MediaType.Css:
      return "css";
    case MediaType.Json:
      return "json";
    case MediaType.Html:
      return "default";
    case MediaType.Sql:
      return "default";
    case MediaType.Wasm:
      return "binary";
    case MediaType.SourceMap:
      return "json";
    case MediaType.Unknown:
      return "default";
    default:
      return "default";
  }
}

function getModuleType(withArgs: Record<string, string>): RequestedModuleType {
  switch (withArgs.type) {
    case "text":
      return RequestedModuleType.Text;
    case "bytes":
      return RequestedModuleType.Bytes;
    case "json":
      return RequestedModuleType.Json;
    default:
      return RequestedModuleType.Default;
  }
}

export default esbuild;
