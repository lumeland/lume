import { relative } from "../deps/path.ts";
import Events from "./events.ts";
import Path from "./path.ts";

import type Site from "./site.ts";
import type { Event, EventListener, EventOptions } from "./events.ts";
import { updateDependencies, updateVersion } from "./services/hmr.ts";
import { watchFiles } from "./services/fs.ts";

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

    for await (const changedPaths of watcher) {
      const paths = new Set<string>();

      updateVersion();

      for (const path of changedPaths.map((p) => Path.create(p))) {
        // Filter ignored paths
        const isIgnored = ignore?.some((condition) =>
          typeof condition === "string"
            ? path.belongsTo(rootPath.clone().join(condition))
            : condition(path.toString()),
        );
        if (isIgnored) continue;
        paths.add(path.toString());
        for (const dep of updateDependencies(path.url.href)) {
          paths.add(Path.create(dep).toString());
        }
      }

      if (!paths.size) {
        continue;
      }

      paths.forEach((path) => {
        const normalized = Path.create(relative(root, path)).toString();
        changes.add(normalized);

        // The file has dependencies
        for (const [file, deps] of Object.entries(dependencies ?? {})) {
          const isDependent = deps.some((dep) => Path.create(dep).toString() === normalized);

          if (isDependent) {
            changes.add(Path.create(file).toString());
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
      void this.dispatchEvent({ type: "change", files });
    });
  }
}
