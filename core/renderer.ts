import { posix } from "../deps/path.ts";
import { concurrent, createDate } from "./utils.ts";
import { Exception } from "./errors.ts";
import { Page } from "./filesystem.ts";

import type {
  Content,
  Data,
  Formats,
  IncludesLoader,
  Processors,
} from "../core.ts";

export interface Options {
  includesLoader: IncludesLoader;
  prettyUrls: boolean | "no-html-extension";
  preprocessors: Processors;
  formats: Formats;
}

/**
 * The renderer is responsible for rendering the site pages
 * in the right order and using the right template engine.
 */
export default class Renderer {
  /** To load the includes files (layouts) */
  includesLoader: IncludesLoader;

  /** To convert the urls to pretty /example.html => /example/ */
  prettyUrls: boolean | "no-html-extension";

  /** All preprocessors */
  preprocessors: Processors;

  /** Available file formats */
  formats: Formats;

  /** The registered helpers */
  helpers = new Map<string, [Helper, HelperOptions]>();

  constructor(options: Options) {
    this.includesLoader = options.includesLoader;
    this.prettyUrls = options.prettyUrls;
    this.preprocessors = options.preprocessors;
    this.formats = options.formats;
  }

  /** Register a new helper used by the template engines */
  addHelper(name: string, fn: Helper, options: HelperOptions) {
    this.helpers.set(name, [fn, options]);

    for (const format of this.formats.entries.values()) {
      format.engines?.forEach((engine) => engine.addHelper(name, fn, options));
    }

    return this;
  }

  /** Render the provided pages */
  async renderPages(from: Page[], to: Page[], onDemand: Page[]): Promise<void> {
    for (const group of this.#groupPages(from)) {
      const pages: Page[] = [];
      const generators: Page[] = [];

      // Split regular pages and generators
      for (const page of group) {
        this.preparePage(page);

        if (isGenerator(page.data.content)) {
          generators.push(page);
          continue;
        }

        if (page.data.ondemand) {
          onDemand.push(page);
          continue;
        }
        pages.push(page);
      }

      // Preprocess the pages and add them to site.pages
      await this.preprocessors.run(pages);
      to.push(...pages);

      const generatedPages: Page[] = [];
      for (const page of generators) {
        const data = { ...page.data };
        const { content } = data;
        delete data.content;

        const generator = await this.render(
          content,
          data,
          page.src.path + page.src.ext,
        ) as Generator<Data, Data>;

        let index = 0;
        for await (const data of generator) {
          if (!data.content) {
            data.content = null;
          }
          const newPage = page.duplicate(index++, data);
          this.preparePage(newPage);
          generatedPages.push(newPage);
        }
      }

      // Preprocess the generators and add them to site.pages
      await this.preprocessors.run(generatedPages);
      to.push(...generatedPages);

      // Render pages
      await concurrent(
        pages.concat(generatedPages),
        async (page) => {
          try {
            page.content = await this.#renderPage(page);
          } catch (cause) {
            throw new Exception("Error rendering this page", { cause, page });
          }
        },
      );
    }
  }

  /** Render the provided pages */
  async renderPageOnDemand(page: Page): Promise<void> {
    if (isGenerator(page.data.content)) {
      throw new Exception("Cannot render a multiple page on demand.", {
        page,
      });
    }

    this.preparePage(page);
    await this.preprocessors.run([page]);
    page.content = await this.#renderPage(page);
  }

  /** Render a template */
  async render(
    content: unknown,
    data: Data,
    filename: string,
  ): Promise<unknown> {
    const engines = this.#getEngine(filename, data);

    if (engines) {
      for (const engine of engines) {
        content = await engine.render(content, data, filename);
      }
    }

    return content;
  }

