import { join, relative } from "../deps/path.ts";
import { normalizePath } from "./utils/path.ts";
import Events from "./events.ts";

import type Site from "./site.ts";
import type { Event, EventListener, EventOptions } from "./events.ts";

/** The options to configure the local server */
export interface Options {
  /** The folder root to watch */
  root: string;

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
    const { root, ignore, debounce } = this.options;
    const watcher = Deno.watchFs(root);
    const changeQueue: Set<string>[] = [];
    let timer = 0;
    let runningCallback = false;

    await this.dispatchEvent({ type: "start" });

    const callback = async () => {
      runningCallback = true;

      let changes: Set<string> | undefined;
      while ((changes = changeQueue.pop()) !== undefined) {
        try {
          const result = await this.dispatchEvent({
            type: "change",
            files: changes,
          });
          if (false === result) {
            runningCallback = false;
            return watcher.close();
          }
        } catch (error) {
          await this.dispatchEvent({ type: "error", error });
        }
      }

      runningCallback = false;
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

      const changes = new Set<string>();
      paths.forEach((path) => changes.add(normalizePath(relative(root, path))));

      // If we're already processing and have a pending
      // queue item, we can merge all future changes together
      if (runningCallback && changeQueue.length > 0) {
        const last = changeQueue[changeQueue.length - 1];
        changeQueue[changeQueue.length - 1] = last.union(changes);
      } else {
        changeQueue.unshift(changes);

        // Only start if processing queue is not already running
        if (!runningCallback) {
          // Debounce
          clearTimeout(timer);
          timer = setTimeout(callback, debounce ?? 100);
        }
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
