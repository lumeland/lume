import {
  autotrim,
  engine,
  stringifyError,
  VentoError,
} from "../deps/vento.ts";
import { posix } from "../deps/path.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils/object.ts";
import { normalizePath } from "../core/utils/path.ts";
import { log } from "../core/utils/log.ts";

import type Site from "../core/site.ts";
import type { Data } from "../core/file.ts";
import type { Engine, Helper, HelperOptions } from "../core/renderer.ts";
import type FS from "../core/fs.ts";
import type { Environment, Loader, Plugin, Token } from "../deps/vento.ts";

export interface Options {
  /** File extensions to load */
  extensions?: string[];

  /** Optional sub-extension for page files */
  pageSubExtension?: string;

  /**
   * Custom includes path
   * @default `site.options.includes`
   */
  includes?: string;

  /**
   * Plugins to use by vento
   */
  plugins?: Plugin[];

  /**
   * Whether or not to auto-trim the templates
   */
  autoTrim?: boolean;

  /**
   * The options for the Vento engine
   * @see https://vento.js.org/configuration/
   */
  options: {
    /** The name of the variable to access to the data in the templates */
    dataVarname?: string;

    /** Make data available on the global object instead of varName */
    useWith?: boolean;

    /** Whether or not to automatically XML-escape interpolations. */
    autoescape?: boolean;
  };
}

// Default options
export const defaults: Options = {
  extensions: [".vento", ".vto"],
  autoTrim: true,
  options: {
    dataVarname: "it",
    useWith: true,
    autoescape: false,
  },
};

class LumeLoader implements Loader {
  fs: FS;
  #root: string;

  constructor(root: string, fs: FS) {
    this.#root = root;
    this.fs = fs;
  }

  async load(file: string) {
    const entry = this.fs.entries.get(normalizePath(file));

    if (!entry) {
      throw new Error(`File not found: ${file}`);
    }

    const data = await entry.getContent(loader);

    return {
      source: data.content as string,
      data: data,
    };
  }

  resolve(from: string, file: string): string {
    if (file.startsWith(".")) {
      return normalizePath(posix.join(posix.dirname(from), file));
    }

    if (file.startsWith(this.#root)) {
      return normalizePath(file);
    }

    return normalizePath(posix.join(this.#root, file));
  }
}

/** Template engine to render Vento files */
export class VentoEngine implements Engine {
  engine: Environment;
  includes: string;

  constructor(engine: Environment, includes: string) {
    this.engine = engine;
    this.includes = includes;
  }

  deleteCache(file: string) {
    this.engine.cache.delete(file);
  }

  async render(
    content: string,
    data?: Record<string, unknown>,
    filename?: string,
  ) {
    try {
      const result = await this.engine.runString(content, data, filename);
      return result.content;
    } catch (error) {
      if (error instanceof VentoError) {
        const context = await error.getContext();
        if (context) {
          const errorMessage = stringifyError(context, {
            error: (string) => `<red>${string}</red>`,
            dim: (string) => `<gray>${string}</gray>`,
            number: (num) => `<yellow>${num}</yellow>`,
          });
          log.error(errorMessage);
          return;
        }
      }
      throw new Error(
        `Error rendering Vento template in file ${filename}: ${error}`,
      );
    }
  }

  addHelper(name: string, fn: Helper, options: HelperOptions) {
    if (options.async) {
      this.engine.filters[name] = async function (...args: unknown[]) {
        return await fn.apply({ data: this.data as Data }, args);
      };
    } else {
      this.engine.filters[name] = function (...args: unknown[]) {
        return fn.apply({ data: this.data as Data }, args);
      };
    }
  }
}

/**
 * A plugin to use the Vento template engine
 * Installed by default
 * @see https://lume.land/plugins/vento/
 */
export function vento(userOptions?: Options) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    const vento = engine({
      includes: new LumeLoader(normalizePath(options.includes), site.fs),
      ...options.options,
    });

    vento.tags.push(compTag);

    if (options.autoTrim) {
      vento.use(autotrim());
    }

    options.plugins?.forEach((plugin) => vento.use(plugin));

    site.hooks.addVentoPlugin = (plugin: Plugin) => {
      vento.use(plugin);
    };
    site.hooks.vento = (callback) => callback(vento);

    const ventoEngine = new VentoEngine(vento, options.includes);

    // Ignore includes folder
    if (options.includes) {
      site.ignore(options.includes);
    }

    // Load the pages and register the engine
    site.loadPages(options.extensions, {
      loader,
      engine: ventoEngine,
      pageSubExtension: options.pageSubExtension,
    });

    site.filter("vto", filter as Helper, true);

    async function filter(string: string, data?: Record<string, unknown>) {
      const result = await vento.runString(string, {
        ...site.scopedData.get("/"),
        ...data,
      });
      return result.content;
    }
  };
}

/** Vento tag to render a component */
function compTag(
  env: Environment,
  [, code]: Token,
  output: string,
  tokens: Token[],
): string | undefined {
  // Components are always async
  // so convert automatically {{ comp.whatever }} to {{ await comp.whatever }}
  if (code.startsWith("comp.")) {
    const value = `await ${code}`;
    const val = env.compileFilters(tokens, value, env.options.autoescape);
    return `${output} += ${val};`;
  }

  if (!code.startsWith("comp ")) {
    return;
  }

  const match = code.match(
    /^comp\s+([\w.]+)(?:\s+([\s\S]+[^/]))?(?:\s+(\/))?$/,
  );

  if (!match) {
    throw new Error(`Invalid component tag: ${code}`);
  }

  const [_, comp, args, closed] = match;

  if (closed) {
    return `${output} += await comp.${comp}(${args || ""});`;
  }

  const compiled: string[] = [];
  const tmpOutput = `__content_${tokens.length}`;
  compiled.push("{");
  compiled.push(`let ${tmpOutput} = ""`);
  compiled.push(...env.compileTokens(tokens, tmpOutput, "/comp"));

  compiled.push(
    `${output} += await comp.${comp}({...${
      args || "{}"
    }, content: ${tmpOutput}});`,
  );
  compiled.push("}");

  return compiled.join("\n");
}

export default vento;
