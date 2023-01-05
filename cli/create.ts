import { stringify } from "../deps/yaml.ts";
import { dirname, join, toFileUrl } from "../deps/path.ts";
import { ensureDir } from "../deps/fs.ts";
import { cyan, yellow } from "../deps/colors.ts";
import { isGenerator, isUrl } from "../core/utils.ts";
import { createSite } from "./run.ts";

import type { Archetype, Site } from "../core.ts";

interface Options {
  config?: string;
}

export default function ({ config }: Options, name: string, ...args: string[]) {
  return create(config, name, args);
}

/** Run an archetype */
export async function create(
  config: string | undefined,
  name: string,
  args: string[],
) {
  // deno-lint-ignore no-explicit-any
  let fn: any;
  const site = await createSite(config);

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

    console.log("✔️", cyan("Created file:"), path);
  } catch (error) {
    if (error instanceof Deno.errors.AlreadyExists) {
      console.log("⚠️", yellow("File already exists:"), path);
    } else {
      throw error;
    }
  }
}
