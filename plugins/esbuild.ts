import { getPathAndExtension, normalizePath } from "../core/utils/path.ts";
import { merge } from "../core/utils/object.ts";
import { log } from "../core/utils/log.ts";
import {
  build,
  BuildOptions,
  denoPlugins,
  Metafile,
  OutputFile,
  stop,
} from "../deps/esbuild.ts";
import { extname, fromFileUrl, join, posix } from "../deps/path.ts";
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
    target: "esnext",
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
    const configPath = options.denoConfig
      ? site.root(options.denoConfig)
      : undefined;

    try {
      const denoConfig = configPath ?? site.root("deno.json");
      const content = Deno.readTextFileSync(denoConfig);
      const config = JSON.parse(content);
      const { compilerOptions } = config;

      if (compilerOptions?.jsxImportSource) {
        options.options.jsxImportSource = compilerOptions.jsxImportSource;
      }
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

        entryPoints.push({ in: filename, out, content });
      });

      const buildOptions: BuildOptions = {
        ...options.options,
        write: false,
        metafile: true,
        absWorkingDir: basePath,
        entryPoints: entryPoints.map((p) => ({ in: p.in, out: p.out })),
        sourcemap,
      };

      buildOptions.plugins!.push(
        {
          name: "lume-loader",
          setup(build) {
            build.onResolve({ filter: /.*/ }, ({ kind, path, resolveDir }) => {
              if (kind === "entry-point") {
                const entryPoint = entryPoints.find((entry) =>
                  entry.in === path
                );

                return {
                  path,
                  pluginData: { entryPoint },
                };
              }

              if (path.startsWith(".")) {
                if (resolveDir) {
                  return {
                    path: join(resolveDir, path),
                  };
                }
              }
            });

            build.onLoad({ filter: /.*/ }, async ({ path, pluginData }) => {
              if (pluginData?.entryPoint) {
                return {
                  contents: pluginData.entryPoint.content,
                  loader: getLoader(path),
                };
              }

              // Load the file from the site
              const src = normalizePath(path, basePath);
              const entry = site.fs.entries.get(src);

              if (entry) {
                const { content } = await entry.getContent(textLoader);

                return {
                  contents: content,
                  loader: getLoader(path),
                };
              }
            });
          },
        },
        ...denoPlugins({
          configPath,
        }),
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
