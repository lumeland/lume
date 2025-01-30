import {
  getPathAndExtension,
  isAbsolutePath,
  isUrl,
  normalizePath,
} from "../core/utils/path.ts";
import { merge } from "../core/utils/object.ts";
import { readDenoConfig } from "../core/utils/deno_config.ts";
import { log } from "../core/utils/log.ts";
import {
  build,
  BuildOptions,
  denoPlugins,
  Metafile,
  OutputFile,
  stop,
} from "../deps/esbuild.ts";
import {
  dirname,
  extname,
  fromFileUrl,
  join,
  posix,
  toFileUrl,
} from "../deps/path.ts";

import { prepareAsset, saveAsset } from "./source_maps.ts";
import { Page } from "../core/file.ts";

import type Site from "../core/site.ts";
import type { DenoConfig, ImportMap } from "../core/utils/deno_config.ts";
import { readFile } from "../core/utils/read.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /**
   * The options for esbuild
   * @see https://esbuild.github.io/api/#general-options
   */
  options?: BuildOptions;

  /**
   * The import map to use
   * By default, it reads the import map from the deno.json file
   */
  importMap?: ImportMap | false;
}

export interface EsmOptions {
  /** To include the ?dev option to all packages */
  dev?: boolean;

  /** Configure the cjs-exports option for each package */
  cjsExports?: Record<string, string[] | string>;

  /** Configure the deps for each package */
  deps?: Record<string, string[] | string>;

  /** Configure the target for each package */
  target?: "es2015" | "es2022" | "esnext" | "deno" | "denonext";
}

const denoConfig = await readDenoConfig();

// Default options
export const defaults: Options = {
  extensions: [".ts", ".js"],
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

let resolver: ((specifier: string, referrer?: string) => string) | undefined;

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

  return (site: Site) => {
    // Get the import map
    const importMap: ImportMap = options.importMap || denoConfig?.importMap ||
      { imports: {} };

    for (const [key, value] of Object.entries(importMap.imports || {})) {
      if (value.startsWith(".")) {
        importMap.imports[key] = toFileUrl(site.root(value)).href;
      }
    }

    site.add(options.extensions);

    site.hooks.addEsbuildPlugin = (plugin) => {
      options.options.plugins!.unshift(plugin);
    };

    site.addEventListener("beforeSave", stop);

    const basePath = options.options.absWorkingDir || site.src();

    /** Run esbuild and returns the output files */
    const entryContent: Record<string, string> = {};

    async function runEsbuild(
      pages: Page[],
    ): Promise<[OutputFile[], Metafile, boolean]> {
      let enableAllSourceMaps = false;
      const entryPoints: { in: string; out: string }[] = [];

      pages.forEach((page) => {
        const { content, filename, enableSourceMap } = prepareAsset(site, page);
        if (enableSourceMap) {
          enableAllSourceMaps = true;
        }

        let outUri = getPathAndExtension(page.outputPath)[0];
        if (outUri.startsWith("/")) {
          outUri = outUri.slice(1); // This prevents Esbuild to generate urls with _.._/_.._/
        }

        entryPoints.push({ in: filename, out: outUri });
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

      buildOptions.plugins!.push(
        {
          name: "lume-loader",
          setup(build) {
            build.onResolve({ filter: /.*/ }, (args) => {
              const { path, importer } = args;

              if (path.startsWith("npm:") || path.startsWith("jsr:")) {
                return undefined;
              }

              if (path.startsWith("data:")) {
                return {
                  path,
                  namespace: "url",
                };
              }

              // Resolve the relative url
              const specifier = path.match(/^[./]/)
                ? isUrl(importer)
                  ? new URL(path, importer).href
                  : toFileUrl(join(importer ? dirname(importer) : "", path))
                    .href
                : isUrl(path)
                ? path
                : isAbsolutePath(path)
                ? toFileUrl(path).href
                : undefined;

              if (!specifier) {
                return undefined;
              }

              if (specifier.startsWith("file://")) {
                return {
                  path: fromFileUrl(specifier),
                };
              } else {
                return {
                  path: specifier,
                  namespace: "url",
                };
              }
            });

            build.onLoad({ filter: /.*/ }, async (args) => {
              const { path, namespace } = args;

              // It's an URL
              if (namespace === "url") {
                // Read other files from the filesystem/url
                const content = await readFile(path);
                return {
                  contents: content,
                  loader: getLoader(path),
                };
              }

              if (path.startsWith("npm:") || path.startsWith("jsr:")) {
                return undefined;
              }

              const content = await site.getContent(path, false);

              return content
                ? {
                  contents: content,
                  loader: getLoader(path),
                }
                : undefined;
            });
          },
        },
        ...denoPlugins({
          importMapURL: `data:application/json,${JSON.stringify(importMap)}`,
        }),
      );

      const { outputFiles, metafile, warnings, errors } = await build(
        buildOptions,
      );

      if (errors.length) {
        log.error(`[esbuild plugin] ${errors.length} errors `);
      }

      if (warnings.length) {
        log.warn(
          `[esbuild plugin] ${warnings.length} warnings`,
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

        // The page is an entry point
        entryPoint.data.url = normalizedOutPath;
        saveAsset(site, entryPoint, content, map?.text);
      }
    });
  };
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

export default esbuild;
