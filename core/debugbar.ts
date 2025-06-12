import { specifier } from "../deps/debugbar.ts";
import { bytes, duration } from "./utils/format.ts";
import Events, { Event, EventListener, EventOptions } from "./events.ts";

import type { Collection, Item } from "../deps/debugbar.ts";

export interface Options {
  /**
   * The URL of the debugbar script
   */
  url?: string;
}

/**
 * DebugBar is a class that manages collections of items to be displayed in a debug bar.
 */
export default class DebugBar {
  #url: string;
  #events = new Events<DebugEvent>();
  #measureItem?: Item;
  collections: Collection[] = [];

  constructor(options: Options = {}) {
    this.#url = options.url || specifier;
  }

  get url() {
    return this.#url;
  }

  /**
   * Clear all collections
   */
  clear() {
    this.collections.forEach((collection) => collection.items = []);
    this.#measureItem = undefined;
  }

  /**
   * Get a collection by name or create a new one if it doesn't exist
   */
  collection(name: string): Collection {
    const collection = this.collections.find((c) => c.name === name);

    if (collection) {
      return collection;
    }

    const newCollection: Collection = name === "Build" ? buildCollection() : {
      name,
      items: [],
    };

    this.collections.push(newCollection);
    return newCollection;
  }

  /**
   * Add a new item to the "Build" collection and return it
   */
  buildItem(title = "Untitled", context: BuildContext = "info"): Item {
    const collection = this.collection("Build");
    const item: Item = {
      title,
      context,
    };

    collection.items.push(item);
    return item;
  }

  dispatchEvent(event: DebugEvent): Promise<boolean> {
    return this.#events.dispatchEvent(event);
  }

  addEventListener(
    type: string,
    listenerFn: EventListener<DebugEvent>,
    options?: EventOptions,
  ): this {
    this.#events.addEventListener(type, listenerFn, options);
    return this;
  }

  /** Start a measure */
  startMeasure(name: string): void {
    performance.mark(name);
  }

  /** End a measure and add it to the "Build" collection */
  endMeasure(name: string, title: string): Item | undefined {
    this.#measureItem ??= this.buildItem("Performance info", "info");
    this.#measureItem.items ??= [];

    performance.mark(`${name}-end`);
    const measure = performance.measure(name, name, `${name}-end`);
    let item: Item | undefined;

    if (name === "build") {
      item = this.#measureItem;
      item.title = title;
      item.icon = "clock";
      const memory = Deno.memoryUsage();
      item.details = `${duration(measure.duration)} / ${bytes(memory.rss)}`;
    } else if (measure.duration >= 1) {
      item = {
        title: title,
        details: duration(measure.duration),
      };
      this.#measureItem.items.push(item);
    }

    performance.clearMarks(name);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
    return item;
  }
}

type BuildContext = "fatal" | "error" | "warn" | "info";

/** Build collection created automatically by Lume */
function buildCollection(): Collection {
  const collection: Collection = {
    name: "Build",
    icon: "fire",
    empty: "No build messages found",
    contexts: {
      fatal: {
        background: "important",
      },
      error: {
        background: "error",
      },
      warn: {
        background: "warning",
      },
      info: {
        background: "info",
      },
    },
    items: [],
  };

  return collection;
}

export interface DebugEvent extends Event {
  type: string;
  data: Record<string, string | number | boolean>;
}
