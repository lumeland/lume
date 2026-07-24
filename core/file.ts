import { posix } from "../deps/path.ts";
import { documentToString, stringToDocument } from "./utils/dom.ts";
import binaryLoader from "./loaders/binary.ts";
import { decodeURIComponentSafe } from "./utils/path.ts";

import type { Entry } from "./fs.ts";
import type { FileData, PageData } from "../types.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();
const URL_IS_HTML = /(\/|\.x?html)$/;

/** A page of the site */
export class Page<D = unknown> {
  /** The src info */
  src: Src;

  /** Used to save the page data */
  data: PageData<D> = {} as PageData<D>;

  /** Whether this page comes from a copied file with site.copy() */
  isCopy = false;

  /** The page content (string or Uint8Array) */
  #content?: Content;

  /** The parsed HTML (only for HTML documents) */
  #document?: Document;

  /** Convenient way to create a page dynamically */
  static create(
    data: Partial<FileData> & { url: string },
    src?: Partial<Src>,
  ): Page {
    let { url, ...rest } = data;
    const basename = posix.basename(url).replace(/\.[\w.]+$/, "");
    const page = new Page(src);

    if (url.endsWith("/index.html")) {
      url = url.slice(0, -10);
    }

    page.data = { ...rest, url, page, basename } as PageData;
    page.content = data.content as Content | undefined;

    return page;
  }

  constructor(src?: Partial<Src>) {
    this.src = { path: "", ext: "", ...src };
  }

  /** Duplicate this page. */
  duplicate(index: number | undefined, data: D): Page<D> {
    const page = new Page<D>({ ...this.src });

    if (index !== undefined) {
      page.src.path += `[${index}]`;
    }

    (data as PageData<D>).page = page;
    page.data = data as PageData<D>;

    return page;
  }

  /** To check if the page is HTML */
  get isHTML(): boolean {
    return URL_IS_HTML.test(this.data.url);
  }

  /** Returns the output path of this page */
  get outputPath(): string {
    const url = this.data.url;
    const outputPath = url.endsWith("/") ? url + "index.html" : url;
    return decodeURIComponentSafe(outputPath);
  }

  /** Returns the source path of this page */
  get sourcePath(): string {
    if (!this.src.path) {
      return "(generated)";
    }

    return this.src.entry?.path ?? this.src.path + this.src.ext;
  }

  /** The content of this page */
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

  /** The content of this page as text */
  get text(): string {
    return this.content instanceof Uint8Array
      ? decoder.decode(this.content)
      : this.content ?? "";
  }

  set text(text: string) {
    this.content = text;
  }

  /** The content of this page as bytes */
  get bytes(): Uint8Array<ArrayBuffer> {
    return this.content instanceof Uint8Array
      ? this.content
      : encoder.encode(this.content || "") as Uint8Array<ArrayBuffer>;
  }

  set bytes(bytes: Uint8Array<ArrayBuffer>) {
    this.content = bytes;
  }

  /** The parsed HTML code from the content */
  set document(document: Document) {
    this.#content = undefined;
    this.#document = document;
  }

  get document(): Document {
    if (!this.#document) {
      this.#document = stringToDocument(this.text);
    }

    return this.#document;
  }
}

export class StaticFile<D extends FileData = FileData> {
  /** The src info */
  src: Required<Src>;

  /** Used to save the contextual data */
  data: D = {} as D;

  /** Whether this file must be copied with site.copy() */
  isCopy = false;

  static create(
    data: Partial<FileData> & { url: string },
    src: Required<Src>,
  ): StaticFile {
    const file = new StaticFile(src);
    file.data = { ...data } as FileData;
    return file;
  }

  constructor(src: Required<Src>) {
    this.src = src;
  }

  async toPage(): Promise<Page> {
    const { content } = await this.src.entry.getContent(binaryLoader);
    const page = Page.create(this.data, this.src);
    page.content = content as Uint8Array<ArrayBuffer>;
    page.isCopy = this.isCopy;
    return page;
  }

  /** Returns the output path of this page */
  get outputPath(): string {
    return decodeURIComponentSafe(this.data.url);
  }

  /** Returns the source path of this page */
  get sourcePath(): string {
    if (!this.src.path) {
      return "(generated)";
    }

    return this.src.entry.path;
  }
}

/** The .src property for a Page or StaticFile */
export interface Src {
  /** The path to the file (without extension) */
  path: string;

  /** The extension of the file */
  ext: string;

  /** The original entry instance */
  entry?: Entry;
}

/** The .content property for a Page */
export type Content = Uint8Array<ArrayBuffer> | string;

/** Promote files to pages */
export async function filesToPages(
  files: StaticFile[],
  pages: Page[],
  filter: (file: StaticFile) => boolean,
): Promise<void> {
  const toRemove: StaticFile[] = files.filter(filter);

  for (const file of toRemove) {
    pages.push(await file.toPage());
    files.splice(files.indexOf(file), 1);
  }
}
