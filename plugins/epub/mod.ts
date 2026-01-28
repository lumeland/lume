import { typeByExtension } from "../../deps/media_types.ts";
import type { Data } from "../../core/file.ts";
import type { NavData } from "../nav.ts";
import { stringify, type stringifyable } from "../../deps/xml.ts";

/**
 * OPF - Open Packaging Format for eBooks
 * @see https://idpf.org/epub/30/spec/epub30-publications.html
 */

/**
 * Allowed roles for creators and contributors
 * @see https://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#TOC2.2.6
 */
export type Role =
  | "adp"
  | "ann"
  | "arr"
  | "art"
  | "asn"
  | "aut"
  | "aqt"
  | "aft"
  | "aui"
  | "ant"
  | "bkp"
  | "clb"
  | "cmm"
  | "dsr"
  | "edt"
  | "ill"
  | "lyr"
  | "mdc"
  | "mus"
  | "nrt"
  | "oth"
  | "pht"
  | "prt"
  | "red"
  | "rev"
  | "spn"
  | "ths"
  | "trc"
  | "trl";

export interface Contributor {
  /** Name of the contributor */
  name: string;

  /** Role of the contributor */
  role?: Role;

  /** Used to specify a normalized form of the contents, suitable for machine processing */
  fileAs?: string;
}

export interface Metadata {
  /** Unique identifier for the package */
  identifier: string;

  /** Title of the publication */
  title: string;

  /** Subtitle of the publication */
  subtitle?: string;

  /** File with the cover image */
  cover?: string;

  /** The creators of the publication */
  creator?: (string | Contributor)[];

  /** The subjects of the publication, including an arbitrary phrase or keyword */
  subject?: string[];

  /** Description of the publication's content. */
  description?: string;

  /** Name of the publisher */
  publisher?: string;

  /** Names of contributors to the publication */
  contributor?: (string | Contributor)[];

  /** Date of publication */
  date?: Date;

  /** Language of the publication */
  language?: string;

  /** A statement about rights, or a reference to one. */
  rights?: string;
}

export interface ManifestItem {
  id: string;
  href: string;
  mediaType: string;
  index: boolean;
  properties?: Property[];
  children?: ManifestItem[];
}

export type Property = "page-spread-left" | "page-spread-right" | "cover-image";

interface SpineItem {
  idref: string;
  linear: boolean;
}

export interface OPF {
  metadata: Metadata;
}

export function getManifest(data: Data, metadata: Metadata): ManifestItem {
  const href = data.page.outputPath.slice(1); // Remove leading /
  const id = data?.id ?? href.endsWith(".ncx")
    ? "ncx"
    : href.replaceAll("/", "-");
  const extension = href.split(".").pop()?.toLowerCase();
  const mediaType = extension
    ? typeByExtension(extension) || "application/octet-stream"
    : "application/octet-stream";

  const properties: Property[] = Array.isArray(data?.properties)
    ? data.properties
    : data?.properties
    ? [data.properties]
    : [];

  if (
    metadata.cover && data.url === metadata.cover &&
    !properties.includes("cover-image")
  ) {
    properties.push("cover-image");
  }

  return {
    id,
    href,
    mediaType,
    index: data.index ?? true,
    properties,
  };
}

