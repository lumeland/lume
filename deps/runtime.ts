export { isBuiltin } from "node:module";

export function args() {
  return Deno.args;
}

export function inspect(value: unknown) {
  return Deno.inspect(value, { colors: true });
}

export function exit(code: number) {
  Deno.exit(code);
}

export function cwd() {
  return Deno.cwd();
}

export function writeFile(
  path: string,
  content: Uint8Array,
  createNew = false,
) {
  return Deno.writeFile(path, content, { createNew });
}

export function writeTextFile(
  path: string,
  content: string,
  createNew = false,
) {
  return Deno.writeTextFile(path, content, { createNew });
}

export function writeFileSync(
  path: string,
  content: Uint8Array,
  createNew = false,
) {
  Deno.writeFileSync(path, content, { createNew });
}

export function writeTextFileSync(
  path: string,
  content: string,
  createNew = false,
) {
  Deno.writeTextFileSync(path, content, { createNew });
}

export function readFile(path: string | URL) {
  return Deno.readFile(path);
}

export function readFileSync(path: string | URL) {
  return Deno.readFileSync(path);
}

export function readTextFileSync(path: string | URL) {
  return Deno.readTextFileSync(path);
}

export function readTextFile(path: string | URL) {
  return Deno.readTextFile(path);
}

export function removeSync(path: string) {
  Deno.removeSync(path);
}

export function remove(path: string) {
  return Deno.remove(path);
}

const envVars = new Map<string, string>();
let allowed: boolean | undefined;
function allowedEnvVars(): boolean {
  if (allowed === undefined) {
    allowed = Deno.permissions.querySync?.({ name: "env" }).state === "granted";
  }
  return allowed;
}
export function env(name: string) {
  return allowedEnvVars()
    ? envVars.get(name) ?? Deno.env.get(name)
    : envVars.get(name);
}

export function setEnv(name: string, value: string) {
  if (allowedEnvVars()) {
    Deno.env.set(name, value);
  }
  envVars.set(name, value);
}

interface DirEntry {
  isDirectory: boolean;
  isFile: boolean;
  isSymlink: boolean;
  name: string;
}

export function readDir(path: string): AsyncIterable<DirEntry> {
  return Deno.readDir(path);
}

export function readDirSync(path: string): IteratorObject<DirEntry> {
  return Deno.readDirSync(path);
}
