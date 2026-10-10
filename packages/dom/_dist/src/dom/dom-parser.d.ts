import { HTMLDocument } from "./document.js";
export type DOMParserMimeType = "text/html" | "text/xml" | "application/xml" | "application/xhtml+xml" | "image/svg+xml";
export declare class DOMParser {
  parseFromString(source: string, mimeType: DOMParserMimeType): HTMLDocument;
}
//# sourceMappingURL=dom-parser.d.ts.map