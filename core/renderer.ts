import { dirname, extname, posix } from "../deps/path.ts";
import {
  Data,
  Engine,
  Helper,
  HelperOptions,
  Page,
  Processor,
  Renderer,
  Site,
} from "../core.ts";
import {
  checkExtensions,
  concurrent,
  Exception,
  searchByExtension,
} from "./utils.ts";

export default class LumeRenderer implements Renderer {
  site: Site;

  /** Template engines by extension */
  engines: Map<string, Engine> = new Map();

  /** Extra data to be passed to the layouts */
  extraData: Record<string, unknown> = {};

  /** All preprocessors */
  preprocessors: Map<Processor, string[]> = new Map();

  /** All processors */
  processors: Map<Processor, string[]> = new Map();

  /** To store the includes paths by extension */
  includes: Map<string, string> = new Map();

  /** The registered helpers */
  helpers: Map<string, [Helper, HelperOptions]> = new Map();

  constructor(site: Site) {
    this.site = site;
  }

  addEngine(extensions: string[], engine: Engine) {
    checkExtensions(extensions);
    extensions.forEach((extension) => this.engines.set(extension, engine));

    for (const [name, helper] of this.helpers) {
      engine.addHelper(name, ...helper);
    }
  }

  addPreprocessor(extensions: string[], preprocessor: Processor) {
    checkExtensions(extensions);
    this.preprocessors.set(preprocessor, extensions);
  }

  addProcessor(extensions: string[], processor: Processor) {
    checkExtensions(extensions);
    this.processors.set(processor, extensions);
  }

  addHelper(name: string, fn: Helper, options: HelperOptions) {
    this.helpers.set(name, [fn, options]);

    for (const engine of this.engines.values()) {
      engine.addHelper(name, fn, options);
    }

    return this;
  }

  addData(name: string, data: unknown) {
    this.extraData[name] = data;
  }

  addInclude(extensions: string[], path: string) {
    extensions.forEach((ext) => this.includes.set(ext, path));
  }

  /** Render the provided pages */
  async renderPages(pages: Iterable<Page>) {
    this.site.pages = [];

    // Group pages by renderOrder
    const renderOrder: Record<number | string, Page[]> = {};

    for (const page of pages) {
      // Ignore draft pages in production
      if (!!page.data.draft && !this.site.options.dev) {
        continue;
      }

      const order = page.data.renderOrder || 0;
      renderOrder[order] = renderOrder[order] || [];
      renderOrder[order].push(page);
    }

    const orderKeys = Object.keys(renderOrder).sort();

    for (const order of orderKeys) {
      const orderPages = [];
      const generators = [];

      // Prepare the pages
      for (const page of renderOrder[order]) {
        if (isGenerator(page.data.content)) {
          generators.push(page);
          continue;
        }

        this.#urlPage(page);
        this.site.pages.push(page);

        if (!page.data.ondemand) {
          orderPages.push(page);
        }
      }

      // Auto-generate pages
      for (const page of generators) {
        const engine = this.engines.get(".tmpl.js") as Engine;
        const generator = await engine.render(
          page.data.content,
          {
            ...page.data,
            ...this.extraData,
          },
          this.site.src(page.src.path + page.src.ext),
        ) as Generator<Data, Data>;

        for await (const data of generator) {
          if (!data.content) {
            data.content = null;
          }
          const newPage = page.duplicate(data);
          this.#urlPage(newPage);
          orderPages.push(newPage);
          this.site.pages.push(newPage);
        }
      }

      // Preprocess the pages
      await this.#runProcessors(orderPages, this.preprocessors, true);

      // Render all pages
      await concurrent(
        orderPages,
        async (page) => {
          const metric = this.site.metrics.start("Render", { page });
          try {
            page.content = await this.#renderPage(page) as string;
          } catch (cause) {
            throw new Exception("Error rendering this page", { cause, page });
          } finally {
            metric.stop();
          }
        },
      );
    }
    await this.site.dispatchEvent({ type: "afterRender" });

    // Remove ondemand pages from the site pages
    this.site.pages = this.site.pages.filter((page) => !page.data.ondemand);

    // Process the pages
    const metricProcess = this.site.metrics.start("Process (all pages)");
    await this.#runProcessors(this.site.pages, this.processors);
    metricProcess.stop();
  }

