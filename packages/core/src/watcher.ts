import Events from "./events.ts";
import Path from "./path.ts";
import { updateDependencies, updateVersion } from "./services/hmr.ts";
import { watchFiles } from "./services/fs.ts";

import type Site from "./site.ts";
import type { Event, EventListener, EventOptions } from "./events.ts";

/** The options to configure the local server */
export interface Options {
  /** The root folder */
  root: string;

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
export type WatchEventType = "start" | "change" | "error";

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

  /** Start the file watcher */
  async start() {
    const { root, ignore, debounce, dependencies } = this.options;
    const rootPath = Path.create(root);
    const watcher = watchFiles(rootPath.toString());
    const changes = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | undefined = undefined;
    let runningCallback = false;

    await this.dispatchEvent({ type: "start" });

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
        void callback();
      }
    };

    // Reverse index of the manual dependencies: dependency -> the files that
    // must be marked changed when it changes.
    const dependents = new Map<string, string[]>();

    for (const [file, deps] of Object.entries(dependencies ?? {})) {
      for (const dep of deps) {
        const key = Path.create(dep).toString();
        const list = dependents.get(key);

        if (list) {
          list.push(Path.create(file).toString());
        } else {
          dependents.set(key, [Path.create(file).toString()]);
        }
      }
    }

    for await (const changedPaths of watcher) {
      const paths = new Set<string>();
      const selected = new Set<string>();
      const seeds: string[] = [];

      updateVersion();

      // `updateDependencies()` invalidates the module version and reloads the
      // process for reload files, so it runs at most once per file. Every file
      // it yields has been invalidated by its own recursion, so those are
      // reported and used as seeds, but not expanded again.
      const expand = (relative: string, url: string) => {
        if (selected.has(relative)) {
          return;
        }

        selected.add(relative);
        paths.add(relative);
        seeds.push(relative);

        for (const dep of updateDependencies(url)) {
          const normalizedDep = Path.create(dep);

          if (!normalizedDep.belongsTo(rootPath)) {
            continue;
          }

          const relativeDep = normalizedDep.removeBase(rootPath).toString();

          if (!selected.has(relativeDep)) {
            selected.add(relativeDep);
            paths.add(relativeDep);
            seeds.push(relativeDep);
          }
        }
      };

      for (const path of changedPaths.map((p) => Path.create(p))) {
        if (!path.belongsTo(rootPath)) {
          continue;
        }

        const full = path.url.href;
        path.removeBase(rootPath);
        const relative = path.toString();

        const isIgnored = ignore?.some((condition) =>
          typeof condition === "string" ? path.belongsTo(condition) : condition(relative),
        );

        // A change below an ignored path is not reported, but it still seeds
        // the manual dependencies, so its dependents are marked changed.
        if (isIgnored) {
          seeds.push(relative);
          continue;
        }

        expand(relative, full);
      }

      // Manual dependencies are transitive: every file selected above seeds
      // the next edge, and `selected` bounds the walk.
      for (let i = 0; i < seeds.length; i++) {
        for (const file of dependents.get(seeds[i]) ?? []) {
          expand(file, Path.create(file).addBase(rootPath).url.href);
        }
      }

      if (!paths.size) {
        continue;
      }

      paths.forEach((path) => {
        changes.add(path);
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
      void this.dispatchEvent({ type: "change", files });
    });
  }
}
