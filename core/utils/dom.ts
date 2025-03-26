import { DOMParser } from "../../deps/dom.ts";

const parser = new DOMParser();

/** Convert an Document instance to a string */
export function documentToString(document: Document) {
  const { doctype, documentElement } = document;

  if (!doctype) {
    return documentElement?.outerHTML || "";
  }

  return `<!DOCTYPE ${doctype.name}` +
    (doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : "") +
    (!doctype.publicId && doctype.systemId ? " SYSTEM" : "") +
    (doctype.systemId ? ` "${doctype.systemId}"` : "") +
    `>\n${documentElement?.outerHTML}`;
}

/** Parse a string with HTML code and return a Document */
export function stringToDocument(string: string): Document {
  const document = parser.parseFromString(string, "text/html");

  if (!document) {
    throw new Error("Unable to parse the HTML code");
  }

  return document as unknown as Document;
}
