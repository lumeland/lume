import { CTOR_KEY } from "../constructor-lock.js";
import { Node } from "./node.js";
import { NodeList } from "./node-list.js";
import { HTMLCollection } from "./html-collection.js";
export interface DOMTokenList {
  [index: number]: string;
}
export declare class DOMTokenList {
  constructor(onChange: (className: string) => void, key: typeof CTOR_KEY);
  set value(input: string);
  get value(): string;
  get length(): number;
  entries(): IterableIterator<[number, string]>;
  values(): IterableIterator<string>;
  keys(): IterableIterator<number>;
  item(index: number): string;
  contains(element: string): boolean;
  add(...elements: Array<string>): void;
  remove(...elements: Array<string>): void;
  replace(oldToken: string, newToken: string): boolean;
  supports(): never;
  toggle(element: string, force?: boolean): boolean;
  forEach(callback: (value: string, index: number, list: DOMTokenList) => void): void;
}
declare const initializeClassListSym: unique symbol;
declare const setNamedNodeMapOwnerElementSym: unique symbol;
declare const setAttrValueSym: unique symbol;
export declare class Attr extends Node {
  constructor(map: NamedNodeMap | null, name: string, value: string, key: typeof CTOR_KEY);
  [setNamedNodeMapOwnerElementSym](ownerElement: Element | null): void;
  [setAttrValueSym](value: string): void;
  override _shallowClone(): Attr;
  override cloneNode(): Attr;
  override appendChild(): Node;
  override replaceChild(): Node;
  override insertBefore(): Node;
  override removeChild(): Node;
  get name(): string;
  get localName(): string;
  get value(): string;
  set value(value: any);
  get ownerElement(): Element | null;
  get specified(): boolean;
  get prefix(): string | null;
}
export interface NamedNodeMap {
  [index: number]: Attr;
}
declare const setNamedNodeMapValueSym: unique symbol;
declare const getNamedNodeMapValueSym: unique symbol;
declare const getNamedNodeMapAttrNamesSym: unique symbol;
declare const getNamedNodeMapAttrNodeSym: unique symbol;
declare const removeNamedNodeMapAttrSym: unique symbol;
export declare class NamedNodeMap {
  constructor(ownerElement: Element, onAttrNodeChange: (attr: string, value: string | null) => void, key: typeof CTOR_KEY);
  [getNamedNodeMapAttrNodeSym](attribute: string): Attr;
  [getNamedNodeMapAttrNamesSym](): string[];
  [getNamedNodeMapValueSym](attribute: string): string | undefined;
  [setNamedNodeMapValueSym](attribute: string, value: string, bubble?: boolean): void;
  /**
   * Called when an attribute is removed from
   * an element
   */ [removeNamedNodeMapAttrSym](attribute: string): void;
  get length(): number;
  item(index: number): Attr | null;
  getNamedItem(attribute: string): Attr | null;
  setNamedItem(attrNode: Attr): void;
  removeNamedItem(attribute: string): Attr;
}
export declare class Element extends Node {
  get attributes(): NamedNodeMap;
  [initializeClassListSym](): void;
  constructor(tagName: string, parentNode: Node | null, attributes: [string, string][], key: typeof CTOR_KEY);
  get tagName(): string;
  get localName(): string;
  override _shallowClone(): Node;
  get childElementCount(): number;
  get className(): string;
  set className(className: string);
  get classList(): DOMTokenList;
  get outerHTML(): string;
  set outerHTML(html: string);
  get innerHTML(): string;
  set innerHTML(html: string);
  get innerText(): string;
  set innerText(text: string);
  get children(): HTMLCollection;
  get id(): string;
  set id(id: string);
  get dataset(): Record<string, string | undefined>;
  getAttributeNames(): string[];
  getAttribute(rawName: string): string | null;
  setAttribute(rawName: string, value: any): void;
  removeAttribute(rawName: string): void;
  toggleAttribute(rawName: string, force?: boolean): boolean;
  hasAttribute(rawName: string): boolean;
  hasAttributeNS(_namespace: string, rawName: string): boolean;
  /**
   * https://dom.spec.whatwg.org/#concept-element-attributes-get-by-name
   */ getAttributeNode(rawName: string): Attr | null;
  /**
   * https://dom.spec.whatwg.org/#concept-element-attributes-set
   */ setAttributeNode(attr: Attr): Attr | null;
  replaceWith(...nodes: (Node | string)[]): void;
  remove(): void;
  append(...nodes: (Node | string)[]): void;
  prepend(...nodes: (Node | string)[]): void;
  before(...nodes: (Node | string)[]): void;
  after(...nodes: (Node | string)[]): void;
  get firstElementChild(): Element | null;
  get lastElementChild(): Element | null;
  get nextElementSibling(): Element | null;
  get previousElementSibling(): Element | null;
  querySelector<T = Element>(selectors: string): T | null;
  querySelectorAll<T extends Element = Element>(selectors: string): NodeList<T>;
  matches(selectorString: string): boolean;
  closest(selectorString: string): Element | null;
  getElementById(id: string): Element | null;
  getElementsByTagName(tagName: string): Element[];
  _getElementsByTagNameWildcard(search: Node[]): Node[];
  _getElementsByTagName(tagName: string, search: Node[]): Node[];
  getElementsByClassName(className: string): Element[];
  getElementsByTagNameNS(_namespace: string, localName: string): Element[];
}
//# sourceMappingURL=element.d.ts.map