import { dirname, extname, posix } from "../deps/path.ts";
import { concurrent, Exception } from "./utils.ts";

import type {
  Data,
  Engines,
  IncludesLoader,
  Page,
  Processors,
} from "../core.ts";

export interface Options {
  includesLoader: IncludesLoader;
  prettyUrls: boolean;
  preprocessors: Processors;
  engines: Engines;
}

/**
 * The renderer is responsible for rendering the site pages
 * in the right order and using the right template engine.
 */
export default class Renderer {
  /** To load the includes files (layouts) */
  includesLoader: IncludesLoader;

  /** To convert the urls to pretty /example.html => /example/ */
  prettyUrls: boolean;

  /** Template engines to render the content */
  engines: Engines;

  /** All preprocessors */
  preprocessors: Processors;

  constructor(options: Options) {
    this.includesLoader = options.includesLoader;
    this.prettyUrls = options.prettyUrls;
    this.preprocessors = options.preprocessors;
    this.engines = options.engines;
  }

  /** Render the provided pages */
  async renderPages(from: Page[], to: Page[]) {
    for (const group of this.#groupPages(from)) {
      const pages = [];
      const generators = [];

      // Split regular pages and generators
      for (const page of group) {
        if (isGenerator(page.data.content)) {
          generators.push(page);
          continue;
        }

        this.#urlPage(page);
        to.push(page);

        if (!page.data.ondemand) {
          pages.push(page);
        }
      }

      // Auto-generate pages and join them with the others
      for (const page of generators) {
        const generator = await this.engines.render(
          page.data.content,
          page.data,
          page.src.path + page.src.ext,
        ) as Generator<Data, Data>;

        for await (const data of generator) {
          if (!data.content) {
            data.content = null;
          }
          const newPage = page.duplicate(data);
          this.#urlPage(newPage);
          pages.push(newPage);
          to.push(newPage);
        }
      }

      // Preprocess the pages
      await this.preprocessors.run(pages);

      // Render all pages
      await concurrent(
        pages,
        async (page) => {
          try {
            page.content = await this.#renderPage(page) as string;
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

    this.#urlPage(page);

    await this.preprocessors.run([page]);
    page.content = await this.#renderPage(page) as string;
  }

  /** Generate the URL and dest info of a page */
  #urlPage(page: Page) {
    const { dest } = page;
    let url = page.data.url;

    if (typeof url === "function") {
      url = url(page);
    }

    if (typeof url === "string") {
      // Relative URL
      if (url.startsWith("./") || url.startsWith("../")) {
        url = posix.join(dirname(page.dest.path), url);
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
        dest.ext = extname(url);
        dest.path = dest.ext ? url.slice(0, -dest.ext.length) : url;
      }
    } else if (!dest.ext) {
      if (
        this.prettyUrls && posix.basename(dest.path) !== "index"
      ) {
        dest.path = posix.join(dest.path, "index");
      }
      dest.ext = ".html";
    }

    page.data.url =
      (dest.ext === ".html" && posix.basename(dest.path) === "index")
        ? dest.path.slice(0, -5)
        : dest.path + dest.ext;
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
  async #renderPage(page: Page) {
    let { data } = page;
    let { content, layout } = data;
    let path = page.src.path + page.src.ext;

    content = await this.engines.render(content, data, path);

    // Render the layouts recursively
    while (layout) {
      const result = await this.includesLoader.load(layout, path);

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

      content = await this.engines.render(layoutData.content, data, layoutPath);
      layout = layoutData.layout;
      path = layoutPath;
    }

    return content;
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
