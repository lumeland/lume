import { join } from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import fsPromises from "node:fs/promises";
import { Readable } from "node:stream";

/** Read a binary file */
export async function readFile(file: string): Promise<Uint8Array<ArrayBuffer>> {
  const buf = await fsPromises.readFile(file);
  return new Uint8Array(
    buf.buffer as ArrayBuffer,
    buf.byteOffset,
    buf.length / Uint8Array.BYTES_PER_ELEMENT,
  );
}

/** Synchronously read a binary file */
export function readFileSync(file: string): Uint8Array<ArrayBuffer> {
  return fs.readFileSync(toPath(file));
}

/** Read a text file */
export async function readTextFile(file: string): Promise<string> {
  try {
    return await fsPromises.readFile(toPath(file), "utf-8");
  } catch (error) {
    throw new FsError(error as Error);
  }
}

/** Synchronously read a text file */
export function readTextFileSync(file: string): string {
  return fs.readFileSync(toPath(file), "utf-8");
}

/** Write a binary file */
export async function writeFile(
  file: string,
  content: Uint8Array,
  createNew?: boolean,
): Promise<void> {
  try {
    await fsPromises.writeFile(toPath(file), content, { flag: createNew ? "wx" : "w" });
  } catch (error) {
    throw new FsError(error as Error);
  }
}

/** Synchronously write a binary file */
export function writeFileSync(file: string, content: Uint8Array): void {
  fs.writeFileSync(toPath(file), content);
}

/** Write a text file */
export async function writeTextFile(
  file: string,
  content: string,
  createNew?: boolean,
): Promise<void> {
  try {
    await fsPromises.writeFile(toPath(file), content, { flag: createNew ? "wx" : "w" });
  } catch (error) {
    throw new FsError(error as Error);
  }
}

/** Synchronously write a text file */
export function writeTextFileSync(file: string, content: string): void {
  fs.writeFileSync(toPath(file), content);
}

/** Remove a file or folder */
export async function remove(file: string, recursive?: boolean): Promise<void> {
  await fsPromises.rm(toPath(file), { recursive });
}

/** Synchronously remove a file or folder */
export function removeSync(file: string, recursive?: boolean): void {
  fs.rmSync(toPath(file), { recursive });
}

/** Synchronously returns a full normalized path */
export function realPathSync(file: string): string {
  return fs.realpathSync(toPath(file));
}

/** Synchronously returns an iterable of a directory content */
export function* readDirSync(path: string): Generator<DirEntry> {
  try {
    const entries = fs.readdirSync(toPath(path), {
      withFileTypes: true,
    });

    for (const entry of entries) {
      yield {
        name: entry.name,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
        isSymlink: entry.isSymbolicLink(),
      };
    }
  } catch (error) {
    throw new FsError(error as Error);
  }
}

/** Synchronously creates a new directory with the specified path. */
export function mkdirSync(path: string, recursive?: boolean) {
  try {
    return fs.mkdirSync(toPath(path), { recursive });
  } catch (error) {
    throw new FsError(error as Error);
  }
}

export interface DirEntry {
  name: string;
  isFile: boolean;
  isDirectory: boolean;
  isSymlink: boolean;
}

export class FsError extends Error {
  constructor(cause: Error) {
    super(cause.message);
    this.cause = cause;
  }

  get code() {
    if ((this.cause as { code: string }).code === "ENOENT") return "not-found";
    console.log(this.cause);
    if (this.cause instanceof Deno.errors.AlreadyExists) return "exists";
    return "other";
  }
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

/** Synchronously returns a FileInfo for a specific path */
export function statSync(path: string): FileInfo {
  try {
    const info = fs.statSync(toPath(path));
    return {
      get isFile() {
        return info.isFile();
      },
      get isDirectory() {
        return info.isDirectory();
      },
      get isSymlink() {
        return info.isSymbolicLink();
      },
      size: info.size,
      mtime: info.mtime,
      atime: info.atime,
      ctime: info.ctime,
      birthtime: info.birthtime,
    };
  } catch (error) {
    throw new FsError(error as Error);
  }
}

export class FileWatcher {
  #controller = new AbortController();
  #paths: string[];

  constructor(paths: string[]) {
    this.#paths = paths;
  }

  close(): void {
    this.#controller.abort();
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<string[]> {
    const { signal } = this.#controller;

    const iterator = mergeIterators(
      this.#paths.map((p) => [p, fsPromises.watch(p, { signal, recursive: true })]),
    );

    for await (const change of iterator) {
      yield change;
    }
  }
}

export function watchFiles(paths: string[]): FileWatcher {
  return new FileWatcher(paths.map(toPath));
}

export interface FsStream {
  readable: ReadableStream<Uint8Array<ArrayBuffer>>;
  [Symbol.dispose]: () => void;
}

export function readStream(file: string, start?: number): FsStream {
  const nodeStream = fs.createReadStream(toPath(file), { start });

  return {
    readable: Readable.toWeb(nodeStream) as ReadableStream<Uint8Array<ArrayBuffer>>,
    [Symbol.dispose]: () => {
      nodeStream.destroy();
    },
  };
}

function mergeIterators(
  iterators: [string, AsyncIterable<{ filename: string | null }>][],
): AsyncIterable<string[]> {
  let done = false;

  return new ReadableStream<string[]>({
    start(controller) {
      let active = iterators.length;

      for (const [root, it] of iterators) {
        (async () => {
          try {
            for await (const item of it) {
              if (item.filename) {
                controller.enqueue([join(root, item.filename)]);
              }
            }
          } catch (error) {
            if ((error as Error)?.name !== "AbortError" && !done) {
              done = true;
              controller.error(error);
            }
          } finally {
            active--;
            if (active === 0 && !done) {
              done = true;
              controller.close();
            }
          }
        })();
      }
    },
    cancel() {
      done = true;
    },
  });
}

// Ensure file: URLs are converted to paths
function toPath(urlOrPath: string): string {
  return urlOrPath.startsWith("file:") ? fileURLToPath(urlOrPath) : urlOrPath;
}
