import {
  MediaType,
  RequestedModuleType,
  ResolutionMode,
  Workspace,
} from "../deno_loader.ts";
import { isBuiltin } from "node:module";
import { extname, fromFileUrl, SEPARATOR, toFileUrl } from "../path.ts";
import { log } from "../../core/utils/log.ts";
import textLoader from "../../core/loaders/text.ts";
import { isAbsolutePath, normalizePath } from "../../core/utils/path.ts";

import type { Loader, OnResolveArgs, Plugin } from "../esbuild.ts";
import type Site from "../../core/site.ts";
import { Data } from "../../core/file.ts";

export interface LoaderOptions<D> {
  configPath?: string;
  site: Site<D>;
  entryPoints: {
    in: string;
    out: string;
    content: string;
  }[];
}

export default function lumeLoader<D>(
  options: LoaderOptions<D>,
): Plugin {
  const { configPath, entryPoints, site } = options;

  return {
    name: "lume-loader",
    async setup(build) {
      const options = build.initialOptions;
      const externals = (options.external ?? []).map(externalToRegex);
      const basePath = options.absWorkingDir || site.src();
      const workspace = new Workspace({
        configPath,
        nodeConditions: options.conditions,
        platform: options.platform
          ? options.platform === "browser" ? "browser" : "node"
          : "browser",
      });

      const loader = await workspace.createLoader();
      await loader.addEntrypoints(entryPoints.map((ep) => ep.in));

      async function onResolve(
        { kind, path, importer, ...rest }: OnResolveArgs,
      ) {
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

        // Other imports are resolved by Deno loader
        const mode = kind === "require-call" || kind === "require-resolve"
          ? ResolutionMode.Require
          : ResolutionMode.Import;

        // Ensure that we're dealing with a specifier, not a standard
        // file path. This is needed for Windows paths.
        const specifier = SEPARATOR === "\\" && isAbsolutePath(path)
          ? toFileUrl(path).href
          : path;

        const res = await loader.resolve(specifier, importer, mode);

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

        const resolved = res.startsWith("file:") ? fromFileUrl(res) : res;

        return {
          path: resolved,
          namespace,
        };
      }

      build.onResolve({ filter: /.*/ }, onResolve);

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

            // Return the content loaded by Lume
            if (entry) {
              const { content } = await entry.getContent(textLoader);

              return {
                contents: content,
                loader: getLoader(path),
              };
            }
          }

          // Load the module with the Deno loader
          const url = namespace === "file" ? toFileUrl(path).toString() : path;

          // If the file is a JSON, force the module type to JSON
          // this is needed because some npm packages import JSON files
          // without the `with { type: "json" }` attribute
          const moduleType = path.endsWith(".json")
            ? RequestedModuleType.Json
            : getModuleType(withAttr);

          // Load the file from the workspace's loader
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

function externalToRegex(external: string): RegExp {
  return new RegExp(
    "^" + external.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&").replace(
      /\*/g,
      ".*",
    ) + "$",
  );
}
