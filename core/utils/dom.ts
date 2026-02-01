import { DOMParser } from "../../deps/dom.ts";

const parser = new DOMParser();

/** Convert an Document instance to a string */
export function documentToString(document: Document) {
  const { doctype, documentElement } = document;
  const content = documentElement?.outerHTML ?? "";

  // It's XHTML
  if (documentElement.hasAttribute("xmlns")) {
    return `<?xml version="1.0" encoding="utf-8"?>\n${html2Xhtml(content)}`;
  }

  // It doesn't have a doctype
  if (!doctype) {
    return content;
  }

  return `<!DOCTYPE ${doctype.name}` +
    (doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : "") +
    (!doctype.publicId && doctype.systemId ? " SYSTEM" : "") +
    (doctype.systemId ? ` "${doctype.systemId}"` : "") +
    `>\n${content}`;
}

/** Parse a string with HTML code and return a Document */
export function stringToDocument(string: string): Document {
  const document = parser.parseFromString(string, "text/html");

  if (!document) {
    throw new Error("Unable to parse the HTML code");
  }

  return document as unknown as Document;
}

/** Convert HTML code to XHTML */
const VOID_ELEMENTS =
  /<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)([^>]*[^/>])?>/ig;
export function html2Xhtml(string: string): string {
  return string.replaceAll(VOID_ELEMENTS, "<$1$2/>");
}