export function createOPF(metadata: Metadata, manifest: ManifestItem[]) {
  const spine: SpineItem[] = manifest
    .filter((item) => item.mediaType === "application/xhtml+xml")
    .map((item) => ({
      idref: item.id,
      linear: item.index,
    }));

  const ncxItem = manifest.find((item) =>
    item.mediaType === "application/x-dtbncx+xml"
  );

  const coverItem = manifest.find((item) =>
    item.properties?.includes("cover-image")
  );

  const xmlObj: stringifyable = {
    "@version": "1.0",
    "@encoding": "UTF-8",
    package: {
      "@xmlns": "http://www.idpf.org/2007/opf",
      "@version": "3.0",
      "@xml:lang": metadata.language ?? "en-US",
      "@unique-identifier": "uid",
      "@dir": "ltr",
      metadata: {
        "@xmlns:dc": "http://purl.org/dc/elements/1.1/",

        // Dublin Core Metadata
        "dc:identifier": {
          "@id": "uid",
          "#text": metadata.identifier,
        },
        "dc:date": {
          "#text": metadata.date?.toISOString(),
        },
        "dc:rights": {
          "#text": metadata.rights,
        },
        "dc:publisher": {
          "@id": "publisher",
          "#text": metadata.publisher,
        },
        "dc:title": {
          "@id": "title",
          "#text": metadata.title,
        },
        "dc:subtitle": {
          "@id": "subtitle",
          "#text": metadata.subtitle,
        },
        "dc:description": {
          "@id": "description",
          "#text": metadata.description,
        },
        "dc:subject": metadata.subject?.map((subject, index) => ({
          "@id": `subject-${index + 1}`,
          "#text": subject,
        })) || [],
        "dc:language": {
          "#text": metadata.language ?? "en-US",
        },
        "dc:creator":
          metadata.creator?.map((creator, index) =>
            typeof creator === "string"
              ? {
                "@id": `creator-${index + 1}`,
                "#text": creator,
              }
              : {
                "@id": `creator-${index + 1}`,
                "#text": creator.name,
                "@role": creator.role,
                "@file-as": creator.fileAs,
              }
          ) || [],
        "dc:contributor":
          metadata.contributor?.map((contributor, index) =>
            typeof contributor === "string"
              ? {
                "@id": `contributor-${index + 1}`,
                "#text": contributor,
              }
              : {
                "@id": `contributor-${index + 1}`,
                "#text": contributor.name,
                "@role": contributor.role,
                "@file-as": contributor.fileAs,
              }
          ) || [],
        "link": {
          "@rel": "dcterms:conformsTo",
          "@href":
            "http://idpf.org/epub/a11y/accessibility-20170105.html#wcag-aa",
        },

        // Additional Metadata
        "meta": [
          {
            "@property": "file-as",
            "@refines": "#publisher",
            "#text": metadata.publisher,
          },
          {
            "@property": "a11y:certifiedBy",
            "#text": metadata.creator?.join(", "),
          },
          {
            "@property": "schema:accessMode",
            "#text": "textual",
          },
          {
            "@property": "schema:accessModeSufficient",
            "#text": "textual",
          },
          {
            "@property": "rendition:layout",
            "#text": "reflowable",
          },
          {
            "@property": "rendition:flow",
            "#text": "scrolled-doc",
          },
          {
            "@name": "cover",
            "@content": coverItem ? coverItem.id : undefined,
          },
        ],
      },
      manifest: {
        item: manifest.map((item) => {
          const manifestItem: stringifyable = {
            "@id": item.id,
            "@href": item.href,
            "@media-type": item.mediaType,
            "@properties": item.properties,
          };
          return manifestItem;
        }),
      },
      spine: {
        "@toc": ncxItem?.id,
        itemref: spine.map((item) => {
          const spineItem: stringifyable = {
            "@idref": item.idref,
          };
          if (!item.linear) {
            spineItem["@linear"] = "no";
          }
          return spineItem;
        }),
      },
    },
  };

  return stringify(clean(xmlObj));
}

export function createContainer(path: string) {
  const xmlObj: stringifyable = {
    "@version": "1.0",
    "@encoding": "UTF-8",
    container: {
      "@xmlns": "urn:oasis:names:tc:opendocument:xmlns:container",
      "@version": "1.0",
      rootfiles: {
        rootfile: {
          "@full-path": path,
          "@media-type": "application/oebps-package+xml",
        },
      },
    },
  };

  return stringify(clean(xmlObj));
}

export function createEncryption(files: string[]) {
  const xmlObj: stringifyable = {
    "@version": "1.0",
    "@encoding": "UTF-8",
    encryption: {
      "@xmlns": "urn:oasis:names:tc:opendocument:xmlns:container",
      EncryptedData: files.map((file) => ({
        "@xmlns": "http://www.w3.org/2001/04/xmlenc#",
        EncryptionMethod: {
          "@Algorithm": "http://www.idpf.org/2008/embedding",
        },
        CipherData: {
          CipherReference: {
            "@URI": file,
          },
        },
      })),
    },
  };

  return stringify(clean(xmlObj));
}

export function createTocNcx(
  metadata: Metadata,
  menu: NavData,
  files: ManifestItem[],
) {
  const status = { order: 1, level: 1 };
  const cover = files.find((item) => item.properties?.includes("cover-image"));
  const xmlObj: stringifyable = {
    "@version": "1.0",
    "@encoding": "UTF-8",
    ncx: {
      "@xmlns": "http://www.daisy.org/z3986/2005/ncx/",
      "@version": "2005-1",
      head: {
        meta: [
          {
            "@name": "dtb:uid",
            "@content": metadata.identifier,
          },
          {
            "@name": "dtb:depth",
            "@content": "1",
          },
          {
            "@name": "dtb:totalPageCount",
            "@content": "0",
          },
          {
            "@name": "dtb:maxPageNumber",
            "@content": "0",
          },
          {
            "@name": "cover",
            "@content": cover ? cover.id : undefined,
          },
        ],
      },
      docTitle: {
        text: metadata.title,
      },
      docAuthor: {
        text: metadata.creator?.map((creator) =>
          typeof creator === "string" ? creator : creator.name
        ).join(", "),
      },
      navMap: {
        navPoint: menu.children?.map((child) => createNavPoint(child, status)),
      },
    },
  };

  return stringify(clean(xmlObj));
}

