import { posix } from "../deps/path.ts";
import { normalizePath } from "./utils.ts";

import type { Data, Formats, Reader } from "../core.ts";

export interface Options {
  /** The reader instance used to read the files */
  reader: Reader;

  /** The registered file formats */
  formats: Formats;
}

/**
 * Class to load components form the _components folder.
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
    extraData: Data = {},
  ): Promise<ComponentsTree | undefined> {
    path = normalizePath(path);
    const info = await this.reader.getInfo(path);

    if (!info?.isDirectory) {
      return;
    }

    return this.#loadDirectory(path, extraData);
  }

  /** Load a directory of components */
  async #loadDirectory(
    path: string,
    extraData: Data,
  ): Promise<ComponentsTree | undefined> {
    const components: ComponentsTree = new Map();

    for await (const entry of this.reader.readDir(path)) {
      if (
        entry.isSymlink ||
        entry.name.startsWith(".") || entry.name.startsWith("_")
      ) {
        continue;
      }

      const fullPath = posix.join(path, entry.name);

      if (entry.isDirectory) {
        const subcomponents = await this.#loadDirectory(fullPath, extraData);

        if (subcomponents) {
          components.set(entry.name.toLowerCase(), subcomponents);
        }
        continue;
      }

      const component = await this.#loadComponent(fullPath, extraData);

      if (component) {
        components.set(component.name.toLowerCase(), component);
      }
    }

    return components.size ? components : undefined;
  }

  /** Load a component file */
  async #loadComponent(
    path: string,
    extraData: Data,
  ): Promise<Component | undefined> {
    const result = this.formats.search(path);

    if (!result) {
      return;
    }

    const [ext, format] = result;

    if (!format.component || !format.loader || !format.componentEngine) {
      return;
    }

    const component = await this.reader.read(path, format.loader);
    const { content } = component;

    return {
      path,
      name: component.name ?? posix.basename(path, ext),
      render(data) {
        return format.componentEngine!.renderSync(
          content,
          { ...extraData, ...data },
          path,
        );
      },
      css: component.css,
      js: component.js,
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
