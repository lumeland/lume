import { CTOR_KEY } from "../constructor-lock.js";
import { Comment, Node, Text } from "./node.js";
import { NodeList } from "./node-list.js";
import { Element } from "./element.js";
import { DocumentFragment } from "./document-fragment.js";
import { SelectorApi } from "./selectors/selectors.js";
export declare class DOMImplementation {
  constructor(key: typeof CTOR_KEY);
  createDocument(): void;
  createHTMLDocument(titleStr?: string): HTMLDocument;
  createDocumentType(qualifiedName: string, publicId: string, systemId: string): DocumentType;
}
export declare class DocumentType extends Node {
  constructor(name: string, publicId: string, systemId: string, key: typeof CTOR_KEY);
  get name(): string;
  get publicId(): string;
  get systemId(): string;
  override _shallowClone(): Node;
}
export interface ElementCreationOptions {
  is: string;
}
export type VisibilityState = "visible" | "hidden" | "prerender";
export type NamespaceURI = "http://www.w3.org/1999/xhtml" | "http://www.w3.org/2000/svg" | "http://www.w3.org/1998/Math/MathML";
export declare class Document extends Node {
  public head: Element;
  public body: Element;
  public implementation: DOMImplementation;
  constructor();
  override _shallowClone(): Node;
  get _nwapi(): SelectorApi;
  get documentURI(): string;
  get title(): string;
  set title(value: string);
  get cookie(): string;
  set cookie(newCookie: string);
  get visibilityState(): VisibilityState;
  get hidden(): boolean;
  get compatMode(): string;
  get documentElement(): Element | null;
  get doctype(): DocumentType | null;
  get childElementCount(): number;
  override appendChild(child: Node): Node;
  createElement(tagName: string, options?: ElementCreationOptions): Element;
  createElementNS(namespace: NamespaceURI, qualifiedName: string, options?: ElementCreationOptions): Element;
  createTextNode(data?: string): Text;
  createComment(data?: string): Comment;
  createDocumentFragment(): DocumentFragment;
  importNode(node: Node, deep?: boolean): Node;
  adoptNode(node: Node): Node;
  override cloneNode(deep?: boolean): Document;
  querySelector<T = Element>(selectors: string): T | null;
  querySelectorAll<T extends Element = Element>(selectors: string): NodeList<T>;
  getElementById(id: string): Element | null;
  getElementsByTagName(tagName: string): Element[];
  private _getElementsByTagNameWildcard: any;
  private _getElementsByTagName: any;
  getElementsByTagNameNS(_namespace: string, localName: string): Element[];
  getElementsByClassName(className: string): Element[];
  hasFocus(): boolean;
}
export declare class HTMLDocument extends Document {
  constructor(key: typeof CTOR_KEY);
  override _shallowClone(): Node;
}
//# sourceMappingURL=document.d.ts.map