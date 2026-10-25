import { getPathAndExtension, normalizePath, removeRoot } from "@lumeland/core/utils/path.ts";
import { merge } from "@lumeland/core/utils/object.ts";
import { log, warnUntil } from "@lumeland/core/utils/log.ts";
import { bytes } from "@lumeland/core/utils/format.ts";
import { browsers, versionString } from "@lumeland/core/utils/browsers.ts";
import { prepareAsset, saveAsset } from "@lumeland/plugin-source-maps";
import { Page } from "@lumeland/core/file.ts";
import lumeLoader from "./loader.ts";
import { build, BuildOptions, Metafile, OutputFile, stop } from "../deps/esbuild.ts";
import { posix, toFileUrl } from "../deps/path.ts";

import type Site from "@lumeland/core/site.ts";

export interface Options {
  /** File extensions to bundle */
  extensions?: string[];

  /**
   * The options for esbuild
   * @see https://esbuild.github.io/api/#general-options
   */
  options?: BuildOptions;
}

// Default options
export const defaults = {
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
} satisfies Options;

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

    async function runEsbuild(pages: Page[]): Promise<[OutputFile[], Metafile, boolean]> {
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

      buildOptions.plugins = [
        ...(options.options.plugins || []),
        lumeLoader({
          site,
          entryPoints,
        }),
      ];

      const { outputFiles, metafile, warnings, errors } = await build(buildOptions);

      await stop();

      if (errors.length) {
        log.error(`[esbuild plugin] ${errors.length} errors `);
      }

      if (warnings.length) {
        log.warn(`[esbuild plugin] ${warnings.length} warnings`);
      }

      return [outputFiles || [], metafile!, !!sourcemap];
    }

    site.process(options.extensions, async function processEsbuild(pages, allPages) {
      const hasPages = warnUntil(
        `[esbuild plugin] No ${options.extensions
          .map((e) => e.slice(1).toUpperCase())
          .join(
            ", ",
          )} files found. Use <code>site.add()</code> to add files. For example: <code>site.add("script.js")</code>`,
        pages.length,
      );

      if (!hasPages) {
        return;
      }

      const [outputFiles, metafile, enableSourceMap] = await runEsbuild(pages);

      const item = site.debugBar?.buildItem("[esbuild plugin] Build completed");

      // Save the output code
      for (const [outputPath, output] of Object.entries(metafile.outputs)) {
        if (outputPath.endsWith(".map")) {
          continue;
        }

        const normalizedOutPath = normalizePath(outputPath);
        const outputFile = outputFiles.find((file) => {
          const relativeFilePath = normalizePath(normalizePath(file.path).replace(basePath, ""));

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
              output.entryPoint ? removeRoot(basePath, output.entryPoint) : outputPath,
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
          const outputRelativeEntryPoint = removeRoot(basePath, output.entryPoint);

          entryPoint = pages.find(
            (page) =>
              page.sourcePath === outputRelativeEntryPoint ||
              (page.sourcePath === "(generated)" && page.outputPath === outputRelativeEntryPoint),
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
            items: Object.entries(output.inputs).map(([title, { bytesInOutput }]) => ({
              title,
              details: bytes(bytesInOutput),
            })),
          });
        }

        // The page is an entry point
        entryPoint.data.url = normalizedOutPath;
        saveAsset(site, entryPoint, content, map?.text);
      }
    });
  };
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
    (_, path) => `from "${resolveImport(path, sourcePath, outputPath, basePath, metafile)}"`,
  );

  source = source.replaceAll(
    /\bimport\s*["']([^"']+)["']/g,
    (_, path) => `import "${resolveImport(path, sourcePath, outputPath, basePath, metafile)}"`,
  );

  source = source.replaceAll(
    /\bimport\([\s\n]*["']([^"']+)["'](?=[\s\n]*[,)])/g,
    (_, path) => `import("${resolveImport(path, sourcePath, outputPath, basePath, metafile)}"`,
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
    const sourcePathOfImport = posix.join("/", posix.dirname(sourcePath), importPath);

    const outputOfImport = Object.entries(metafile.outputs).find(([, output]) => {
      if (!output.entryPoint) {
        return false;
      }

      const outputRelativeEntryPoint = removeRoot(basePath, output.entryPoint);

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

  return importPath;
}

export default esbuild;
