import { join } from "../deps/path.ts";
import { HTMLDocument } from "../deps/dom.ts";
import { documentToString, normalizePath, stringToDocument } from "./utils.ts";
import { Content, Data, Dest, Directory, Page, Src } from "../core.ts";

class Base {
  src: Src;
  parent?: Directory;
  #data?: Data;
  #cache?: Data;

  constructor(src?: Src) {
    this.src = src || { path: "" };

    // Make data enumerable
    const data = Object.assign(
      Object.getOwnPropertyDescriptor(Base.prototype, "data"),
      { enumerable: true },
    );
    Object.defineProperty(this, "data", data);
  }

  get data(): Data {
    if (!this.#cache) {
      this.#cache = this.#getMergedData();
    }

    return this.#cache;
  }

  set data(data: Data) {
    this.#cache = undefined;
    this.#data = data;
  }

  addData(data: Data) {
    const [oldData, oldTags] = prepareData(this.#data || {});
    const [newData, newTags] = prepareData(data);
    const merged = { ...oldData, ...newData };
    merged.tags = [...oldTags, ...newTags];
    this.data = merged;
  }

  /** Merge and return the data */
  #getMergedData(): Data {
    let [data, tags] = prepareData({ ...this.#data });

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
    this.#cache = undefined;
  }
}

/** A page of the site */
export class SitePage extends Base implements Page {
  dest: Dest;
  #_data = {};
  #content?: Content;
  #document?: HTMLDocument;
  #copy = 0;

  constructor(src?: Src) {
    super(src);

    this.dest = {
      path: normalizePath(this.src.path),
      ext: this.src.ext || "",
    };
  }

  duplicate(data = {}): Page {
    const page = new SitePage({ ...this.src });
    page.dest = { ...this.dest };
    page.data = { ...this.data, ...data };
    page.parent = this.parent;
    page.src.path += `[${this.#copy++}]`;

    return page;
  }

  set _data(data: Record<string, unknown>) {
    this.#_data = data;
  }

  get _data() {
    return this.#_data;
  }

  set content(content: Content | undefined) {
    this.#document = undefined;
    this.#content = content instanceof Uint8Array
      ? content
      : content && content.toString();
  }

  get content(): Content | undefined {
    if (this.#document) {
      this.#content = documentToString(this.#document);
      this.#document = undefined;
    }

    return this.#content;
  }

  set document(document: HTMLDocument | undefined) {
    this.#content = undefined;
    this.#document = document;
  }

  get document(): HTMLDocument | undefined {
    if (!this.#document && this.#content) {
      this.#document = stringToDocument(this.#content.toString());
    }

    return this.#document;
  }
}

/** A directory */
export class SiteDirectory extends Base implements Directory {
  pages = new Map<string, Page>();
  dirs = new Map<string, Directory>();

  createDirectory(name: string): Directory {
    const path = join(this.src.path, name);
    const directory = new SiteDirectory({ path });
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

  *getPages(): Iterable<Page> {
    for (const page of this.pages.values()) {
      yield page;
    }

    for (const dir of this.dirs.values()) {
      yield* dir.getPages();
    }
  }

  refreshCache() {
    this.pages.forEach((page) => page.refreshCache());
    this.dirs.forEach((dir) => dir.refreshCache());
    super.refreshCache();
  }
}

/** Prepare the data, ensuring that tags is an array of strings */
function prepareData(data: Data): [Data, string[]] {
  let tags: string[] = [];

  if (data.tags) {
    tags = Array.isArray(data.tags)
      ? data.tags.map((tag) => String(tag))
      : [String(data.tags)];
  }

  return [data, tags];
}
