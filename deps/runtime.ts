export { isBuiltin } from "node:module";

export class ErrorFileAlreadyExists extends Error {}

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
  try {
    return Deno.writeFile(path, content, { createNew });
  } catch (cause) {
    if (cause instanceof Deno.errors.AlreadyExists) {
      throw new ErrorFileAlreadyExists(cause.message, { cause });
    }
    throw cause;
  }
}

export function writeTextFile(
  path: string,
  content: string,
  createNew = false,
) {
  try {
    return Deno.writeTextFile(path, content, { createNew });
  } catch (cause) {
    if (cause instanceof Deno.errors.AlreadyExists) {
      throw new ErrorFileAlreadyExists(cause.message, { cause });
    }
    throw cause;
  }
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

export function allEnvVars() {
  return Deno.env.toObject();
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

export interface DirEntry {
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

export function realPath(path: string): Promise<string> {
  return Deno.realPath(path);
}

export function realPathSync(path: string): string {
  return Deno.realPathSync(path);
}

export interface FileInfo {
  isFile: boolean;
  isDirectory: boolean;
  isSymlink: boolean;
  size: number;
  mtime: Date | null;
  atime: Date | null;
  ctime: Date | null;
  birthtime: Date | null;
}

export function stat(path: string): Promise<FileInfo> {
  return Deno.stat(path);
}

export function statSync(path: string): FileInfo {
  return Deno.statSync(path);
}

export type OS =
  | "darwin"
  | "linux"
  | "freebsd"
  | "netbsd"
  | "aix"
  | "solaris"
  | "illumos"
  | "windows"
  | "android";

export function os(): OS {
  return Deno.build.os;
}

export function execPath() {
  return Deno.execPath();
}

export function memoryUsage(): number {
  return Deno.memoryUsage().rss;
}

export interface NetworkInterfaceInfo {
  family: "IPv4" | "IPv6";
  address: string;
}

export function networkInterfaces(): NetworkInterfaceInfo[] {
  return Deno.networkInterfaces();
}

export async function runCommand(
  cmd: string,
  args?: string[],
  cwd?: string,
): Promise<boolean> {
  const command = new Deno.Command(cmd, {
    args,
    stdout: "inherit",
    stderr: "inherit",
    cwd,
  });

  const output = await command.output();
  return output.success;
}

export function runCommandSyncAndGetStdout(
  cmd: string,
  args?: string[],
): string | undefined {
  const { stdout, success } = new Deno.Command(cmd, { args }).outputSync();

  if (!success) {
    return;
  }
  return new TextDecoder().decode(stdout);
}

export function portIsFree(port: number): boolean {
  try {
    const listener = Deno.listen({ port });
    listener.close();
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.AddrInUse) {
      return false;
    }

    throw error;
  }
}

export async function callReadableStream<R>(
  file: string,
  cb: (stream: ReadableStream<Uint8Array>) => R,
): Promise<R> {
  using fs = await Deno.open(file, {
    read: true,
    write: false,
  });

  return await cb(fs.readable);
}

export class FileWatcher {
  #watcher: Deno.FsWatcher;

  constructor(watcher: Deno.FsWatcher) {
    this.#watcher = watcher;
  }
  close(): void {
    this.#watcher.close();
  }
  async *[Symbol.asyncIterator]() {
    for await (const event of this.#watcher) {
      yield event.paths;
    }
  }
}

export function watchFiles(paths: string[]) {
  return new FileWatcher(Deno.watchFs(paths));
}

export function upgradeWebSocket(request: Request) {
  const { socket, response } = Deno.upgradeWebSocket(request);
  return { socket, response };
}
