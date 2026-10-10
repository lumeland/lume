import { CTOR_KEY } from "../constructor-lock.js";
import { nodesFromString } from "../deserialize.js";
import { DocumentType, HTMLDocument } from "./document.js";
export class DOMParser {
  parseFromString(source, mimeType) {
    if (mimeType !== "text/html") {
      throw new Error(`DOMParser: "${mimeType}" unimplemented`); // TODO
    }
    const doc = new HTMLDocument(CTOR_KEY);
    const fakeDoc = nodesFromString(String(source));
    let htmlNode = null;
    let hasDoctype = false;
    for (const child of [
      ...fakeDoc.childNodes
    ]){
      doc.appendChild(child);
      if (child instanceof DocumentType) {
        hasDoctype = true;
      } else if (child.nodeName === "HTML") {
        htmlNode = child;
      }
    }
    if (!hasDoctype) {
      const docType = new DocumentType("html", "", "", CTOR_KEY);
      // doc.insertBefore(docType, doc.firstChild);
      if (doc.childNodes.length === 0) {
        doc.appendChild(docType);
      } else {
        doc.insertBefore(docType, doc.childNodes[0]);
      }
    }
    if (htmlNode) {
      for (const child of htmlNode.childNodes){
        switch(child.tagName){
          case "HEAD":
            doc.head = child;
            break;
          case "BODY":
            doc.body = child;
            break;
        }
      }
    }
    return doc;
  }
}
//# sourceMappingURL=dom-parser.js.map