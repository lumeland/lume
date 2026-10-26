import { parse, stringify } from "../deps/yaml.ts";
import { extract, test } from "../deps/front-matter.ts";
import { ensureDir } from "./utils/fs.ts";
import { dirname, join, toFileUrl } from "../deps/path.ts";
import { isGenerator } from "./utils/generator.ts";
import { log } from "./utils/log.ts";
import { isUrl } from "./utils/path.ts";
import { cwd } from "./services/process.ts";
import { FsError, readTextFile, writeFile, writeTextFile } from "./services/fs.ts";
import { read } from "./utils/read.ts";
import { getFiles, isFromCdn } from "./utils/cdn.ts";

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
      log.fatal(
        `[archetype] Archetype "${name}" not found or is errored.: ${(cause as Error).message}`,
      );
      return;
    }

    if (typeof archetype !== "function") {
      log.fatal(`[archetype] Archetype "${name}" is not a valid function.`);
      return;
    }

    if (isGenerator(archetype)) {
      for await (const file of archetype(...args) as AsyncGenerator<
        ArchetypeFile | ArchetypeRemote
      >) {
        await this.save(file);
      }
    } else {
      const file = archetype(...args) as ArchetypeFile | ArchetypeRemote | undefined;
      if (file) {
        await this.save(file);
      }
    }
  }

  async save(file: ArchetypeFile | ArchetypeRemote): Promise<void> {
    if (isRemote(file)) {
      const files = await remoteToFile(file);
      for (const file of files) {
        await this.save(file);
      }
      return;
    }
    const { path, base = "src", content, overwrite } = file;

    if (!path) {
      throw new Error("Archetype path is required.");
    }

    if (content === undefined || content === null) {
      throw new Error("Archetype content is required.");
    }

    const fullPath = join(base === "root" ? this.root : this.src, path);

    if (content instanceof URL) {
      return await saveFile(fullPath, await read(content.href), overwrite);
    }

    if (typeof content === "string" || content instanceof Uint8Array) {
      return await saveFile(fullPath, content, overwrite);
    }

    if (path.endsWith(".json")) {
      return await runObjectArchetype(fullPath, content, JSON.parse, (o) =>
        JSON.stringify(o, null, 2),
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
        return `---\n${stringify(frontmatter)}---\n${(body as string | undefined) || ""}\n`;
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
      return (await import(toFileUrl(join(cwd(), name)).href)).default;
    }

    if (isUrl(name)) {
      return (await import(name)).default;
    }

    return (
      await Promise.any([
        import(toFileUrl(join(this.root, `_archetypes/${name}.ts`)).href),
        import(toFileUrl(join(this.root, `_archetypes/${name}.js`)).href),
      ])
    ).default;
  }
}

export type Archetype = (
  ...args: string[]
) =>
  | void
  | ArchetypeFile
  | ArchetypeRemote
  | Generator<ArchetypeFile | ArchetypeRemote>
  | AsyncGenerator<ArchetypeFile | ArchetypeRemote>;

/** To generate files dynamically */
export interface ArchetypeFile<T = unknown> {
  base?: "src" | "root";
  path: string;
  overwrite?: boolean;
  content: T | URL | ((prev?: T) => T | Promise<T>);
  url?: string;
}

/** Allow to download files */
export interface ArchetypeRemote {
  url: string | URL;
  path?: string;
  files: string[];
  overwrite?: boolean;
}

async function saveFile(path: string, content: string | Uint8Array, overwrite = false) {
  ensureDir(dirname(path));

  try {
    if (content instanceof Uint8Array) {
      await writeFile(path, content, !overwrite);
    } else {
      await writeTextFile(path, content, !overwrite);
    }

    if (overwrite) {
      log.info(`✔️ Updated file: <gray>${path}</gray>`);
    } else {
      log.info(`✔️ Created file: <gray>${path}</gray>`);
    }
  } catch (error) {
    if ((error as FsError).code === "exists") {
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
    newContent = previousContent ? await fn(parse(previousContent)) : await fn();
    overwrite = true;
  } else {
    newContent = content;
  }

  return await saveFile(fullPath, stringify(newContent) + "\n", overwrite);
}

async function readFile(path: string): Promise<string | undefined> {
  try {
    return await readTextFile(path);
  } catch (error) {
    if ((error as FsError).code === "not-found") {
      return;
    }
    throw error;
  }
}

function isRemote(arch: ArchetypeFile | ArchetypeRemote): arch is ArchetypeRemote {
  return !!arch.url;
}

async function remoteToFile(remote: ArchetypeRemote): Promise<ArchetypeFile[]> {
  const overwrite = remote.overwrite;
  const url = remote.url.toString();

  if (isFromCdn(url) || url.startsWith("file:")) {
    const files = await getFiles(url, remote.files);
    return Array.from(files).map(([file, url]) => ({
      path: join(remote.path ?? "/", file),
      overwrite,
      content: new URL(url),
    }));
  }

  if (isUrl(url)) {
    return remote.files.map((file) => ({
      path: join(remote.path ?? "/", file),
      overwrite,
      content: new URL(url),
    }));
  }

  throw new Error(`Invalid archifact's url "${url}"`);
}
