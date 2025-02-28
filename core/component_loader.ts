import { Entry } from "./fs.ts";
import textLoader from "./loaders/text.ts";

import type { Data } from "./file.ts";
import type Formats from "./formats.ts";

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
    data: Partial<Data>,
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
        const component = await this.#loadComponentFolder(entry, data);
        if (component) {
          components.set(component.name.toLowerCase(), component);
          continue;
        }

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

  /** Load a component folder (a folder with a comp.* file) */
  async #loadComponentFolder(
    entry: Entry,
    data: Partial<Data>,
  ): Promise<Component | undefined> {
    const compEntry = findChild(
      entry,
      (entry) => entry.name.startsWith("comp."),
    );

    if (!compEntry) {
      return;
    }

    const component = await this.#loadComponent(compEntry, data, entry.name);

    if (!component) {
      return;
    }

    // Find extra files
    for (const child of entry.children.values()) {
      if (child === compEntry) {
        continue;
      }

      if (child.type === "file") {
        // Load CSS file
        if (child.name === "style.css") {
          const { content } = await child.getContent(textLoader);
          component.css = content as string | undefined;
          continue;
        }

        // Load JS file
        if (child.name === "script.js") {
          const { content } = await child.getContent(textLoader);
          component.js = content as string | undefined;
          continue;
        }
      }
    }

    return component;
  }

  /** Load a component file */
  async #loadComponent(
    entry: Entry,
    dirData: Partial<Data>,
    defaultName?: string,
  ): Promise<Component | undefined> {
    const format = this.formats.search(entry.name);

    if (!format) {
      return;
    }

    const { loader, engines, ext } = format;

    if (!loader || !engines || !engines.length) {
      return;
    }

    const rawComponent = await entry.getContent(loader) as ComponentFile;

    const { css, js, inheritData, content, ...data } = rawComponent;

    const name = defaultName ?? entry.name.slice(0, -ext.length);

    const render = async (props: Record<string, unknown>): Promise<string> => {
      let result = content;
      const currData = inheritData !== false
        ? { ...dirData, ...data, ...props }
        : { ...data, ...props };
      for (const engine of engines) {
        result = await engine.render(content, currData, entry.path);
      }

      return result as string;
    };

    return { name, render, css, js };
  }
}

export type Components = Map<string, Component | Components>;

export interface Component {
  /** Name of the component (used to get it from templates) */
  name: string;

  /** The function to render the component */
  render: (props: Record<string, unknown>) => string | Promise<string>;

  /** Optional CSS code needed to style the component (global, only inserted once) */
  css?: string;

  /** Optional JS code needed for the component interactivity (global, only inserted once) */
  js?: string;
}

export interface ComponentFile {
  /** The content of the component */
  content: unknown;

  /** Optional CSS code needed to style the component (global, only inserted once) */
  css?: string;

  /** Optional JS code needed for the component interactivity (global, only inserted once) */
  js?: string;

  /** If false, the data from the parent directory will not be inherited */
  inheritData?: boolean;

  /** Extra default data stored in the component */
  [key: string]: unknown;
}

function findChild(
  entry: Entry,
  filter: (entry: Entry) => boolean,
): Entry | undefined {
  for (const child of entry.children.values()) {
    if (child.type === "file" && filter(child)) {
      return child;
    }
  }
}
