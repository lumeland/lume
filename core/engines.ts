import { Exception } from "./errors.ts";

import type { Data, Formats } from "../core.ts";

export interface Options {
  /** Extra data to be passed to the engines */
  globalData: Data;

  /** The file formats */
  formats: Formats;
}

/**
 * Class to render the pages
 * using different template engines.
 */
export default class Engines {
  /** Template engines by extension */
  formats: Formats;

  /** Extra data to be passed to the engines */
  globalData: Data;

  /** The registered helpers */
  helpers = new Map<string, [Helper, HelperOptions]>();

  constructor(options: Options) {
    this.globalData = options.globalData || {};
    this.formats = options.formats;
  }

  /** Register a new helper used by the template engines */
  addHelper(name: string, fn: Helper, options: HelperOptions) {
    this.helpers.set(name, [fn, options]);

    for (const format of this.formats.formats()) {
      format.engine?.addHelper(name, fn, options);
    }

    return this;
  }

  /** Render a template */
  async render(
    content: unknown,
    data: Data,
    filename: string,
  ): Promise<unknown> {
    const engines = this.getEngine(filename, data);

    if (engines) {
      data = { ...this.globalData, ...data };

      for (const engine of engines) {
        content = await engine.render(content, data, filename);
      }
    }

    return content;
  }

  /** Render a template synchronous */
  renderSync(content: unknown, data: Data, filename: string): unknown {
    const engines = this.getEngine(filename, data);

    if (engines) {
      data = { ...this.globalData, ...data };

      for (const engine of engines) {
        content = engine.renderSync(content, data, filename);
      }
    }

    return content;
  }

  /** Get the engines assigned to an extension or configured in the data */
  getEngine(path: string, data: Data): Engine[] | undefined {
    let { templateEngine } = data;

    if (templateEngine) {
      templateEngine = Array.isArray(templateEngine)
        ? templateEngine
        : templateEngine.split(",");

      return templateEngine.map((name) => {
        const format = this.formats.get(`.${name.trim()}`);

        if (format?.engine) {
          return format.engine;
        }

        throw new Exception(
          "Invalid value for templateEngine",
          { path, templateEngine },
        );
      });
    }

    const extension = this.formats.search(path);

    if (extension && extension[1].engine) {
      return [extension[1].engine];
    }
  }
}

/** An interface used by all template engines */
export interface Engine {
  /** Delete a cached template */
  deleteCache(file: string): void;

  /** Render a template */
  render(
    content: unknown,
    data?: Data,
    filename?: string,
  ): unknown | Promise<unknown>;

  /** Render a template synchronous */
  renderSync(
    content: unknown,
    data?: Data,
    filename?: string,
  ): string;

  /** Add a helper to the template engine */
  addHelper(
    name: string,
    fn: Helper,
    options: HelperOptions,
  ): void;
}

/** A generic helper to be used in template engines */
// deno-lint-ignore no-explicit-any
export type Helper = (...args: any[]) => any;

/** The options for a template helper */
export interface HelperOptions {
  /** The type of the helper (tag, filter, etc) */
  type: string;

  /** Whether the helper returns an instance or not */
  async?: boolean;

  /** Whether the helper has a body or not (used for tag types) */
  body?: boolean;
}
