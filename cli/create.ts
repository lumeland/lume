import { stringify } from "../deps/yaml.ts";
import { dirname, join, toFileUrl } from "../deps/path.ts";
import { ensureDir } from "../deps/fs.ts";
import { isGenerator } from "../core/utils/generator.ts";
import { isUrl } from "../core/utils/path.ts";
import { log } from "../core/utils/log.ts";
import { resolveConfigFile } from "../core/utils/lume_config.ts";
import { createSite } from "./utils.ts";

import type Site from "../core/site.ts";

/** Run an archetype */
export async function create(
  config: string | undefined,
  name: string,
  args: string[],
) {
  // deno-lint-ignore no-explicit-any
  let fn: any;
  const _config = await resolveConfigFile(["_config.ts", "_config.js"], config);
  const site = await createSite(_config);

  try {
    const mod = name.startsWith(".")
      ? await import(toFileUrl(join(Deno.cwd(), name)).href)
      : isUrl(name)
      ? await import(name)
      : await Promise.any([
        import(toFileUrl(site.src(`_archetypes/${name}.ts`)).href),
        import(toFileUrl(site.src(`_archetypes/${name}.js`)).href),
      ]);

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
    for await (const archetype of fn(...args) as Generator<Archetype>) {
      await saveArchetype(site, archetype);
    }
  } else {
    const archetype = fn(...args) as Archetype;
    await saveArchetype(site, archetype);
  }
}

async function saveArchetype(site: Site, archetype: Archetype) {
  const { path, content } = archetype;

  if (!path) {
    throw new Error("Archetype path is required.");
  }
  if (!content) {
    throw new Error("Archetype content is required.");
  }

  if (typeof content === "string" || content instanceof Uint8Array) {
    return await saveFile(site.src(path), content);
  }

  if (path.endsWith(".json")) {
    return await saveFile(
      site.src(path),
      JSON.stringify(content, null, 2) + "\n",
    );
  }

  if (path.endsWith(".yaml") || path.endsWith(".yml")) {
    return await saveFile(
      site.src(path),
      stringify(content) + "\n",
    );
  }

  const { content: body, ...frontmatter } = content;

  return await saveFile(
    site.src(path),
    `---\n${stringify(frontmatter)}---\n${body || ""}\n`,
  );
}

async function saveFile(path: string, content: string | Uint8Array) {
  await ensureDir(dirname(path));

  try {
    content instanceof Uint8Array
      ? await Deno.writeFile(path, content, { createNew: true })
      : await Deno.writeTextFile(path, content, { createNew: true });

    log.info(`✔️ Created file: <gray>${path}</gray>`);
  } catch (error) {
    if (error instanceof Deno.errors.AlreadyExists) {
      log.warn(`⚠️ File already exists: <gray>${path}</gray>`);
    } else {
      throw error;
    }
  }
}

/** Definition used to create a new Page */
export interface Archetype {
  path: string;
  content: string | Record<string, unknown> | Uint8Array;
}
