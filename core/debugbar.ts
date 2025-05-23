import { specifier } from "../deps/debugbar.ts";

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
  buildItem(title: string, context: BuildContext = "info"): Item {
    const collection = this.collection("Build");
    const item: Item = {
      title,
      context,
    };

    collection.items.push(item);
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
