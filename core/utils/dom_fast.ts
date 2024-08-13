import { DOMParser } from "../../deps/linkedom.ts";

const parser = new DOMParser();

/** Convert an Document instance to a string */
export function documentToString(document: Document) {
  const { doctype, documentElement } = document;

  if (!doctype) {
    return `<!DOCTYPE html>\n${documentElement?.outerHTML || ""}`;
  }

  return `<!DOCTYPE ${doctype.name}` +
    (doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : "") +
    (!doctype.publicId && doctype.systemId ? " SYSTEM" : "") +
    (doctype.systemId ? ` "${doctype.systemId}"` : "") +
    `>\n${documentElement?.outerHTML}`;
}

/** Parse a string with HTML code and return a Document */
export function stringToDocument(string: string): Document {
  // Get the DOCTYPE and rest of the document
  const [_match, documentType, documentString] = Array.from(
    string.match(/^(<!DOCTYPE .*?>){0,1}(.*)$/si)!,
  );

  let htmlSource = string;

  // If it's HTML or missing DOCTYPE, but not an HTML document node...
  if (
    (
      !documentType ||
      (documentType && documentType.match(/^<!DOCTYPE html>$/i))
    ) && !documentString.match(/^\s*<html/is)
  ) {
    htmlSource = `${
      documentType || ""
    }\n<html><head></head><body>${documentString}</body></html>`;
  }

  const document = parser.parseFromString(htmlSource, "text/html");

  if (!document) {
    throw new Error("Unable to parse the HTML code");
  }

  return document as unknown as Document;
}
