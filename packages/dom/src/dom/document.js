import { CTOR_KEY } from "../constructor-lock.js";
import { Comment, Node, NodeType, Text } from "./node.js";
import { NodeList, nodeListMutatorSym } from "./node-list.js";
import { Element } from "./element.js";
import { DocumentFragment } from "./document-fragment.js";
import { HTMLTemplateElement } from "./elements/html-template-element.js";
import { getSelectorEngine } from "./selectors/selectors.js";
import { getElementsByClassName } from "./utils.js";
import UtilTypes from "./utils-types.js";
import { getUpperCase } from "./string-cache.js";
export class DOMImplementation {
  constructor(key){
    if (key !== CTOR_KEY) {
      throw new TypeError("Illegal constructor.");
    }
  }
  createDocument() {
    throw new Error("Unimplemented"); // TODO
  }
  createHTMLDocument(titleStr) {
    titleStr += "";
    const doc = new HTMLDocument(CTOR_KEY);
    const docType = new DocumentType("html", "", "", CTOR_KEY);
    doc.appendChild(docType);
    const html = new Element("html", doc, [], CTOR_KEY);
    html._setOwnerDocument(doc);
    const head = new Element("head", html, [], CTOR_KEY);
    const body = new Element("body", html, [], CTOR_KEY);
    const title = new Element("title", head, [], CTOR_KEY);
    const titleText = new Text(titleStr);
    title.appendChild(titleText);
    doc.head = head;
    doc.body = body;
    return doc;
  }
  createDocumentType(qualifiedName, publicId, systemId) {
    const doctype = new DocumentType(qualifiedName, publicId, systemId, CTOR_KEY);
    return doctype;
  }
}
export class DocumentType extends Node {
  #qualifiedName = "";
  #publicId = "";
  #systemId = "";
  constructor(name, publicId, systemId, key){
    super("html", NodeType.DOCUMENT_TYPE_NODE, null, key);
    this.#qualifiedName = name;
    this.#publicId = publicId;
    this.#systemId = systemId;
  }
  get name() {
    return this.#qualifiedName;
  }
  get publicId() {
    return this.#publicId;
  }
  get systemId() {
    return this.#systemId;
  }
  _shallowClone() {
    return new DocumentType(this.#qualifiedName, this.#publicId, this.#systemId, CTOR_KEY);
  }
}
export class Document extends Node {
  head = null;
  body = null;
  implementation;
  #documentURI = "about:blank";
  #nwapi = null;
  constructor(){
    super("#document", NodeType.DOCUMENT_NODE, null, CTOR_KEY);
    this.implementation = new DOMImplementation(CTOR_KEY);
  }
  _shallowClone() {
    return new Document();
  }
  // Expose the document's NWAPI for Element's access to
  // querySelector/querySelectorAll
  get _nwapi() {
    return this.#nwapi || (this.#nwapi = getSelectorEngine()(this));
  }
  get documentURI() {
    return this.#documentURI;
  }
  get title() {
    return this.querySelector("title")?.textContent || "";
  }
  set title(value) {
    let titleElement = this.querySelector("title");
    if (!titleElement) {
      const { head } = this;
      if (!head) return;
      titleElement = this.createElement("title");
      head.appendChild(titleElement);
    }
    titleElement.textContent = value;
  }
  get cookie() {
    return ""; // TODO
  }
  set cookie(newCookie) {
  // TODO
  }
  get visibilityState() {
    return "visible";
  }
  get hidden() {
    return false;
  }
  get compatMode() {
    return "CSS1Compat";
  }
  get documentElement() {
    for (const node of this.childNodes){
      if (node.nodeType === NodeType.ELEMENT_NODE) {
        return node;
      }
    }
    return null;
  }
  get doctype() {
    for (const node of this.childNodes){
      if (node.nodeType === NodeType.DOCUMENT_TYPE_NODE) {
        return node;
      }
    }
    return null;
  }
  get childElementCount() {
    let count = 0;
    for (const { nodeType } of this.childNodes){
      if (nodeType === NodeType.ELEMENT_NODE) {
        count++;
      }
    }
    return count;
  }
  appendChild(child) {
    super.appendChild(child);
    child._setOwnerDocument(this);
    return child;
  }
  createElement(tagName, options) {
    tagName = getUpperCase(tagName);
    switch(tagName){
      case "TEMPLATE":
        {
          const frag = new DocumentFragment();
          const elm = new HTMLTemplateElement(null, [], CTOR_KEY, frag);
          elm._setOwnerDocument(this);
          return elm;
        }
      default:
        {
          const elm = new Element(tagName, null, [], CTOR_KEY);
          elm._setOwnerDocument(this);
          return elm;
        }
    }
  }
  createElementNS(namespace, qualifiedName, options) {
    if (namespace === "http://www.w3.org/1999/xhtml") {
      return this.createElement(qualifiedName, options);
    } else {
      throw new Error(`createElementNS: "${namespace}" namespace unimplemented`); // TODO
    }
  }
  createTextNode(data) {
    return new Text(data);
  }
  createComment(data) {
    return new Comment(data);
  }
  createDocumentFragment() {
    const fragment = new DocumentFragment();
    fragment._setOwnerDocument(this);
    return fragment;
  }
  importNode(node, deep = false) {
    const copy = node.cloneNode(deep);
    copy._setOwnerDocument(this);
    return copy;
  }
  adoptNode(node) {
    if (node instanceof Document) {
      throw new DOMException("Adopting a Document node is not supported.", "NotSupportedError");
    }
    node._setParent(null);
    node._setOwnerDocument(this);
    return node;
  }
  // FIXME: This is a bad solution. The correct solution
  // would be to make `.body` and `.head` dynamic getters,
  // but that would be a breaking change since `.body`
  // and `.head` would need to be typed as `Element | null`.
  // Currently they're typed as `Element` which is incorrect...
  cloneNode(deep) {
    const doc = super.cloneNode(deep);
    for (const child of doc.documentElement?.childNodes || []){
      switch(child.nodeName){
        case "BODY":
          {
            doc.body = child;
            break;
          }
        case "HEAD":
          {
            doc.head = child;
            break;
          }
      }
    }
    return doc;
  }
  querySelector(selectors) {
    return this._nwapi.first(selectors, this);
  }
  querySelectorAll(selectors) {
    const nodeList = new NodeList();
    const mutator = nodeList[nodeListMutatorSym]();
    for (const match of this._nwapi.select(selectors, this)){
      mutator.push(match);
    }
    return nodeList;
  }
  // TODO: DRY!!!
  getElementById(id) {
    if (!this._hasInitializedChildNodes()) {
      return null;
    }
    for (const child of this.childNodes){
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        if (child.id === id) {
          return child;
        }
        const search = child.getElementById(id);
        if (search) {
          return search;
        }
      }
    }
    return null;
  }
  getElementsByTagName(tagName) {
    if (tagName === "*") {
      return this.documentElement ? this._getElementsByTagNameWildcard(this.documentElement, []) : [];
    } else {
      return this._getElementsByTagName(getUpperCase(tagName), []);
    }
  }
  _getElementsByTagNameWildcard(node, search) {
    for (const child of this.childNodes){
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        search.push(child);
        child._getElementsByTagNameWildcard(search);
      }
    }
    return search;
  }
  _getElementsByTagName(tagName, search) {
    for (const child of this.childNodes){
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        if (child.tagName === tagName) {
          search.push(child);
        }
        child._getElementsByTagName(tagName, search);
      }
    }
    return search;
  }
  getElementsByTagNameNS(_namespace, localName) {
    return this.getElementsByTagName(localName);
  }
  getElementsByClassName(className) {
    return getElementsByClassName(this, className.trim().split(/\s+/), []);
  }
  hasFocus() {
    return true;
  }
}
export class HTMLDocument extends Document {
  constructor(key){
    if (key !== CTOR_KEY) {
      throw new TypeError("Illegal constructor.");
    }
    super();
  }
  _shallowClone() {
    return new HTMLDocument(CTOR_KEY);
  }
}
UtilTypes.Document = Document;
//# sourceMappingURL=document.js.map