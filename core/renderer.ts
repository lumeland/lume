import { dirname, extname, posix } from "../deps/path.ts";
import { Resources } from "./filesystem.ts";
import { concurrent } from "./utils.ts";
import { Exception } from "./errors.ts";

import type {
  Asset,
  Data,
  Engines,
  IncludesLoader,
  Page,
  Processors,
  Resource,
} from "../core.ts";

export interface Options {
  includesLoader: IncludesLoader;
  prettyUrls: boolean;
  preprocessors: Processors;
  engines: Engines;
}

type TypedResource =
  | { type: "page"; resource: Page }
  | { type: "asset"; resource: Asset };

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

  /** Render the provided resources */
  async renderResources(from: Resources, to: Resources) {
    const typedResources = [
      ...from.pages.map((page) => ({ type: "page", resource: page })),
      ...from.assets.map((asset) => ({ type: "asset", resource: asset })),
    ] as TypedResource[];

    for (const group of this.#groupResources(typedResources)) {
      const resources: TypedResource[] = [];
      const generators: Page[] = [];

      // Split regular pages and generators
      for (const { type, resource } of group) {
        if (isGenerator(resource.data.content)) {
          generators.push(resource as Page);
          continue;
        }

        this.#urlResource(resource);
        if (type === "page") to.pages.push(resource as Page);
        if (type === "asset") to.assets.push(resource as Asset);

        if (!resource.data.ondemand) {
          resources.push({ type, resource } as TypedResource);
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
          this.#urlResource(newPage);
          resources.push({ type: "page", resource: newPage });
          to.pages.push(newPage);
        }
      }

      // Preprocess the resource
      await this.preprocessors.run(resources.map(({ resource }) => resource));

      // Render all resources
      await concurrent(
        resources,
        async ({ type, resource }) => {
          try {
            if (type === "page") {
              resource.content = await this.#renderPage(
                resource as Page,
              ) as string;
            } else {
              resource.content = resource.data.content as string;
            }
          } catch (cause) {
            throw new Exception("Error rendering this page", {
              cause,
              resource,
            });
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

    this.#urlResource(page);

    await this.preprocessors.run([page]);
    page.content = await this.#renderPage(page) as string;
  }

  /** Generate the URL and dest info of a resource */
  #urlResource(resource: Resource) {
    const { dest } = resource;
    let url = resource.data.url;

    if (typeof url === "function") {
      url = url(resource);
    }

    if (typeof url === "string") {
      // Relative URL
      if (url.startsWith("./") || url.startsWith("../")) {
        url = posix.join(dirname(resource.dest.path), url);
      } else if (!url.startsWith("/")) {
        throw new Exception(
          `The url variable must start with "/", "./" or "../"`,
          { resource, url },
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

    resource.data.url =
      (dest.ext === ".html" && posix.basename(dest.path) === "index")
        ? dest.path.slice(0, -5)
        : dest.path + dest.ext;
  }

  /** Group the resources by renderOrder */
  #groupResources(resources: TypedResource[]): TypedResource[][] {
    const renderOrder: Record<number | string, TypedResource[]> = {};

    for (const { type, resource } of resources) {
      const order = resource.data.renderOrder || 0;
      renderOrder[order] = renderOrder[order] || [];
      renderOrder[order].push({ type, resource } as TypedResource);
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
