import {
  merge,
  read,
  readDenoConfig,
  replaceExtension,
} from "../core/utils.ts";
import { build, BuildOptions, OutputFile, stop } from "../deps/esbuild.ts";
import { extname, toFileUrl } from "../deps/path.ts";
import { prepareAsset, saveAsset } from "./source_maps.ts";
import { Page } from "../core/filesystem.ts";

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

    /** Run esbuild and returns the output files */
    async function runEsbuild(
      pages: Page[],
      extraOptions: BuildOptions = {},
    ): Promise<[OutputFile[], boolean]> {
      let enableAllSourceMaps = false;

      const pageContent = Object.fromEntries(pages.map((page) => {
        const { content, filename, enableSourceMap } = prepareAsset(site, page);
        if (enableSourceMap) {
          enableAllSourceMaps = true;
        }
        return [toFileUrl(filename).href, content];
      }));

      const buildOptions: LumeBuildOptions = {
        ...options.options,
        write: false,
        incremental: false,
        watch: false,
        metafile: false,
        entryPoints: Object.keys(pageContent),
        sourcemap: enableAllSourceMaps ? "external" : undefined,
        ...extraOptions,
        [contentSymbol]: pageContent,
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

      return [outputFiles || [], enableAllSourceMaps];
    }

    site.addEventListener("beforeSave", () => stop());

    // Splitting mode needs to run esbuild with all pages
    if (options.options.splitting) {
      const basePath = options.options.absWorkingDir || Deno.cwd();
      site.addEventListener("afterRender", async (event) => {
        const pages = event.pages!;
        const removed: Page[] = pages.filter((page) =>
          pageMatches(options.extensions, page)
        );
        const [outputFiles, enableSourceMap] = await runEsbuild(removed);
        const newPages: Page[] = [];

        outputFiles?.forEach((file) => {
          if (file.path.endsWith(".map")) {
            return;
          }

          const url = file.path.replace(basePath, "");
          const page = Page.create(url, "");
          const map = enableSourceMap
            ? outputFiles.find((f) => f.path === `${file.path}.map`)
            : undefined;

          saveAsset(site, page, file.text, map?.text);
          newPages.push(page);
        });

        for (const page of removed) {
          pages.splice(pages.indexOf(page), 1);
        }

        pages.push(...newPages);
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

function pageMatches(exts: string[], page: Page): boolean {
  if (page.src.ext && exts.includes(page.src.ext)) {
    return true;
  }

  const url = page.outputPath;

  if (typeof url === "string" && exts.some((ext) => url.endsWith(ext))) {
    return true;
  }

  return false;
}