  /** Prepare the page before rendering
   * - Ensure the date is defined
   * - Generate the URL
   * - Modify the dest info accordingly
   */
  preparePage(page: Page) {
    const { dest, data } = page;

    // Ensure the date is defined
    if (!data.date) {
      data.date = page.src.created ?? page.src.lastModified;
    } else {
      if (typeof data.date === "string" || typeof data.date === "number") {
        data.date = createDate(data.date);
      }

      if (!(data.date instanceof Date)) {
        throw new Exception(
          'Invalid date. Use "yyyy-mm-dd" or "yyy-mm-dd hh:mm:ss" formats',
          { page },
        );
      }
    }

    // Generate the URL and dest info accordingly
    let { url } = data;

    if (url === false) {
      return;
    }

    if (typeof url === "function") {
      url = url(page);
    }

    if (typeof url === "string") {
      // Relative URL
      if (url.startsWith("./") || url.startsWith("../")) {
        url = posix.join(posix.dirname(page.dest.path), url);
      } else if (!url.startsWith("/")) {
        throw new Exception(
          `The url variable must start with "/", "./" or "../"`,
          { page, url },
        );
      }

      if (url.endsWith("/")) {
        dest.path = `${url}index`;
        dest.ext = ".html";
      } else {
        dest.ext = posix.extname(url);
        dest.path = dest.ext ? url.slice(0, -dest.ext.length) : url;
      }
    } else if (url !== undefined) {
      // If the user has provided a value which hasn't yielded a string then it is an invalid url.
      throw new Exception(
        `If a url is specified, it should either be a string, or a function which returns a string. The provided url is of type: ${typeof url}.`,
        { page, url },
      );
      // If the user hasn't provided a value, generate a url using Site settings.
    } else if (!this.formats.get(page.src.ext || "")?.asset) {
      // Handle subextensions, like styles.css.njk
      const subext = posix.extname(page.dest.path);

      if (subext) {
        dest.path = page.dest.path.slice(0, -subext.length);
        dest.ext = subext;
      } else {
        // Add automatically .html extension
        if (
          this.prettyUrls === true && posix.basename(dest.path) !== "index"
        ) {
          dest.path = posix.join(dest.path, "index");
        }
        dest.ext = ".html";
      }
    }

    page.updateDest(dest, this.prettyUrls);
  }

  /** Group the pages by renderOrder */
  #groupPages(pages: Page[]): Page[][] {
    const renderOrder: Record<number | string, Page[]> = {};

    for (const page of pages) {
      const order = page.data.renderOrder || 0;
      renderOrder[order] = renderOrder[order] || [];
      renderOrder[order].push(page);
    }

    return Object.keys(renderOrder).sort().map((order) => renderOrder[order]);
  }

  /** Render a page */
  async #renderPage(page: Page): Promise<Content> {
    let data = { ...page.data };
    let { content, layout } = data;

    delete data.content;

    // If the page is an asset, just return the content (don't render templates or layouts)
    if (this.formats.get(page.src.ext || "")?.asset) {
      return content as Content;
    }

    let path = page.src.path + page.src.ext;
    content = await this.render(content, data, path);

    // Render the layouts recursively
    while (layout) {
      const format = this.formats.search(layout);

      if (!format || !format.pageLoader) {
        throw new Exception(
          "There's no handler for this layout format",
          { layout },
        );
      }

      const result = await this.includesLoader.load(layout, format, path);

      if (!result) {
        throw new Exception(
          "Couldn't load this layout",
          { layout },
        );
      }

      delete data.layout;
      delete data.templateEngine;

      const [layoutPath, layoutData] = result;

      data = {
        ...layoutData,
        ...data,
        content,
      };

      content = await this.render(layoutData.content, data, layoutPath);
      layout = layoutData.layout;
      path = layoutPath;
    }

    return content as Content;
  }

  /** Get the engines assigned to an extension or configured in the data */
  #getEngine(path: string, data: Data): Engine[] | undefined {
    let { templateEngine } = data;

    if (templateEngine) {
      templateEngine = Array.isArray(templateEngine)
        ? templateEngine
        : templateEngine.split(",");

      return templateEngine.reduce((engines, name) => {
        const format = this.formats.get(`.${name.trim()}`);

        if (format?.engines) {
          return engines.concat(format.engines);
        }

        throw new Exception(
          "Invalid value for templateEngine",
          { path, templateEngine },
        );
      }, [] as Engine[]);
    }

    return this.formats.search(path)?.engines;
  }
}

/**
 * Check if the content of a page is a generator.
 * Used to generate multiple pages
 */
function isGenerator(content: unknown) {
  if (typeof content !== "function") {
    return false;
  }

  const name = content.constructor.name;
  return (name === "GeneratorFunction" || name === "AsyncGeneratorFunction");
}

/** An interface used by all template engines */
export interface Engine<T = string | { toString(): string }> {
  /** Delete a cached template */
  deleteCache(file: string): void;

  /** Render a template (used to render pages) */
  render(
    content: unknown,
    data?: Data,
    filename?: string,
  ): T | Promise<T>;

  /** Render a template synchronous (used to render components) */
  renderSync(
    content: unknown,
    data?: Data,
    filename?: string,
  ): T;

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
