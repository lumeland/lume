import { join, relative } from "../deps/path.ts";
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

  constructor(options: Options) {
    this.options = options;
  }

  /** Pause the watcher */
  pause() {
    this.paused = true;
    return this;
  }

  /** Resume the watcher */
  resume() {
    this.paused = false;
    return this;
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
    const { root, paths, ignore, debounce } = this.options;
    const watcher = Deno.watchFs([root, ...paths ?? []]);
    const changes = new Set<string>();
    let timer = 0;
    let runningCallback = false;

    await this.dispatchEvent({ type: "start" });

    const callback = async () => {
      // If the watcher is paused, reschedule the callback
      if (this.paused) {
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
      }

      runningCallback = false;

      // New changes detected while processing
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

      paths.forEach((path) => changes.add(normalizePath(relative(root, path))));

      // Only start if processing queue is not already running
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
