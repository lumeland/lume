import { stringify } from "../deps/yaml.ts";
import { dirname, join, toFileUrl } from "../deps/path.ts";
import { ensureDir } from "../deps/fs.ts";
import { cyan, yellow } from "../deps/colors.ts";
import { isGenerator, isUrl } from "../core/utils.ts";

import type { Archetype } from "../core.ts";

export default function (_options: unknown, name: string, ...args: string[]) {
  return create(name, args);
}

/** Run an archetype */
export async function create(name: string, args: string[]) {
  const mod = name.startsWith(".")
    ? await import(toFileUrl(join(Deno.cwd(), name)).href)
    : isUrl(name)
    ? await import(name)
    : await Promise.any([
      import(toFileUrl(join(Deno.cwd(), `_archetypes/${name}.ts`)).href),
      import(toFileUrl(join(Deno.cwd(), `_archetypes/${name}.js`)).href),
    ]);

  if (!mod || typeof mod.default !== "function") {
    throw new Error(`Archetype "${name}" not found.`);
  }

  const fn = mod.default;

  if (typeof fn !== "function") {
    throw new Error(`Archetype "${name}" is not a function.`);
  }

  if (isGenerator(fn)) {
    for await (const archetype of fn(...args) as Generator<Archetype>) {
      await saveArchetype(archetype);
    }
  } else {
    const archetype = fn(...args) as Archetype;
    await saveArchetype(archetype);
  }
}

async function saveArchetype(archetype: Archetype) {
  const { path, content } = archetype;

  if (!path) {
    throw new Error("Archetype path is required.");
  }
  if (!content) {
    throw new Error("Archetype content is required.");
  }

  if (typeof content === "string" || content instanceof Uint8Array) {
    return await saveFile(path, content);
  }

  if (path.endsWith(".json")) {
    return await saveFile(
      path,
      JSON.stringify(content, null, 2),
    );
  }

  if (path.endsWith(".yaml") || path.endsWith(".yml")) {
    return await saveFile(
      path,
      stringify(content),
    );
  }

  const { content: body, ...frontmatter } = content;

  return await saveFile(
    path,
    `---\n${stringify(frontmatter)}---\n${body}`,
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
