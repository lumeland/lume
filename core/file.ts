import { posix } from "../deps/path.ts";
import { documentToString, stringToDocument } from "./utils/dom.ts";
import binaryLoader from "./loaders/binary.ts";
import { decodeURIComponentSafe } from "./utils/path.ts";

import type { MergeStrategy } from "./utils/merge_data.ts";
import type { ProxyComponents } from "./components.ts";
import type { Entry } from "./fs.ts";
import { isPlainObject } from "./utils/object.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();
const URL_IS_HTML = /(\/|\.x?html)$/;

/** A page of the site */
export class Page<D extends RawData = Data> {
  /** The src info */
  src: Src;

  /** Used to save the page data */
  data: D & { page: Page<D> };

  /** Whether this page comes from a copied file with site.copy() */
  isCopy = false;

  /** The page content (string or Uint8Array) */
  #content?: Content;

  /** The parsed HTML (only for HTML documents) */
  #document?: Document;

  /** Convenient way to create a page dynamically */
  static create<D extends RawData & { url: string; content?: Content }>(
    data: D,
    src?: Partial<Src>,
  ): Page<Omit<D, "basename"> & { basename: string }> {
    const basename = posix.basename(data.url).replace(/\.[\w.]+$/, "");

    if (data.url.endsWith("/index.html")) {
      data.url = data.url.slice(0, -10);
    }

    const page = new Page<Omit<D, "basename"> & { basename: string }>(src, {
      ...data,
      basename,
    });
    page.content = data.content;

    return page;
  }

  constructor(src?: Partial<Src>, data?: D) {
    this.data = { ...data, page: this } as unknown as Page<D>["data"];
    this.src = { path: "", ext: "", ...src };
  }

  /** Duplicate this page. */
  duplicate(index: number | undefined, data: D): Page<D> {
    const page = new Page({ ...this.src }, data);

    if (index !== undefined) {
      page.src.path += `[${index}]`;
    }

    return page;
  }

  overwrite<T extends RawData>(
    data: T,
  ): this is Page<Omit<D, keyof T> & T> {
    Object.assign(this.data, data);
    return true;
  }

  get url() {
    return getUrl(this.data.url, this);
  }

  /** To check if the page is HTML */
  get isHTML(): boolean {
    const url = this.url;
    return !!url && URL_IS_HTML.test(url);
  }

  /** Returns the output path of this page */
  get outputPath(): string {
    const url = getUrl(this.data.url, this);
    const outputPath = url && url.endsWith("/") ? url + "index.html" : url;
    return outputPath ? decodeURIComponentSafe(outputPath) : "";
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

export class StaticFile<D extends RawData = Data> {
  /** The src info */
  src: Required<Src>;

  /** Used to save the contextual data */
  data: D;

  /** Whether this file must be copied with site.copy() */
  isCopy = false;

  static create<D extends RawData>(
    data: D,
    src: Required<Src>,
  ): StaticFile<D> {
    const file = new StaticFile(data, src);
    return file;
  }

  constructor(data: D, src: Required<Src>) {
    this.data = data;
    this.src = src;
  }

  async toPage(): Promise<
    D extends { url: string } ? Page<D & { basename: string }> : never
  > {
    const { content } = await this.src.entry.getContent(binaryLoader);
    const { content: _, ...data } = this.data as D & { url: string };
    const page = Page.create({ ...data }, this.src);
    page.content = content as Uint8Array<ArrayBuffer>;
    page.isCopy = this.isCopy;
    // deno-lint-ignore no-explicit-any
    return page as any;
  }

  /** Returns the output path of this page */
  get outputPath(): string {
    const url = getUrl(this.data.url);
    return url ? decodeURIComponentSafe(url) : "";
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

/** The data of a page declared initially */
export interface RawData {
  page?: Page<this>;

  /** The url of a page */
  url?:
    | string
    | false
    | ((page: Page<RawData & { basename: string }>) => string | false);

  /** The basename of a page */
  basename?: string;

  /** Mark the page as a draft */
  draft?: boolean;

  /** The date creation of the page */
  date?: Date | string | number;

  /** To configure the rendering order of a page */
  renderOrder?: number;

  /** The raw content of a page */
  content?: unknown;

  /** The layout used to render a page */
  layout?: string | null;

  /** To configure a different template engine(s) to render a page */
  templateEngine?: string | string[];

  /** To configure how some data keys will be merged with the parent */
  mergedKeys?: Record<string, MergeStrategy>;

  [index: string]: unknown;
}

export interface DirectoryData extends RawData {
  /** The basename of the page */
  basename: string;

  /**
   * The available components
   * @see https://lume.land/docs/core/components/
   */
  comp: ProxyComponents;
}

export interface FileData extends DirectoryData {
  /** The url of a page */
  url: string;
}

/** The data of a page/folder once loaded and processed */
export interface Data extends FileData {
  /** The date creation of the page */
  date: Date;

  /** The page reference */
  page: Page<this>;
}

/** Promote files to pages */
export async function filesToPages<D extends RawData>(
  files: StaticFile<D>[],
  pages: Page<D>[],
  filter: (file: StaticFile<D>) => boolean,
): Promise<void> {
  const toRemove: StaticFile<D>[] = files.filter(filter);

  for (const file of toRemove) {
    pages.push(await file.toPage());
    files.splice(files.indexOf(file), 1);
  }
}

export function ensureRawData(data: Record<string, unknown>): data is RawData {
  if (
    typeof data.url !== "undefined" && typeof data.url !== "string" &&
    typeof data.url !== "function" && data.url !== false
  ) {
    return false;
  }
  if (
    typeof data.basename !== "undefined" && typeof data.basename !== "string"
  ) {
    return false;
  }
  if (typeof data.draft !== "undefined" && typeof data.draft !== "boolean") {
    return false;
  }
  if (
    typeof data.date !== "undefined" && typeof data.date !== "string" &&
    typeof data.date !== "number" && !(data.date instanceof Date)
  ) {
    return false;
  }
  if (
    typeof data.renderOrder !== "undefined" &&
    typeof data.renderOrder !== "number"
  ) {
    return false;
  }
  if (
    data.layout !== null && data.layout !== undefined &&
    typeof data.layout !== "string"
  ) {
    return false;
  }
  if (
    typeof data.templateEngine !== "undefined" &&
    typeof data.templateEngine !== "string" &&
    !Array.isArray(data.templateEngine)
  ) {
    return false;
  }
  if (!isPlainObject(data.mergedKeys)) {
    return false;
  }

  return true;
}

function getUrl(
  value: unknown,
  page?: Page<Record<string, unknown>>,
): string | false | undefined {
  let url = value;
  if (typeof url === "function" && page) {
    url = url(page);
  }
  if (typeof url === "boolean" && !url) {
    return url;
  }
  if (typeof url === "string") {
    return url;
  }
  return undefined;
}
