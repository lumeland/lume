import { posix } from "../deps/path.ts";

import type { Data } from "./filesystem.ts";

type EntryType = "file" | "directory";

export interface Options {
  root: string;
  ignore?: (string | ((path: string) => boolean))[];
}

export type Loader = (path: string) => Promise<Data>;

export class Entry {
  name: string;
  path: string;
  type: EntryType;
  src: string;
  children = new Map<string, Entry>();
  flags = new Set<string>();
  #content = new Map<Loader, Promise<Data> | Data>();
  #info?: Deno.FileInfo;

  constructor(name: string, path: string, type: EntryType, src: string) {
    this.name = name;
    this.path = path;
    this.type = type;
    this.src = src;
  }

  removeCache() {
    this.#content.clear();
    this.#info = undefined;
    this.flags.clear();
  }

  getContent(loader: Loader): Promise<Data> | Data {
    if (!this.#content.has(loader)) {
      this.#content.set(loader, loader(this.src));
    }

    return this.#content.get(loader)!;
  }

  setContent(loader: Loader, content: Data) {
    this.#content.set(loader, content);
  }

  getInfo() {
    if (!this.#info) {
      this.#info = this.src.includes("://")
        ? createFileInfo(this.type)
        : Deno.statSync(this.src);
    }

    return this.#info;
  }
}

/** Virtual file system used to load and cache files (local and remote) */
export default class FS {
  options: Options;
  entries = new Map<string, Entry>();
  remoteFiles = new Map<string, string>();
  tree: Entry;

  constructor(options: Options) {
    this.options = options;
    this.tree = new Entry("", "/", "directory", options.root);
    this.entries.set("/", this.tree);
  }

  init() {
    this.#walkFs(this.tree);
    this.#walkRemote();
  }

  /** Update the entry and returns it if it was removed */
  update(path: string): Entry | undefined {
    const exist = this.entries.get(path);
    const entry = exist || this.addEntry({ path });

    try {
      entry.removeCache();
      entry.getInfo();
    } catch (error) {
      // Remove if it doesn't exist
      if (error instanceof Deno.errors.NotFound) {
        this.removeEntry(path);
        return exist;
      }
    }
  }

  #isValid(path: string) {
    const { ignore } = this.options;

    return ignore
      ? !ignore.some((ignore) =>
        typeof ignore === "string"
          ? (path.startsWith(posix.join(ignore, "/")) ||
            path === ignore)
          : ignore(path)
      )
      : true;
  }

  #walkFs(dir: Entry) {
    const dirPath = posix.join(this.options.root, dir.path);

    for (const dirEntry of Deno.readDirSync(dirPath)) {
      if (dirEntry.isSymlink) {
        continue;
      }

      const path = posix.join(dir.path, dirEntry.name);

      if (!this.#isValid(path)) {
        continue;
      }

      const entry = new Entry(
        dirEntry.name,
        path,
        dirEntry.isDirectory ? "directory" : "file",
        posix.join(this.options.root, path),
      );

      dir.children.set(dirEntry.name, entry);
      this.entries.set(path, entry);

      if (entry.type === "directory") {
        this.#walkFs(entry);
      }
    }
  }

  #walkRemote() {
    // Read from remote files
    for (const [path, src] of this.remoteFiles) {
      if (this.entries.has(path)) {
        continue;
      }

      this.addEntry({
        path,
        type: "file",
        src,
      }).flags.add("remote");
    }
  }

  addEntry(data: { path: string; type?: EntryType; src?: string }): Entry {
    const pieces = data.path.split("/").filter((p) => p);
    let parent = this.tree;

    if (!data.src) {
      data.src = posix.join(this.options.root, data.path);
    }

    if (!data.type) {
      try {
        const info = Deno.statSync(data.src);
        data.type = info.isDirectory ? "directory" : "file";
      } catch {
        data.type = "file";
      }
    }

    while (pieces.length > 1) {
      const name = pieces.shift()!;
      const children = parent.children;
      const path = posix.join(parent.path, name);

      if (!this.#isValid(path)) {
        break;
      }

      parent = children.get(name) || new Entry(
        name,
        path,
        "directory",
        this.options.root + path,
      );

      children.set(name, parent);
      this.entries.set(parent.path, parent);
    }

    const name = pieces.shift()!;
    const children = parent.children;
    const entry = new Entry(
      name,
      data.path,
      data.type,
      data.src,
    );
    children.set(name, entry);
    this.entries.set(entry.path, entry);
    return entry;
  }

  removeEntry(path: string) {
    const entry = this.entries.get(path);
    const isFolder = entry?.type === "directory";

    this.entries.delete(path);
    const parent = this.entries.get(posix.dirname(path))!;
    const name = posix.basename(path);
    parent.children.delete(name);

    if (isFolder) {
      const prefix = posix.join(path, "/");
      for (const childPath of this.entries.keys()) {
        if (childPath.startsWith(prefix)) {
          this.entries.delete(childPath);
        }
      }
    }
  }
}

function createFileInfo(type: EntryType): Deno.FileInfo {
  return {
    isFile: type === "file",
    isDirectory: type === "directory",
    isSymlink: false,
    size: 0,
    mtime: new Date(),
    atime: new Date(),
    birthtime: new Date(),
    dev: 0,
    ino: null,
    mode: null,
    nlink: null,
    uid: null,
    gid: null,
    rdev: null,
    blksize: null,
    blocks: null,
  };
}
