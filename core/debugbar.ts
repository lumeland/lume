/**
 * DebugBar is a class that manages collections of items to be displayed in a debug bar.
 */
export default class DebugBar {
  collections: Collection[] = [];

  /**
   * Clear all collections
   */
  clear() {
    this.collections = [];
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
  buildItem(title: string, context?: string): Item {
    const collection = this.collection("Build");
    const item: Item = {
      title,
      context,
    };

    collection.items.push(item);
    return item;
  }
}

/** A collection of messages to show in the same tab */
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
   * The title of the item
   */
  title: string;

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
  href: string;

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
   * It can be "_blank", "_self", "_parent" or "_top"
   */
  target?: string;
}

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