function createNavPoint(
  menu: NavData,
  status: { order: number; level: number },
): stringifyable | undefined {
  const manifestItem = menu.data.manifestItem as ManifestItem | undefined;
  if (!manifestItem?.index) {
    return;
  }

  const navPoint: stringifyable = {
    "@id": manifestItem.id,
    "@playOrder": status.order++,
    "@class": `h${status.level}`,
    navLabel: {
      text: menu.data.title || manifestItem.id,
    },
    content: {
      "@src": manifestItem.href,
    },
  };

  if (menu.children && menu.children.length > 0) {
    status.level++;
    navPoint.navPoint = menu.children.map((child) =>
      createNavPoint(child, status)
    );
    status.level--;
  }

  return navPoint;
}

/** Remove undefined values of an object recursively */
function clean(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj)
      .map(([key, value]): [string, unknown] => {
        if (isPlainObject(value)) {
          const cleanValue = clean(value);
          return [
            key,
            Object.keys(cleanValue).length > 0 ? cleanValue : undefined,
          ];
        }
        if (Array.isArray(value)) {
          const cleanValue = value
            .map((v) => isPlainObject(v) ? clean(v) : v)
            .filter((v) => v !== undefined);
          return [
            key,
            cleanValue.length > 0 ? cleanValue : undefined,
          ];
        }
        return [key, value];
      })
      .filter(([, value]) => value !== undefined),
  );
}

const objectConstructor = {}.constructor;
export function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === "object" && obj !== null &&
    (obj.constructor === objectConstructor || obj.constructor === undefined);
}

export type EpubType =
  // Document partitions
  | "backmatter"
  | "bodymatter"
  | "cover"
  | "frontmatter"
  // Document divisions
  | "chapter"
  | "division"
  | "part"
  | "volume"
  // Document sections and components
  | "abstract"
  | "afterword"
  | "conclusion"
  | "epigraph"
  | "epilogue"
  | "foreword"
  | "introduction"
  | "preamble"
  | "preface"
  | "prologue"
  // Document navigation
  | "landmarks"
  | "loa"
  | "loi"
  | "lot"
  | "lov"
  | "toc"
  // Document reference sections
  | "appendix"
  | "colophon"
  | "credits"
  // Bibliographies
  | "bibliography"
  // Dictionaries
  | "antonym-group"
  | "condensed-entry"
  | "def"
  | "dictentry"
  | "dictionary"
  | "etymology"
  | "example"
  | "gram-info"
  | "idiom"
  | "part-of-speech"
  | "part-of-speech-list"
  | "part-of-speech-group"
  | "phonetic-transcription"
  | "phrase-list"
  | "phrase-group"
  | "sense-list"
  | "sense-group"
  | "synonym-group"
  | "tran"
  | "tran-info"
  // Glossaries
  | "glossary"
  | "glossdef"
  | "glossterm"
  // Indexes
  | "index"
  | "index-editor-note"
  | "index-entry"
  | "index-entry-list"
  | "index-group"
  | "index-headnotes"
  | "index-legend"
  | "index-locator"
  | "index-locator-list"
  | "index-locator-range"
  | "index-term"
  | "index-term-categories"
  | "index-term-category"
  | "index-xref-preferred"
  | "index-xref-related"
  // Preliminary sections and components
  | "acknowledgments"
  | "contributors"
  | "copyright-page"
  | "dedication"
  | "errata"
  | "halftitlepage"
  | "imprimatur"
  | "imprint"
  | "other-credits"
  | "revision-history"
  | "titlepage"
  // Complementary content
  | "notice"
  | "pullquote"
  | "tip"
  // Titles and headings
  | "covertitle"
  | "fulltitle"
  | "halftitle"
  | "subtitle"
  | "title"
  // Educational content
  // Learning objectives
  | "learning-objective"
  | "learning-resource"
  // Testing
  | "assessment"
  | "qna"
  // Comics
  | "balloon"
  | "panel"
  | "panel-group"
  | "sound-area"
  | "text-area"
  // Notes and annotations
  | "endnotes"
  | "footnote"
  | "footnotes"
  // References
  | "backlink"
  | "biblioref"
  | "glossref"
  | "noteref"
  // Document text
  | "concluding-sentence"
  | "credit"
  | "keyword"
  | "topic-sentence"
  // Pagination
  | "page-list"
  | "pagebreak"
  // Tables
  | "table"
  | "table-row"
  | "table-cell"
  // Lists
  | "list"
  | "list-item"
  // Figures
  | "figure"
  // Asides
  | "aside";
