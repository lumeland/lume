import { Entry } from "./fs.ts";
import { bundleAsync } from "../deps/lightningcss.ts";
import { build, stop } from "../deps/esbuild.ts";
import textLoader from "./loaders/text.ts";

import type { Data } from "./file.ts";
import type Formats from "./formats.ts";
import { posix } from "../deps/path.ts";

export interface Options {
  /** The registered file formats */
  formats: Formats;
}

/**
 * Class to load components from the _components folder.
 */
export class ComponentLoader {
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

    const assets = new Map<string, string | Entry>();
    const entryPoints = new Set<string>([
      "style.css",
      "script.js",
      "script.ts",
    ]);

    // Find extra files
    for (const child of entry.children.values()) {
      if (child === compEntry) {
        continue;
      }

      // Load CSS/JS/TS file
      if (child.type === "file" && entryPoints.has(child.name)) {
        assets.set(child.path, child);
      }
    }

    for (const [path, content] of assets) {
      component.assets.set(path, content);
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

    const render = async (props?: Record<string, unknown>): Promise<string> => {
      const currData = inheritData !== false
        ? { ...dirData, ...data, ...props }
        : { ...data, ...props };

      // Unify children and content for interopeability between JSX and other engines
      currData.children = currData.content = props?.children ?? props?.content;

      let result = content;
      for (const engine of engines) {
        result = await engine.render(content, currData, entry.path);
      }

      return result as string;
    };

    const assets = new Map<string, string>();

    if (css) {
      assets.set(entry.path + ".css", css);
    }
    if (js) {
      assets.set(entry.path + ".js", js);
    }

    return {
      name,
      render,
      assets,
    };
  }
}

export type Components = Map<string, Component | Components>;

export interface Component {
  /** Name of the component (used to get it from templates) */
  name: string;

  /** The function to render the component */
  render: (props: Record<string, unknown>) => string | Promise<string>;

  /** Optional CSS and JS code needed to style the component (global, only inserted once) */
  assets: Map<string, string | Entry>;
}

/** Component defined directly by the user */
export interface UserComponent {
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

export async function compileCSS(
  filename: string,
  imports: Map<string, string | Entry>,
  entries: Map<string, Entry>,
): Promise<string> {
  const mainCode = Array.from(imports.keys()).map((path) =>
    `@import "${path}";`
  ).join("\n");

  const { code } = await bundleAsync({
    filename,
    sourceMap: false,
    resolver: {
      resolve(id, importer) {
        if (id.startsWith(".")) {
          id = posix.join(posix.dirname(importer), id);
        }
        return id;
      },
      read(filePath) {
        if (filePath === filename) {
          return mainCode;
        }
        return getEntryContent(imports.get(filePath) || entries.get(filePath));
      },
    },
  });

  const decoder = new TextDecoder();
  return decoder.decode(code);
}

export async function compileJS(
  filename: string,
  imports: Map<string, string | Entry>,
  entries: Map<string, Entry>,
): Promise<string> {
  const mainCode = Array.from(imports.keys()).map((path) => `import "${path}";`)
    .join("\n");

  const { outputFiles } = await build({
    bundle: true,
    entryPoints: [filename],
    write: false,
    format: "esm",
    minify: false,
    target: "esnext",
    outfile: filename,

    plugins: [
      {
        name: "components-resolver",
        setup(build) {
          build.onResolve({ filter: /.*/ }, ({ path, importer }) => {
            if (path.startsWith(".")) {
              path = posix.join(posix.dirname(importer), path);
            }
            if (path === filename || imports.has(path) || entries.has(path)) {
              return { path, namespace: "fs" };
            }
            return { path, external: true };
          });

          build.onLoad(
            { filter: /.*/, namespace: "fs" },
            async ({ path }) => {
              return {
                contents: path === filename ? mainCode : await getEntryContent(
                  imports.get(path) || entries.get(path),
                ),
                loader: path.endsWith(".ts") ? "ts" : "js",
              };
            },
          );
        },
      },
    ],
  });

  await stop();

  const decoder = new TextDecoder();
  return decoder.decode(outputFiles[0].contents);
}

async function getEntryContent(entry?: Entry | string): Promise<string> {
  if (typeof entry === "string") {
    return entry;
  }

  if (entry) {
    const { content } = await entry.getContent(textLoader);
    return (content as string) || "";
  }

  return "";
}

export interface ProxyComponents {
  // deno-lint-ignore no-explicit-any
  (props?: Record<string, unknown>): any;
  [key: string]: ProxyComponents;
}

/**
 * Create and returns a proxy to use the components
 * as comp.name() instead of components.get("name").render()
 */
export function toProxy(
  components: Components,
  extraCode: Map<string, string | Entry>,
): ProxyComponents {
  const node = {
    _components: components,
    _proxies: new Map(),
  };
  return new Proxy(node, {
    get: (target, name) => {
      if (typeof name !== "string" || name in target) {
        return;
      }

      const key = name.toLowerCase();

      if (target._proxies.has(key)) {
        return target._proxies.get(key);
      }

      const component = target._components.get(key);

      if (!component) {
        throw new Error(`Component "${name}" not found`);
      }

      if (component instanceof Map) {
        const proxy = toProxy(component, extraCode);
        target._proxies.set(key, proxy);
        return proxy;
      }

      // Save component assets
      for (const [key, value] of component.assets) {
        extraCode.set(key, value);
      }

      // Return the function to render the component
      return (props: Record<string, unknown>) => component.render(props);
    },
  }) as unknown as ProxyComponents;
}
