import { CTOR_KEY } from "../constructor-lock.js";
import { NodeList, NodeListMutator } from "./node-list.js";
import type { Element } from "./element.js";
import type { Document } from "./document.js";
export declare enum NodeType {
  ELEMENT_NODE = 1,
  ATTRIBUTE_NODE = 2,
  TEXT_NODE = 3,
  CDATA_SECTION_NODE = 4,
  ENTITY_REFERENCE_NODE = 5,
  ENTITY_NODE = 6,
  PROCESSING_INSTRUCTION_NODE = 7,
  COMMENT_NODE = 8,
  DOCUMENT_NODE = 9,
  DOCUMENT_TYPE_NODE = 10,
  DOCUMENT_FRAGMENT_NODE = 11,
  NOTATION_NODE = 12
}
/**
 * Throws if any of the nodes are an ancestor
 * of `parentNode`
 */ export declare function nodesAndTextNodes(nodes: (Node | unknown)[], parentNode: Node): Node[];
export declare class Node extends EventTarget {
  nodeName: string;
  nodeType: NodeType;
  public parentNode: Node | null;
  get parentElement(): Element | null;
  static ELEMENT_NODE: any;
  static ATTRIBUTE_NODE: any;
  static TEXT_NODE: any;
  static CDATA_SECTION_NODE: any;
  static ENTITY_REFERENCE_NODE: any;
  static ENTITY_NODE: any;
  static PROCESSING_INSTRUCTION_NODE: any;
  static COMMENT_NODE: any;
  static DOCUMENT_NODE: any;
  static DOCUMENT_TYPE_NODE: any;
  static DOCUMENT_FRAGMENT_NODE: any;
  static NOTATION_NODE: any;
  constructor(nodeName: string, nodeType: NodeType, parentNode: Node | null, key: typeof CTOR_KEY);
  get childNodes(): NodeList;
  _getChildNodesMutator(): NodeListMutator;
  _hasInitializedChildNodes(): boolean;
  /**
   * Update ancestor chain & owner document for this child
   * and all its children.
   */ _setParent(newParent: Node | null, force?: boolean): void;
  _assertNotAncestor(child: Node): void;
  _setOwnerDocument(document: Document | null): void;
  contains(child: Node): boolean;
  get ownerDocument(): Document | null;
  get nodeValue(): string | null;
  set nodeValue(value: unknown);
  get textContent(): string;
  set textContent(content: string);
  get firstChild(): Node | null;
  get lastChild(): Node | null;
  hasChildNodes(): boolean;
  cloneNode(deep?: boolean): Node;
  _shallowClone(): Node;
  _remove(skipSetParent?: boolean): void;
  appendChild(child: Node): Node;
  _appendTo(parentNode: Node): this;
  removeChild(child: Node): Node;
  replaceChild(newChild: Node, oldChild: Node): Node;
  insertBefore(newNode: Node, refNode: Node | null): Node;
  _replaceWith(...nodes: (Node | string)[]): void;
  get nextSibling(): Node | null;
  get previousSibling(): Node | null;
  public static DOCUMENT_POSITION_DISCONNECTED: 1;
  public static DOCUMENT_POSITION_PRECEDING: 2;
  public static DOCUMENT_POSITION_FOLLOWING: 4;
  public static DOCUMENT_POSITION_CONTAINS: 8;
  public static DOCUMENT_POSITION_CONTAINED_BY: 16;
  public static DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32;
  /**
   * FIXME: Does not implement attribute node checks
   * ref: https://dom.spec.whatwg.org/#dom-node-comparedocumentposition
   * MDN: https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
   */ compareDocumentPosition(other: Node): number;
  getRootNode(opts?: {
    composed?: boolean;
  }): Node;
}
export interface Node {
  ELEMENT_NODE: NodeType;
  ATTRIBUTE_NODE: NodeType;
  TEXT_NODE: NodeType;
  CDATA_SECTION_NODE: NodeType;
  ENTITY_REFERENCE_NODE: NodeType;
  ENTITY_NODE: NodeType;
  PROCESSING_INSTRUCTION_NODE: NodeType;
  COMMENT_NODE: NodeType;
  DOCUMENT_NODE: NodeType;
  DOCUMENT_TYPE_NODE: NodeType;
  DOCUMENT_FRAGMENT_NODE: NodeType;
  NOTATION_NODE: NodeType;
}
export declare class CharacterData extends Node {
  constructor(data: string, nodeName: string, nodeType: NodeType, parentNode: Node | null, key: typeof CTOR_KEY);
  override get nodeValue(): string;
  override set nodeValue(value: any);
  get data(): string;
  set data(value: any);
  override get textContent(): string;
  override set textContent(value: any);
  get length(): number;
  before(...nodes: (Node | string)[]): void;
  after(...nodes: (Node | string)[]): void;
  remove(): void;
  replaceWith(...nodes: (Node | string)[]): void;
}
export declare class Text extends CharacterData {
  constructor(text?: string);
  override _shallowClone(): Node;
}
export declare class Comment extends CharacterData {
  constructor(text?: string);
  override _shallowClone(): Node;
  override get textContent(): string;
}
//# sourceMappingURL=node.d.ts.map