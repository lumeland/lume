import { basename, join } from "../deps/path.ts";
import Extensions from "./extensions.ts";

import type { Engine, Loader, Reader } from "../core.ts";

export interface Options {
  /** The reader instance used to read the files */
  reader: Reader;
}

/**
 * Class to load components form the _components folder.
 */
export default class ComponentsLoader {
  /** The filesystem reader */
  reader: Reader;

  /** List of loaders and engines used by extensions */
  loaders = new Extensions<[Loader, Engine]>();

  constructor(options: Options) {
    this.reader = options.reader;
  }

  /** Assign a loader to some extensions */
  set(extensions: string[], loader: Loader, engine: Engine) {
    extensions.forEach((extension) =>
      this.loaders.set(extension, [loader, engine])
    );
  }

  /** Load a directory of components */
  async load(path: string): Promise<ComponentsTree | undefined> {
    const info = await this.reader.getInfo(path);

    if (!info?.isDirectory) {
      return;
    }

    return this.#loadDirectory(path);
  }

  /** Load a directory of components */
  async #loadDirectory(path: string): Promise<ComponentsTree | undefined> {
    const components: ComponentsTree = new Map();

    for await (const entry of this.reader.readDir(path)) {
      if (
        entry.isSymlink ||
        entry.name.startsWith(".") || entry.name.startsWith("_")
      ) {
        continue;
      }

      const fullPath = join(path, entry.name);

      if (entry.isDirectory) {
        const subcomponents = await this.#loadDirectory(fullPath);

        if (subcomponents) {
          components.set(entry.name.toLowerCase(), subcomponents);
        }
        continue;
      }

      const component = await this.#loadComponent(fullPath);

      if (component) {
        components.set(component.name.toLowerCase(), component);
      }
    }

    return components.size ? components : undefined;
  }

  /** Load a component file */
  async #loadComponent(path: string): Promise<Component | undefined> {
    const result = this.loaders.search(path);

    if (!result) {
      return;
    }

    const [ext, [loader, engine]] = result;
    const data = await this.reader.read(path, loader);
    const { content } = data;

    return {
      path,
      name: data.name ?? basename(path, ext),
      render(data) {
        return engine.renderSync(content, data, path);
      },
      css: data.css,
      js: data.js,
    } as Component;
  }
}

export interface Component {
  /** The file path of the component */
  path: string;

  /** Name of the component (used to get it from templates) */
  name: string;

  /** The function that will be called to render the component */
  render: (props: Record<string, unknown>) => string;

  /** Optional CSS code needed to style the component (global, only inserted once) */
  css?: string;

  /** Optional JS code needed for the component interactivity (global, only inserted once) */
  js?: string;
}

export type ComponentsTree = Map<string, Component | ComponentsTree>;
