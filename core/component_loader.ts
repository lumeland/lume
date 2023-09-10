import { Entry } from "./fs.ts";

import type { Data, Formats } from "../core.ts";

export interface Options {
  /** The registered file formats */
  formats: Formats;
}

/**
 * Class to load components from the _components folder.
 */
export default class ComponentsLoader {
  /** List of loaders and engines used by extensions */
  formats: Formats;

  constructor(options: Options) {
    this.formats = options.formats;
  }

  /** Load a directory of components */
  async load(
    dirEntry: Entry,
    data: Data,
    components?: Components,
  ): Promise<Components> {
    if (!components) {
      components = new Map();
    }

    for await (const entry of dirEntry.children.values()) {
      if (entry.name.startsWith(".") || entry.name.startsWith("_")) {
        continue;
      }

      if (entry.type === "directory") {
        const name = entry.name.toLowerCase();
        const subComponents = (components.get(name) || new Map()) as Components;
        components.set(name, subComponents);

        await this.load(entry, data, subComponents);
        continue;
      }

      const component = await this.#loadComponent(entry, data);

      if (component) {
        components.set(component.name.toLowerCase(), component);
      }
    }

    return components;
  }

  /** Load a component file */
  async #loadComponent(
    entry: Entry,
    inheritData: Data,
  ): Promise<Component | undefined> {
    const format = this.formats.search(entry.name);

    if (!format) {
      return;
    }

    if (!format.loader || !format.engines?.length) {
      return;
    }

    const component = await entry.getContent(
      format.loader,
    ) as ComponentFile;

    function getData(data: Record<string, unknown>) {
      if (component.inheritData === false) {
        return { ...data };
      }

      return { ...inheritData, ...data };
    }

    const { content } = component;

    return {
      name: component.name ?? entry.name.slice(0, -format.ext.length),
      render(data) {
        return format.engines!.reduce(
          (content, engine) =>
            engine.renderComponent(content, getData(data), entry.path),
          content,
        );
      },
      css: component.css,
      js: component.js,
    } as Component;
  }
}

export type Components = Map<string, Component | Components>;

export interface Component {
  /** Name of the component (used to get it from templates) */
  name: string;

  /** The function that will be called to render the component */
  render: (props: Record<string, unknown>) => string;

  /** Optional CSS code needed to style the component (global, only inserted once) */
  css?: string;

  /** Optional JS code needed for the component interactivity (global, only inserted once) */
  js?: string;
}

export interface ComponentFile {
  /** Name of the component (used to get it from templates) */
  name?: string;

  /** The content of the component */
  content: unknown;

  /** Optional CSS code needed to style the component (global, only inserted once) */
  css?: string;

  /** Optional JS code needed for the component interactivity (global, only inserted once) */
  js?: string;

  /** If false, the data from the parent directory will not be inherited */
  inheritData?: boolean;
}
