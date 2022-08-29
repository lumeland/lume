import { posix } from "../deps/path.ts";
import { normalizePath } from "./utils.ts";

import type {
  Component,
  Components,
  Directory,
  Formats,
  Reader,
} from "../core.ts";

export interface Options {
  /** The reader instance used to read the files */
  reader: Reader;

  /** The registered file formats */
  formats: Formats;
}

/**
 * Class to load components from the _components folder.
 */
export default class ComponentsLoader {
  /** The filesystem reader */
  reader: Reader;

  /** List of loaders and engines used by extensions */
  formats: Formats;

  constructor(options: Options) {
    this.reader = options.reader;
    this.formats = options.formats;
  }

  /** Load a directory of components */
  async load(
    path: string,
    context: Directory,
  ): Promise<Components | undefined> {
    path = normalizePath(path);
    const info = await this.reader.getInfo(path);

    if (!info?.isDirectory) {
      return;
    }

    return this.#loadDirectory(path, context);
  }

  /** Load a directory of components */
  async #loadDirectory(
    path: string,
    context: Directory,
  ): Promise<Components | undefined> {
    const components: Components = new Map();

    for await (const entry of this.reader.readDir(path)) {
      if (
        entry.isSymlink ||
        entry.name.startsWith(".") || entry.name.startsWith("_")
      ) {
        continue;
      }

      const fullPath = posix.join(path, entry.name);

      if (entry.isDirectory) {
        const subcomponents = await this.#loadDirectory(fullPath, context);

        if (subcomponents) {
          components.set(entry.name.toLowerCase(), subcomponents);
        }
        continue;
      }

      const component = await this.#loadComponent(fullPath, context);

      if (component) {
        components.set(component.name.toLowerCase(), component);
      }
    }

    return components.size ? components : undefined;
  }

  /** Load a component file */
  async #loadComponent(
    path: string,
    context: Directory,
  ): Promise<Component | undefined> {
    const format = this.formats.search(path);

    if (!format) {
      return;
    }

    if (!format.componentLoader || !format.engines?.length) {
      return;
    }

    const component = await this.reader.read(path, format.componentLoader);
    const { content } = component;

    return {
      path,
      name: component.name ?? posix.basename(path, format.ext),
      render(data) {
        return format.engines!.reduce(
          (content, engine) =>
            engine.renderSync(content, { ...context.data, ...data }, path),
          content,
        );
      },
      css: component.css,
      js: component.js,
    } as Component;
  }
}
