import { bytes, duration } from "./utils/format.ts";
import Events, { Event, EventListener, EventOptions } from "./events.ts";

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
    this.#url = options.url || getSpecifier();
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

type BuildContext = "fatal" | "error" | "warn" | "info" | "lume cms";

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
      "lume cms": {
        background: "lightgreen",
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

/** A collection of messages to show in a tab */
export interface Collection {
  /**
   * The name of the collection
   */
  name: string;

  /**
   * The icon name to show in the tab
   * @see https://phosphoricons.com/
   */
  icon?: string;

  /**
   * A list of context to group the items
   */
  contexts?: Record<string, ItemContext>;

  /**
   * The text to show when the collection is empty
   * @example "No items found"
   */
  empty?: string;

  /**
   * A list of items to show in the collection
   */
  items: Item[];
}

export interface ItemContext {
  /**
   * The title of the context
   * if not provided, the context name will be used
   */
  title?: string;

  /**
   * The background color of the badge with the context
   * It can be any valid CSS color value
   * or the keywords: "success", "warning", "error", "info" and "important"
   * By default is gray
   */
  background?: string;

  /**
   * The text color of the badge with the context
   * It can be any valid CSS color value
   * or the keywords: "success", "warning", "error", "info" and "important"
   * By default is black
   */
  color?: string;

  /**
   * Optional icon name to show in the badge instead of the text
   * @see https://phosphoricons.com/
   */
  icon?: string;
}

export interface Item {
  /**
   * The unique identifier of the item
   * It's calculated automatically if not provided
   */
  id?: string;

  /**
   * The title of the item
   */
  title: string;

  /**
   * The icon name to show just before the title
   * @see https://phosphoricons.com/
   */
  icon?: string;

  /**
   * The context name of the item.
   */
  context?: string;

  /**
   * Small text to show at the right of the title
   * It can be a number or a string
   * @example 2, "3 errors", "4 warnings"
   */
  details?: string | number;

  /**
   * The text to show if the item is expanded
   */
  text?: string;

  /**
   * The code to show if the item is expanded
   */
  code?: string;

  /**
   * List of sub-items to show in the expanded view
   */
  items?: Item[];

  /**
   * List of actions for this item
   */
  actions?: Action[];
}

export interface Action {
  /**
   * The text to show in the action button
   */
  text: string;

  /**
   * The URL to open when the action is clicked
   */
  href?: string;

  /**
   * The callback to perform when the action is clicked
   * It must be a string with the code to execute
   * @example "alert('Hello world!')"
   */
  onclick?: string;

  /**
   * The icon name to show in the action button
   * @see https://phosphoricons.com/
   */
  icon?: string;

  /**
   * The target to open the URL
   * It can be "_blank", "_self", "_parent", "_top", etc.
   */
  target?: string;

  /**
   * Data to pass to send a message to the background script
   */
  data?: Record<string, string | number | boolean>;
}

// Return a HTTP-compatible debug-bar specifier
function getSpecifier(): string {
  const url = import.meta.resolve("../debugbar/script.js");
  if (url.startsWith("http")) {
    return url;
  }

  return "https://cdn.jsdelivr.net/gh/lumeland/lume@main/debugbar/script.js";
}