  /** Render the provided pages */
  async renderPageOnDemand(page: Page): Promise<void> {
    this.#urlPage(page);

    await this.#runProcessors([page], this.preprocessors, true);
    page.content = await this.#renderPage(page) as string;
    await this.#runProcessors([page], this.processors);
  }

  /** Run the (pre)processors to the provided pages */
  async #runProcessors(
    pages: Page[],
    processors: Map<Processor, string[]>,
    preProcess = false,
  ): Promise<void> {
    for (const [process, exts] of processors) {
      await concurrent(
        pages,
        async (page) => {
          try {
            if (
              (preProcess || page.content) &&
              ((page.src.ext && exts.includes(page.src.ext)) ||
                exts.includes(page.dest.ext))
            ) {
              const metric = this.site.metrics.start("Process", {
                page,
                processor: process.name,
                preProcess,
              });
              await process(page, this.site);
              metric.stop();
            }
          } catch (cause) {
            throw new Exception("Error processing page", {
              cause,
              page,
              processor: process.name,
              preProcess,
            });
          }
        },
      );
    }
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
        this.site.options.prettyUrls && posix.basename(dest.path) !== "index"
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

  /** Render a page */
  async #renderPage(page: Page) {
    let content = page.data.content;
    let pageData = { ...page.data, ...this.extraData };
    let layout = pageData.layout;
    const path = this.site.src(page.src.path + page.src.ext);
    const engine = this.#getEngine(path, pageData.templateEngine);

    if (Array.isArray(engine)) {
      for (const eng of engine) {
        content = await eng.render(content, pageData, path);
      }
    } else if (engine) {
      content = await engine.render(content, pageData, path);
    }

    // Render the layouts recursively
    while (layout) {
      const result = this.site.source.getPageLoader(layout);

      if (!result) {
        throw new Exception(
          "Couldn't find a loader for this layout",
          { layout },
        );
      }

      const [ext, loader] = result;

      const layoutPath = this.site.src(
        this.includes.get(ext) || this.site.options.includes,
        layout,
      );
      const layoutData = await this.site.source.readFile(layoutPath, loader);
      const engine = this.#getEngine(layout, layoutData.templateEngine);

      if (!engine) {
        throw new Exception(
          "Couldn't find a template engine for this layout",
          { layout },
        );
      }

      pageData = {
        ...layoutData,
        ...pageData,
        content,
        ...this.extraData,
      };

      if (Array.isArray(engine)) {
        for (const eng of engine) {
          content = await eng.render(layoutData.content, pageData, layoutPath);
        }
      } else {
        content = await engine.render(layoutData.content, pageData, layoutPath);
      }

      layout = layoutData.layout;
    }

    return content;
  }

  /** Get the engine used by a path or extension */
  #getEngine(path: string, templateEngine: Data["templateEngine"]) {
    if (templateEngine) {
      templateEngine = Array.isArray(templateEngine)
        ? templateEngine
        : templateEngine.split(",");

      return templateEngine.map((name) => {
        const engine = this.engines.get(`.${name.trim()}`);

        if (engine) {
          return engine;
        }

        throw new Exception(
          "Invalid value for templateEngine",
          { path, templateEngine },
        );
      });
    }

    const result = searchByExtension(path, this.engines);

    if (result) {
      return result[1];
    }
  }
}

function isGenerator(content: unknown) {
  if (typeof content !== "function") {
    return false;
  }

  const name = content.constructor.name;
  return (name === "GeneratorFunction" || name === "AsyncGeneratorFunction");
}
