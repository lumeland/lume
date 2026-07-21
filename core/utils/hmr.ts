import { registerHooks } from "../../deps/module.ts";
import { toFileUrl } from "../../deps/path.ts";

let version = 0;
const root = toFileUrl(Deno.cwd()).href;
const files = new Map<string, string>();
const dependencies = new Map<string, Set<string>>();

/**
 * Register a hook to enable HMR in Deno by adding a version at the end of the file
 * that increments when the file changes.
 * Example: `module.ts#0`, `module.ts#1`, etc
 */
export function init() {
  function localSpecifier(
    specifier: string,
    parentURL?: string,
  ): string | undefined {
    if (specifier.startsWith(root)) {
      return specifier;
    }

    if (specifier.startsWith(".") && parentURL?.startsWith(root)) {
      return new URL(specifier, parentURL).href;
    }
  }

  function parentDependency(url?: string) {
    if (!url) return;
    const cleanUrl = url.split("#")[0];
    if (files.has(cleanUrl)) {
      return cleanUrl;
    }
  }

  registerHooks({
    resolve(specifier, context, nextResolve) {
      const url = localSpecifier(specifier, context.parentURL);

      if (!url) {
        return nextResolve(specifier);
      }

      if (!files.has(url)) {
        files.set(url, `${url}#${version}`);
      }

      const parent = parentDependency(context.parentURL);

      if (parent) {
        const deps = dependencies.get(url) ?? new Set();
        deps.add(parent);
        dependencies.set(url, deps);
      }

      return nextResolve(files.get(url)!);
    },
  });
}

/**
 * Update and return all parent dependencies of a file.
 * This updates all modules that import the module that just changed.
 */
export function* updateDependencies(url: string): Generator<string> {
  files.delete(url);

  for (const dep of dependencies.get(url) ?? []) {
    yield dep;
    yield* updateDependencies(dep);
  }
}

/** Increment the version number */
export function updateVersion() {
  ++version;
}
