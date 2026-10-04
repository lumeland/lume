/** Read a binary file */
export async function readFile(file: string): Promise<Uint8Array<ArrayBuffer>> {
  return await Deno.readFile(file);
}

/** Synchronously read a binary file */
export function readFileSync(file: string): Uint8Array<ArrayBuffer> {
  return Deno.readFileSync(file);
}

/** Read a text file */
export async function readTextFile(file: string): Promise<string> {
  try {
    return await Deno.readTextFile(file);
  } catch (error) {
    throw new FsError(error as Error);
  }
}

/** Synchronously read a text file */
export function readTextFileSync(file: string): string {
  return Deno.readTextFileSync(file);
}

/** Write a binary file */
export async function writeFile(
  file: string,
  content: Uint8Array,
  createNew?: boolean,
): Promise<void> {
  try {
    await Deno.writeFile(file, content, { createNew });
  } catch (error) {
    throw new FsError(error as Error);
  }
}

/** Synchronously write a binary file */
export function writeFileSync(file: string, content: Uint8Array): void {
  Deno.writeFileSync(file, content);
}

/** Write a text file */
export async function writeTextFile(
  file: string,
  content: string,
  createNew?: boolean,
): Promise<void> {
  try {
    await Deno.writeTextFile(file, content, { createNew });
  } catch (error) {
    throw new FsError(error as Error);
  }
}

/** Synchronously write a text file */
export function writeTextFileSync(file: string, content: string): void {
  Deno.writeTextFileSync(file, content);
}

/** Remove a file or folder */
export async function remove(file: string, recursive?: boolean): Promise<void> {
  await Deno.remove(file, { recursive });
}

/** Synchronously remove a file or folder */
export function removeSync(file: string, recursive?: boolean): void {
  Deno.removeSync(file, { recursive });
}

/** Synchronously returns a full normalized path */
export function realPathSync(file: string): string {
  return Deno.realPathSync(file);
}

/** Synchronously returns an iterable of a directory content */
export function readDirSync(path: string): IteratorObject<DirEntry> {
  return Deno.readDirSync(path);
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
    if (this.cause instanceof Deno.errors.NotFound) return "not-found";
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
    return Deno.statSync(path);
  } catch (error) {
    throw new FsError(error as Error);
  }
}

export class FileWatcher {
  #watcher: Deno.FsWatcher;

  constructor(watcher: Deno.FsWatcher) {
    this.#watcher = watcher;
  }

  close(): void {
    this.#watcher.close();
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<string[]> {
    for await (const event of this.#watcher) {
      yield event.paths;
    }
  }
}

export function watchFiles(paths: string[]): FileWatcher {
  return new FileWatcher(Deno.watchFs(paths));
}

export interface FsStream {
  readable: ReadableStream<Uint8Array<ArrayBuffer>>;
  [Symbol.dispose]: () => void;
}

export function readStream(file: string): FsStream {
  return Deno.openSync(file, { read: true, write: false });
}
