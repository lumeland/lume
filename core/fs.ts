import { posix } from "../deps/path.ts";
import { toFileUrl } from "../deps/path.ts";

import type { RawData } from "./file.ts";

type EntryType = "file" | "directory";

export type Loader = (path: string) => Promise<RawData>;

export interface Options {
  root: string;
  ignore?: (string | ((path: string) => boolean))[];
}

export class Entry {
  name: string;
  path: string;
  type: EntryType;
  src: string;
  children = new Map<string, Entry>();
  flags = new Set<string>();
  #content = new Map<Loader, Promise<RawData> | RawData>();
  #info?: Deno.FileInfo;

  constructor(name: string, path: string, type: EntryType, src: string) {
    this.name = name;
    this.path = path;
    this.type = type;
    this.src = src;
  }

  getContent(loader: Loader): Promise<RawData> | RawData {
    if (!this.#content.has(loader)) {
      this.#content.set(loader, loader(this.src));
    }

    return this.#content.get(loader)!;
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
    // Check if it's a remote file
    const src = toFileUrl(posix.join(this.options.root, path)).href;
    const remote = findMapByValue(this.remoteFiles, src);
    if (remote) {
      path = remote;
    }

    const exist = this.entries.get(path);

    let entry: Entry;
    if (exist && exist.type !== "directory") {
      this.entries.delete(path);
      entry = this.addEntry({ path });
    } else if (exist) {
      entry = exist;
    } else {
      entry = this.addEntry({ path });
    }

    // Handle remote files
    if (remote) {
      entry.flags.add("remote");
      entry.src = src;
    }

    try {
      entry.getInfo();
    } catch (error) {
      // Remove if it doesn't exist
      if (error instanceof Deno.errors.NotFound) {
        const src = this.remoteFiles.get(path);
        if (src) {
          entry.flags.add("remote");
          entry.src = src;
          return;
        }
        this.removeEntry(path);
        return exist;
      }
    }

    // New directory, walk it
    if (entry.type === "directory" && !exist) {
      this.#walkFs(entry);
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
      const path = posix.join(dir.path, dirEntry.name);

      if (dirEntry.isSymlink) {
        this.#walkLink(dir, dirEntry.name);
        continue;
      }

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

  #walkLink(dir: Entry, name: string) {
    const src = posix.join(dir.src, name);
    const info = Deno.statSync(src);
    const type = info.isDirectory ? "directory" : "file";

    const entry = new Entry(
      name,
      posix.join(dir.path, name),
      type,
      Deno.realPathSync(src),
    );

    dir.children.set(name, entry);
    this.entries.set(entry.path, entry);

    if (type === "directory") {
      this.#walkFs(entry);
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
        const info = Deno.statSync(data.src!);
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
      data.src!,
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
    isBlockDevice: null,
    isCharDevice: null,
    isSocket: null,
    isFifo: null,
    size: 0,
    mtime: new Date(),
    atime: new Date(),
    ctime: new Date(),
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

function findMapByValue<K, V>(map: Map<K, V>, value: V): K | undefined {
  for (const [key, val] of map.entries()) {
    if (val === value) {
      return key;
    }
  }
}
