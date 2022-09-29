import {
  merge,
  normalizeSourceMap,
  read,
  readDenoConfig,
} from "../core/utils.ts";
import { build, BuildOptions, stop } from "../deps/esbuild.ts";
import { extname, toFileUrl } from "../deps/path.ts";

import type { DenoConfig, Site, SourceMap } from "../core.ts";

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

          return {
            path,
            namespace: "deno",
          };
        });

        build.onLoad({ filter: /.*/ }, async (args: LoadArguments) => {
          const { path, namespace } = args;

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
      const name = `${page.src.path}${page.src.ext}`;
      const filename = toFileUrl(site.src(name)).href;
      site.logger.log("📦", name);

      const buildOptions: BuildOptions = {
        ...options.options,
        write: false,
        incremental: false,
        watch: false,
        metafile: false,
        entryPoints: [filename],
        sourcemap: "external",
        outfile: `${page.dest.path}.js`,
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

      const root = site.root();
      outputFiles?.forEach(({ path, text }) => {
        if (path.endsWith(".map")) {
          const sourceMap: SourceMap = JSON.parse(text);
          page.data.sourceMap = normalizeSourceMap(root, sourceMap);
          return;
        }

        page.content = text;
        page.updateDest({ ext: ".js" });
      });
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
