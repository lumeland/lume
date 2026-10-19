import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import process from "node:process";
import { cwd } from "./process.ts";
import { type ChildProcess, fork } from "node:child_process";

let version = 0;

const reloadFiles = new Set<string>();
const root = pathToFileURL(cwd()).href;
const files = new Map<string, string>();
const dependencies = new Map<string, Set<string>>();

/**
 * Register a hook to enable HMR in Deno by adding a version at the end of the file
 * that increments when the file changes.
 * Example: `module.ts#0`, `module.ts#1`, etc
 */
export function hmr() {
  function localSpecifier(specifier: string, parentURL?: string): string | undefined {
    if (specifier.startsWith(root)) {
      return specifier.includes("/node_modules/") ? undefined : specifier;
    }

    if (specifier.startsWith(".") && parentURL) {
      return localSpecifier(new URL(specifier, parentURL).href);
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
  if (reloadFiles.has(url)) {
    reloadProcess();
    return;
  }

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

/** Files that reload the process when they changed (not HMR available) */
export function addReloadFile(path: string) {
  reloadFiles.add(path);
}

/** Reload the current process */
export function reloadProcess() {
  if (process.send) {
    process.send({ type: "reload" });
  }
}

let child: ChildProcess | undefined;

export function startProcess(mainEntry: string, importer: string) {
  child = fork(mainEntry, process.argv.slice(2), {
    stdio: ["inherit", "inherit", "inherit", "ipc"],
    execArgv: [...process.execArgv, "--import", importer],
  });

  let relaunch = false;

  child.on("message", (msg) => {
    if ((msg as { type?: string }).type === "reload") {
      relaunch = true;
      child?.kill("SIGTERM");
    }
  });

  child.on("exit", (code, signal) => {
    if (relaunch) return startProcess(mainEntry, importer);
    process.exit(code ?? (signal ? 1 : 0));
  });
}
