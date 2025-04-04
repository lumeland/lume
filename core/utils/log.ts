import { env } from "./env.ts";
import {
  bold,
  brightGreen,
  cyan,
  gray,
  italic,
  red,
  strikethrough,
  yellow,
} from "../../deps/colors.ts";

const severity = {
  TRACE: 1,
  DEBUG: 5,
  INFO: 9,
  WARN: 13,
  ERROR: 17,
  FATAL: 21,
};

type LevelName = keyof typeof severity;

// Get the log level from the environment variable LUME_LOGS
const level = env<LevelName>("LUME_LOGS")?.toUpperCase() as
  | LevelName
  | undefined ?? "INFO";

const COLOR_TAG_REG = /<(\w+)>([^<]+)<\/\1>/g;

const logFormats: Record<string, (str: string) => string> = {
  cyan,
  Cyan: (str: string) => bold(cyan(str)),
  red,
  Red: (str: string) => bold(red(str)),
  gray,
  Gray: (str: string) => bold(gray(str)),
  green: brightGreen,
  Green: (str: string) => bold(brightGreen(str)),
  yellow: yellow,
  Yellow: (str: string) => bold(yellow(str)),
  del: (str: string) => strikethrough(gray(str)),
  em: italic,
};

/**
 * This is the default logger. It will output color coded log messages to the
 * console via `console.log()`.
 */
class Logger {
  #level: number;

  constructor(level: LevelName) {
    this.#level = severity[level];
  }

  #log(msg: string, level: number): void {
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

    if (level >= severity.ERROR) {
      return console.error(msg);
    }

    if (level >= severity.WARN) {
      return console.warn(msg);
    }

    console.log(msg);
  }

  fatal(msg: string): void {
    this.#log(msg, severity.FATAL);
  }

  error(msg: string): void {
    if (this.#level < severity.FATAL) {
      this.#log(msg, severity.ERROR);
    }
  }

  warn(msg: string): void {
    if (this.#level < severity.ERROR) {
      this.#log(msg, severity.WARN);
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
}

export const log = new Logger(level);
