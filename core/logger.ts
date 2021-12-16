import { bold, brightGreen, dim, red, yellow } from "../deps/colors.ts";

import type { ErrorData } from "../core.ts";
import type { Page } from "./filesystem.ts";

export interface Options {
  /** Set to true to disable logging. */
  quiet: boolean;
}

/**
 * Class to output messages to the console.
 * If quiet mode is enabled, no messages will be output.
 */
export default class Logger {
  quiet: boolean;
  formats: Record<string, (str: string) => string> = {
    red,
    Red: (str: string) => bold(red(str)),
    dim,
    Dim: (str: string) => bold(dim(str)),
    green: brightGreen,
    Green: (str: string) => bold(brightGreen(str)),
    yellow: yellow,
    Yellow: (str: string) => bold(yellow(str)),
  };

  constructor(options: Options) {
    this.quiet = options.quiet;
  }

  /**
   * Outputs a message to the console.
   * You can use html tags in the message for colors.
   * For example: `logger.log("<red>Hello World!</red>")`
   */
  log(...messages: unknown[]): void {
    if (this.quiet) {
      return;
    }

    const format = messages.map((message) =>
      typeof message === "string"
        ? message.replaceAll(
          /<(\w+)>([^<]+)<\/\1>/g,
          (_, name, content) => this.formats[name]!(content),
        )
        : message
    );

    console.log(...format);
  }

  /** Shows a warning message */
  warn(message: string, data: ErrorData = {}) {
    const name = data.name || "Warning";
    delete data.name;

    this.log(`⚠️ <Yellow>${name}</Yellow> ${message}`);

    for (let [key, value] of Object.entries(data ?? {})) {
      if (key === "page") {
        value = (value as Page).src.path + (value as Page).src.ext;
      } else if (value instanceof Error) {
        value = value.toString();
      } else if (value instanceof URL) {
        value = value.toString();
      }

      this.log(`  <dim>${key}</dim>:`, value);
    }
  }
}
