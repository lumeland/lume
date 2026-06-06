import { parse, stringify } from "../deps/yaml.ts";
import { extract, test } from "../deps/front_matter.ts";
import { dirname, join, toFileUrl } from "../deps/path.ts";
import { ensureDir } from "../deps/fs.ts";
import { isGenerator } from "../core/utils/generator.ts";
import { isUrl } from "../core/utils/path.ts";
import { log } from "../core/utils/log.ts";
import { resolveConfigFile } from "../core/utils/lume_config.ts";
import { createSite } from "./utils.ts";

import type Site from "../core/site.ts";

const lumeArchetypes = ["plugin", "archetype", "cms"];

/** Run an archetype */
export async function create(
  config: string | undefined,
  name: string,
  args: string[],
) {
  let fn: Archetype | undefined;
  const _config = await resolveConfigFile(["_config.ts", "_config.js"], config);
  const site = await createSite(_config);

  try {
    const mod = await loadArchetype(site, name);

    if (mod?.default) {
      fn = mod.default;
    }
  } catch (cause) {
    throw new Error(`Archetype "${name}" not found or is errored.`, {
      cause,
    });
  }

  if (typeof fn !== "function") {
    throw new Error(`Archetype "${name}" is not a function.`);
  }

  if (isGenerator(fn)) {
    for await (const archetype of fn(...args) as Generator<ArchetypeFile>) {
      await runArchetype(site, archetype);
    }
  } else {
    const archetype = fn(...args) as ArchetypeFile | undefined;
    if (archetype) {
      await runArchetype(site, archetype);
    }
  }

  log.output();
}

async function runArchetype(site: Site, archetype: ArchetypeFile) {
  const { path, base = "src", content } = archetype;

  if (!path) {
    throw new Error("Archetype path is required.");
  }

  if (!content) {
    throw new Error("Archetype content is required.");
  }

  const fullPath = base === "root" ? site.root(path) : site.src(path);

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

async function loadArchetype(site: Site, name: string) {
  if (lumeArchetypes.includes(name)) {
    return await import(`../archetypes/${name}.ts`);
  }

  if (name.startsWith(".")) {
    return await import(toFileUrl(join(Deno.cwd(), name)).href);
  }

  if (isUrl(name)) {
    return await import(name);
  }

  return await Promise.any([
    import(toFileUrl(site.root(`_archetypes/${name}.ts`)).href),
    import(toFileUrl(site.root(`_archetypes/${name}.js`)).href),
  ]);
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
