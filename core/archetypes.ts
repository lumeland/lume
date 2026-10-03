import { parse, stringify } from "../deps/yaml.ts";
import { extract, test } from "../deps/front_matter.ts";
import { ensureDir } from "../deps/fs.ts";
import { dirname, join, toFileUrl } from "../deps/path.ts";
import { isGenerator } from "./utils/generator.ts";
import { log } from "./utils/log.ts";
import { isUrl } from "./utils/path.ts";

export interface Options {
  src: string;
  root: string;
}

export default class Archetypes {
  archetypes = new Map<string, string | Archetype>();
  src: string;
  root: string;

  constructor(options: Options) {
    this.src = options.src;
    this.root = options.root;
  }

  register(name: string, archetype: string | Archetype) {
    this.archetypes.set(name, archetype);
  }

  async run(name: string, args: string[] = []): Promise<void> {
    let archetype: Archetype;

    try {
      archetype = await this.load(name);
    } catch (cause) {
      throw new Error(`Archetype "${name}" not found or is errored.`, {
        cause,
      });
    }

    if (typeof archetype !== "function") {
      throw new Error(`Archetype "${name}" is not a function.`);
    }

    if (isGenerator(archetype)) {
      for await (const file of archetype(...args) as Generator<ArchetypeFile>) {
        await this.save(file);
      }
    } else {
      const file = archetype(...args) as ArchetypeFile | undefined;
      if (file) {
        await this.save(file);
      }
    }
  }

  async save(file: ArchetypeFile): Promise<void> {
    const { path, base = "src", content } = file;

    if (!path) {
      throw new Error("Archetype path is required.");
    }

    if (!content) {
      throw new Error("Archetype content is required.");
    }

    const fullPath = join(base === "root" ? this.root : this.src, path);

    if (typeof content === "string" || content instanceof Uint8Array) {
      return await saveFile(fullPath, content);
    }

    if (path.endsWith(".json")) {
      return await runObjectArchetype(
        fullPath,
        content,
        JSON.parse,
        (o) => JSON.stringify(o, null, 2),
      );
    }

    if (path.endsWith(".yaml") || path.endsWith(".yml")) {
      return await runObjectArchetype(fullPath, content, parse, stringify);
    }

    return await runObjectArchetype(
      fullPath,
      content as Record<string, unknown>,
      (content) => {
        if (test(content)) {
          const { attrs, body } = extract<Record<string, unknown>>(content);
          return { ...attrs, content: body };
        }
        return { content };
      },
      (data) => {
        const { content: body, ...frontmatter } = data;
        return `---\n${stringify(frontmatter)}---\n${body || ""}\n`;
      },
    );
  }

  async load(name: string): Promise<Archetype> {
    const registered = this.archetypes.get(name);

    if (registered) {
      if (typeof registered === "string") {
        return (await import(registered)).default;
      }

      return registered;
    }

    if (name.startsWith(".")) {
      return (await import(toFileUrl(join(Deno.cwd(), name)).href)).default;
    }

    if (isUrl(name)) {
      return (await import(name)).default;
    }

    return (await Promise.any([
      import(toFileUrl(join(this.root, `_archetypes/${name}.ts`)).href),
      import(toFileUrl(join(this.root, `_archetypes/${name}.js`)).href),
    ])).default;
  }
}

export type Archetype = (
  ...args: string[]
) =>
  | void
  | ArchetypeFile
  | Generator<ArchetypeFile>
  | AsyncGenerator<ArchetypeFile>;

export interface ArchetypeFile<T = unknown> {
  base?: "src" | "root";
  path: string;
  content: T | ((prev?: T) => T | Promise<T>);
}

async function saveFile(
  path: string,
  content: string | Uint8Array,
  overwrite = false,
) {
  await ensureDir(dirname(path));

  try {
    content instanceof Uint8Array
      ? await Deno.writeFile(path, content, { createNew: !overwrite })
      : await Deno.writeTextFile(path, content, { createNew: !overwrite });

    overwrite
      ? log.info(`✔️ Updated file: <gray>${path}</gray>`)
      : log.info(`✔️ Created file: <gray>${path}</gray>`);
  } catch (error) {
    if (error instanceof Deno.errors.AlreadyExists) {
      log.warn(`⚠️ File already exists: <gray>${path}</gray>`);
    } else {
      throw error;
    }
  }
}

async function runObjectArchetype<T = Record<string, unknown>>(
  fullPath: string,
  content: T | ((prev?: T) => T | Promise<T>),
  parse: (t: string) => T,
  stringify: (o: T) => string,
): Promise<void> {
  let newContent: T;
  let overwrite = false;

  if (typeof content === "function") {
    const fn = content as (prev?: T) => T | Promise<T>;
    const previousContent = await readFile(fullPath);
    newContent = previousContent
      ? await fn(parse(previousContent))
      : await fn();
    overwrite = true;
  } else {
    newContent = content;
  }

  return await saveFile(fullPath, stringify(newContent) + "\n", overwrite);
}

async function readFile(path: string): Promise<string | undefined> {
  try {
    return await Deno.readTextFile(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return;
    }
    throw error;
  }
}
