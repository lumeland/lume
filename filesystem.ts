import { join } from "./deps/path.ts";
import { documentToString, normalizePath, stringToDocument } from "./utils.ts";
import { HTMLDocument } from "./deps/dom.ts";

interface Data {
  tags?: string | string[];
}

interface Src {
  path: string;
  ext?: string;
  lastModified?: Date;
  created?: Date;
}

interface Dest {
  path: string;
  ext?: string;
  hash?: string;
}

class Base {
  src: Src;
  parent: Directory | null = null;
  #data: Data = {};
  #cache: Data | null = null;

  constructor(src: Src) {
    this.src = src;
  }

  get data(): Data {
    if (!this.#cache) {
      this.#cache = this.getMergedData();
    }

    return this.#cache;
  }

  set data(data: Data) {
    this.#data = data;
  }

  getMergedData(): Data {
    let data = { ...this.#data };
    let tags: string[] = [];

    if (data.tags) {
      tags = Array.isArray(data.tags)
        ? data.tags.map((tag) => String(tag))
        : [String(data.tags)];
    }

    if (this.parent) {
      const parentData = this.parent.data;

      data = { ...parentData, ...data };

      if (parentData.tags) {
        tags = [...parentData.tags, ...tags];
      }
    }

    data.tags = [...new Set(tags)];

    return data;
  }

  refreshCache() {
    this.#cache = null;
  }
}

type Content = Uint8Array | string | null;
type Document = HTMLDocument | null;

/**
 * Class to represent a page file
 */
export class Page extends Base {
  dest: Dest;
  #content: Content = null;
  #document: Document = null;
  #copy = 0;

  constructor(src: Src) {
    super(src);

    this.dest = {
      path: normalizePath(src.path),
      ext: src.ext,
    };
  }

  duplicate(data = {}): Page {
    const page = new Page({ ...this.src });
    page.dest = { ...this.dest };
    page.data = { ...this.data, ...data };
    page.parent = this.parent;
    page.src.path += `[${this.#copy++}]`;

    return page;
  }

  set content(content: Content) {
    this.#document = null;
    this.#content = content;
  }

  get content(): Content {
    if (this.#document) {
      this.#content = documentToString(this.#document);
      this.#document = null;
    }

    return this.#content;
  }

  set document(document: Document) {
    this.#content = null;
    this.#document = document;
  }

  get document(): Document {
    if (!this.#document && typeof this.#content === "string") {
      this.#document = stringToDocument(this.#content);
    }

    return this.#document;
  }
}

/**
 * Class to represent a directory
 */
export class Directory extends Base {
  pages: Map<string, Page> = new Map();
  dirs: Map<string, Directory> = new Map();

  createDirectory(name: string): Directory {
    const path = join(this.src.path, name);
    const directory = new Directory({ path });
    directory.parent = this;
    this.dirs.set(name, directory);
    return directory;
  }

  setPage(name: string, page: Page) {
    const oldPage = this.pages.get(name);
    page.parent = this;
    this.pages.set(name, page);

    if (oldPage) {
      page.dest.hash = oldPage.dest.hash;
    }
  }

  unsetPage(name: string) {
    this.pages.delete(name);
  }

  *getPages(recursive = true): Iterable<Page> {
    for (const page of this.pages.values()) {
      yield page;
    }

    if (recursive) {
      for (const dir of this.dirs.values()) {
        yield* dir.getPages();
      }
    }
  }

  refreshCache() {
    this.pages.forEach((page) => page.refreshCache());
    this.dirs.forEach((dir) => dir.refreshCache());
    super.refreshCache();
  }
}
