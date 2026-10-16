import { extname, fromFileUrl, isBuiltin } from "../deps/path.ts";
import { log } from "@lumeland/core/utils/log.ts";
import textLoader from "@lumeland/core/loaders/text.ts";
import { normalizePath } from "@lumeland/core/utils/path.ts";

import type Site from "@lumeland/core/site.ts";
import type { OnResolveArgs, Plugin } from "../deps/esbuild.ts";

export interface LoaderOptions {
  site: Site;
  entryPoints: {
    in: string;
    out: string;
    content: string;
  }[];
}

export default function lumeLoader(options: LoaderOptions): Plugin {
  const { entryPoints, site } = options;

  return {
    name: "lume-loader",
    async setup(build) {
      const options = build.initialOptions;
      const externals = (options.external ?? []).map(externalToRegex);
      const basePath = options.absWorkingDir || site.src();

      async function onResolve({ kind, path, importer, ...rest }: OnResolveArgs) {
        // Entry points are already loaded by Lume
        if (kind === "entry-point") {
          const entryPoint = entryPoints.find((entry) => entry.in === path);

          return {
            path: path.startsWith("file:") ? fromFileUrl(path) : path,
            namespace: "file",
            pluginData: { entryPoint },
          };
        }

        // Handle path aliases defined in build options
        const aliased = options.alias?.[path];
        if (aliased) {
          if (aliased.startsWith(".")) {
            return onResolve({
              kind,
              path: site.root(aliased),
              importer,
              ...rest,
            });
          }
          return onResolve({
            kind,
            path: aliased,
            importer: site.root(),
            ...rest,
          });
        }

        // Handle node built-in modules
        if (isBuiltin(path)) {
          log.warn(
            `[esbuild plugin] "${path}", imported by ${importer} is a Node.js built-in module and won't work in the browser.`,
          );
          return {
            path,
            external: true,
          };
        }

        // Handle external modules defined in build options
        if (externals.some((reg) => reg.test(path))) {
          return {
            path,
            external: true,
          };
        }
      }

      build.onResolve({ filter: /.*/ }, onResolve);

      build.onLoad({ filter: /.*/ }, async ({ path, pluginData, namespace }) => {
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

          // Return the content loaded by Lume
          if (entry) {
            const { content } = await entry.getContent(textLoader);

            return {
              contents: content,
              loader: getLoader(path),
            };
          }
        }
      });
    },
  } as Plugin;
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

function externalToRegex(external: string): RegExp {
  return new RegExp(
    "^" + external.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&").replace(/\*/g, ".*") + "$",
  );
}
