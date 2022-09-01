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
    directory: Directory,
  ): Promise<void> {
    path = normalizePath(path);
    const info = await this.reader.getInfo(path);

    if (!info?.isDirectory) {
      return;
    }

    await this.#loadDirectory(path, directory, directory.components);
  }

  /** Load a directory of components */
  async #loadDirectory(
    path: string,
    directory: Directory,
    components: Components,
  ): Promise<void> {
    for await (const entry of this.reader.readDir(path)) {
      if (
        entry.isSymlink ||
        entry.name.startsWith(".") || entry.name.startsWith("_")
      ) {
        continue;
      }

      const subPath = posix.join(path, entry.name);

      if (entry.isDirectory) {
        const name = entry.name.toLowerCase();
        const subComponents = (components.get(name) || new Map()) as Components;
        components.set(name, subComponents);

        await this.#loadDirectory(subPath, directory, subComponents);
        continue;
      }

      const component = await this.#loadComponent(subPath, directory);

      if (component) {
        components.set(component.name.toLowerCase(), component);
      }
    }
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
