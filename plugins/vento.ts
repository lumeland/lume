import { engine, FileLoader } from "../deps/vento.ts";
import loader from "../core/loaders/text.ts";
import { merge, normalizePath } from "../core/utils.ts";

import type { Environment, Token } from "../deps/vento.ts";
import type { Data, Engine, FS, Helper, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** The options for the Vento engine */
  options: {
    /** The name of the variable to access to the data in the templates */
    dataVarname?: string;
  };
}

// Default options
export const defaults: Options = {
  extensions: [".vento", ".vto"],
  options: {
    dataVarname: "it",
  },
};

class LumeLoader extends FileLoader {
  fs: FS;

  constructor(includes: string, fs: FS) {
    super(includes);
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
}

/** Template engine to render Vento files */
export class VentoEngine implements Engine {
  engine: Environment;

  constructor(engine: Environment) {
    this.engine = engine;
  }

  deleteCache(file: string) {
    this.engine.cache.delete(file);
  }

  async render(content: string, data: Data = {}, filename?: string) {
    const result = await this.engine.runString(content, data, filename);
    return result.content;
  }

  renderSync(content: string, data: Data = {}): string {
    const result = this.engine.runStringSync(content, data);
    return result.content;
  }

  addHelper(name: string, fn: Helper) {
    this.engine.filters[name] = fn;
  }
}

/** Register the plugin to support Vento files */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);
  const extensions = Array.isArray(options.extensions)
    ? { pages: options.extensions, components: options.extensions }
    : options.extensions;

  return (site: Site) => {
    const vento = engine({
      includes: new LumeLoader(normalizePath(site.options.includes), site.fs),
      dataVarname: options.options.dataVarname,
    });

    vento.tags.push(compTag);

    const ventoEngine = new VentoEngine(vento);

    site.loadPages(extensions.pages, loader, ventoEngine);
    site.loadComponents(extensions.components, loader, ventoEngine);
  };
}

/** Vento tag to render a component */
function compTag(
  env: Environment,
  code: string,
  output: string,
  tokens: Token[],
): string | undefined {
  if (!code.startsWith("comp ")) {
    return;
  }

  const match = code.match(
    /^comp\s+([\w.]+)(?:\s+(\{.*\}))?(?:\s+(\/))?$/,
  );

  if (!match) {
    throw new Error(`Invalid component tag: ${code}`);
  }

  const [_, comp, args, closed] = match;

  if (closed) {
    return `${output} += await comp.${comp}(${args || ""});`;
  }

  const compiled: string[] = [];
  compiled.push("{");
  compiled.push(`let __content = ""`);
  compiled.push(...env.compileTokens(tokens, "__content", ["/comp"]));

  if (tokens.length && (tokens[0][0] !== "tag" || tokens[0][1] !== "/comp")) {
    throw new Error(`Missing closing tag for component tag: ${code}`);
  }

  tokens.shift();
  compiled.push(
    `${output} += await comp.${comp}({...${
      args || "{}"
    }, content: __content});`,
  );
  compiled.push("}");
  return compiled.join("\n");
}
