import {
  type HTMLRenderOptions,
  parse,
  type ParseOptions,
  renderHTML,
} from "../deps/djot.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";
import type { Engine } from "../core/renderer.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /** Options passed to djot library */
  parseOptions?: ParseOptions;

  /** Options passed to djot library */
  renderOptions?: HTMLRenderOptions;
}

// Default options
export const defaults: Options = {
  extensions: [".dj", ".djot"],
};

/** Template engine to render Markdown files */
export class DjotEngine implements Engine {
  parseOptions: ParseOptions;
  renderOptions: HTMLRenderOptions;

  constructor() {
  }

  deleteCache() {}

  render(
    content: string,
    data?: Record<string, unknown>,
    filename?: string,
  ): string {
    return this.renderComponent(content, data, filename);
  }

  renderComponent(
    content: unknown,
    data?: Record<string, unknown>,
    filename?: string,
  ): string {
    if (typeof content !== "string") {
      content = String(content);
    }
    const doc = parse(content, this.parseOptions);
    return renderHTML(doc, this.renderOptions);
  }

  addHelper() {}
}

function render(doc) {
}

/** Register the plugin to support Djot */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return function (site: Site) {
    // Load the pages
    site.loadPages(options.extensions, {
      loader,
      engine: new DjotEngine(),
    });

    // Register the md filter
    site.filter("dj", filter);

    function filter(string: string, inline = false): string {
      const content = string?.toString() || "";
      const doc = parse(content, {});
      return renderHTML(doc, {});
    }
  };
}

/** Extends Helpers interface */
declare global {
  namespace Lume {
    export interface Helpers {
      /** @see https://lume.land/plugins/markdown/ */
      dj: (string: string, inline?: boolean) => string;
    }
  }
}
