import { registerHooks } from "../deps/module.ts";
import { join, relative, toFileUrl } from "../deps/path.ts";
import { normalizePath } from "./utils/path.ts";
import Events from "./events.ts";

import type Site from "./site.ts";
import type { Event, EventListener, EventOptions } from "./events.ts";

/** The options to configure the local server */
export interface Options {
  /** The folder root to watch */
  root: string;

  /** Extra files to watch */
  paths?: string[];

  /** Paths ignored by the watcher */
  ignore?: (string | ((path: string) => boolean))[];

  /** The debounce waiting time */
  debounce?: number;

  /** File dependencies */
  dependencies: Record<string, string[]>;
}

/** Custom events for server */
export interface WatchEvent extends Event {
  /** The event type */
  type: WatchEventType;

  /** The list of changed files (only for "change" events) */
  files?: Set<string>;

  /** The error object (only for "error" events) */
  error?: Error;
}

/** The available event types */
export type WatchEventType =
  | "start"
  | "change"
  | "error";

export interface Watcher {
  /** Add a listener to an event */
  addEventListener(
    type: WatchEventType,
    listener: EventListener<WatchEvent>,
    options?: EventOptions,
  ): this;

  /** Dispatch an event */
  dispatchEvent(event: WatchEvent): Promise<boolean>;

  /** Start the watcher */
  start(): Promise<void>;
}

export default class FSWatcher implements Watcher {
  events: Events<WatchEvent> = new Events<WatchEvent>();
  options: Options;
  paused = false;
  #hmr = {
    hash: 0,
    files: new Map<string, string>(),
    dependencies: new Map<string, Set<string>>(),
  };

  constructor(options: Options) {
    this.options = options;
  }

  /** Add a listener to an event */
  addEventListener(
    type: WatchEventType,
    listener: EventListener<WatchEvent>,
    options?: EventOptions,
  ) {
    this.events.addEventListener(type, listener, options);
    return this;
  }

  /** Dispatch an event */
  dispatchEvent(event: WatchEvent) {
    return this.events.dispatchEvent(event);
  }

  /** Register a hook to enable HMR in Deno */
  initHMR() {
    const root = toFileUrl(this.options.root).href;
    const hmr = this.#hmr;

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
      if (hmr.files.has(cleanUrl)) {
        return cleanUrl;
      }
    }

    registerHooks({
      resolve(specifier, context, nextResolve) {
        const url = localSpecifier(specifier, context.parentURL);

        if (!url) {
          return nextResolve(specifier);
        }

        if (!hmr.files.has(url)) {
          hmr.files.set(url, `${url}#${hmr.hash}`);
        }

        const parent = parentDependency(context.parentURL);

        if (parent) {
          const deps = hmr.dependencies.get(url) ?? new Set();
          deps.add(parent);
          hmr.dependencies.set(url, deps);
        }

        return nextResolve(hmr.files.get(url)!);
      },
    });
  }

  /** Start the file watcher */
  async start() {
    const { root, paths, ignore, debounce, dependencies } = this.options;
    const watcher = Deno.watchFs([root, ...paths ?? []]);
    const changes = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | undefined = undefined;
    let runningCallback = false;
    const rootUrl = toFileUrl(root).href;
    const hmr = this.#hmr;

    await this.dispatchEvent({ type: "start" });

    function* getDependencies(file: string): Generator<string> {
      const url = `${rootUrl}${file}`;
      hmr.files.delete(url);

      for (const dep of hmr.dependencies.get(url) ?? []) {
        if (dep.startsWith(rootUrl)) {
          const depFile = dep.slice(rootUrl.length);
          yield depFile;
          yield* getDependencies(depFile);
        }
      }
    }

    const callback = async () => {
      // If the callback is already running, debounce the next call
      if (runningCallback) {
        clearTimeout(timer);
        setTimeout(callback, debounce ?? 100);
        return;
      }

      runningCallback = true;

      const files = new Set(changes);
      changes.clear();

      if (!files.size) {
        runningCallback = false;
        return;
      }

      // HMR
      ++this.#hmr.hash;

      for (const file of files) {
        for (const dep of getDependencies(file)) {
          files.add(dep);
        }
      }

      try {
        const result = await this.dispatchEvent({
          type: "change",
          files: files,
        });
        if (false === result) {
          runningCallback = false;
          return watcher.close();
        }
      } catch (err) {
        await this.dispatchEvent({ type: "error", error: err as Error });
      } finally {
        runningCallback = false;
      }

      // New changes detected while running the callback
      if (changes.size) {
        callback();
      }
    };

    for await (const event of watcher) {
      let paths = event.paths.map((path) => normalizePath(path));

      // Filter ignored paths
      paths = paths.filter((path) =>
        ignore
          ? !ignore.some((ignore) =>
            typeof ignore === "string"
              ? (path.startsWith(normalizePath(join(root, ignore, "/"))) ||
                path === normalizePath(join(root, ignore)))
              : ignore(path)
          )
          : true
      );

      if (!paths.length) {
        continue;
      }

      paths.forEach((path) => {
        const normalized = normalizePath(relative(root, path));
        changes.add(normalized);

        // The file has dependencies
        for (const [file, deps] of Object.entries(dependencies ?? {})) {
          const isDependent = deps.some((dep) =>
            normalizePath(dep) === normalized
          );

          if (isDependent) {
            changes.add(normalizePath(file));
          }
        }
      });

      // Only run the callback if it is not already running
      if (!runningCallback) {
        // Debounce
        clearTimeout(timer);
        timer = setTimeout(callback, debounce ?? 100);
      }
    }
  }
}

export class SiteWatcher implements Watcher {
  site: Site;
  events: Events<WatchEvent> = new Events<WatchEvent>();

  constructor(site: Site) {
    this.site = site;
  }

  /** Add a listener to an event */
  addEventListener(
    type: WatchEventType,
    listener: EventListener<WatchEvent>,
    options?: EventOptions,
  ) {
    this.events.addEventListener(type, listener, options);
    return this;
  }

  /** Dispatch an event */
  dispatchEvent(event: WatchEvent) {
    return this.events.dispatchEvent(event);
  }

  /** Start the watcher */
  async start() {
    await this.dispatchEvent({ type: "start" });
    this.site.addEventListener("afterUpdate", (event) => {
      const files = new Set([
        ...event.pages.map((page) => page.outputPath),
        ...event.staticFiles.map((file) => file.outputPath),
      ]);
      this.dispatchEvent({ type: "change", files });
    });
  }
}
