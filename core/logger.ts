import {
  bold,
  brightGreen,
  cyan,
  gray,
  italic,
  red,
  strikethrough,
  yellow,
} from "../deps/colors.ts";

import type { Collection, Item } from "./debugbar.ts";

const severity = {
  TRACE: 1,
  DEBUG: 5,
  INFO: 9,
  WARN: 13,
  ERROR: 17,
  FATAL: 21,
};

export type LevelName = keyof typeof severity;

const COLOR_TAG_REG = /<(\w+)>([^<]+)<\/\1>/g;

const logFormats: Record<string, (str: string) => string> = {
  cyan,
  Cyan: (str: string) => bold(cyan(str)),
  red,
  Red: (str: string) => bold(red(str)),
  gray,
  code: gray,
  Gray: (str: string) => bold(gray(str)),
  green: brightGreen,
  Green: (str: string) => bold(brightGreen(str)),
  yellow: yellow,
  Yellow: (str: string) => bold(yellow(str)),
  del: (str: string) => strikethrough(gray(str)),
  em: italic,
  strong: bold,
};

/**
 * This is the default logger. It will output color coded log messages to the
 * console via `console.log()`.
 */
export default class Logger {
  #level: number;
  #collection: Collection | undefined;
  #logs: Map<number, Set<string>> = new Map();

  constructor(level: LevelName) {
    this.#level = severity[level];
  }

  set collection(collection: Collection) {
    this.#collection = collection;
  }

  get level(): number {
    return this.#level;
  }

  #log(msg: string, level: number): true | undefined {
    if (level >= severity.FATAL) {
      msg = `<Red>FATAL</Red> ${msg}`;
    } else if (level >= severity.ERROR) {
      msg = `<red>ERROR</red> ${msg}`;
    } else if (level >= severity.WARN) {
      msg = `<yellow>WARN</yellow> ${msg}`;
    }

    msg = msg.replaceAll(
      COLOR_TAG_REG,
      (all, name, content) => logFormats[name]?.(content) ?? all,
    );

    if (level <= severity.INFO) {
      console.log(msg);
      return;
    }

    const logs = this.#logs.get(level) ?? new Set();
    this.#logs.set(level, logs);
    if (!logs.has(msg)) {
      logs.add(msg);
      return true;
    }
  }

  output() {
    for (const level of Object.values(severity)) {
      const messages = this.#logs.get(level);

      if (!messages) {
        continue;
      }

      if (level >= severity.ERROR) {
        messages.forEach((msg) => console.error(msg));
        continue;
      }

      if (level >= severity.WARN) {
        messages.forEach((msg) => console.warn(msg));
        continue;
      }

      messages.forEach((msg) => console.log(msg));
    }
    this.#logs.clear();
  }

  fatal(msg: string, items?: string[] | Item[]): void {
    if (this.#log(msg, severity.FATAL) || items) {
      this.#bar(msg, "fatal", items);
    }
  }

  error(msg: string, items?: string[] | Item[]): void {
    if (this.#level < severity.FATAL) {
      if (this.#log(msg, severity.ERROR) || items) {
        this.#bar(msg, "error", items);
      }
    }
  }

  warn(msg: string, items?: string[] | Item[]): void {
    if (this.#level < severity.ERROR) {
      if (this.#log(msg, severity.WARN) || items) {
        this.#bar(msg, "warn", items);
      }
    }
  }

  info(msg: string): void {
    if (this.#level < severity.WARN) {
      this.#log(msg, severity.INFO);
    }
  }

  debug(msg: string): void {
    if (this.#level < severity.INFO) {
      this.#log(msg, severity.DEBUG);
    }
  }

  trace(msg: string): void {
    if (this.#level < severity.DEBUG) {
      this.#log(msg, severity.TRACE);
    }
  }

  #bar(message: string, context?: string, items?: string[] | Item[]): void {
    const collection = this.#collection;

    if (collection) {
      const [title, ...rest] = message.split("\n");

      const item: Item = {
        context,
        title,
        items: items?.map((item) =>
          typeof item === "string" ? { title: item } : item
        ),
      };

      if (rest.length === 1) {
        item.text = rest[0];
      } else if (rest.length > 1) {
        item.code = rest.join("\n");
      }

      collection.items.push(item);
    }
  }
}
