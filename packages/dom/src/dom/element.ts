import { CTOR_KEY } from "../constructor-lock.js";
import { fragmentNodesFromString } from "../deserialize.js";
import { Node, nodesAndTextNodes, NodeType } from "./node.js";
import { NodeList, nodeListMutatorSym } from "./node-list.js";
import { HTMLCollection } from "./html-collection.js";
import {
  getDatasetHtmlAttrName,
  getDatasetJavascriptName,
  getElementsByClassName,
  getOuterOrInnerHtml,
  insertBeforeAfter,
  lowerCaseCharRe,
  upperCaseCharRe,
} from "./utils.js";
import UtilTypes from "./utils-types.js";
import { getLowerCase, getUpperCase } from "./string-cache.js";

export interface DOMTokenList {
  [index: number]: string;
}

export class DOMTokenList {
  // Minimum number of classnames/tokens in order to switch from
  // an array-backed to a set-backed list
  static #DOM_TOKEN_LIST_MIN_SET_SIZE = 32 as const;

  #_value = "";
  get #value() {
    return this.#_value;
  }
  set #value(
    value: string,
  ) {
    this.#_value = value;
    this.#onChange(value);
  }
  #set: string[] | Set<string> = [];
  #onChange: (className: string) => void;

  constructor(
    onChange: (className: string) => void,
    key: typeof CTOR_KEY,
  ) {
    if (key !== CTOR_KEY) {
      throw new TypeError("Illegal constructor");
    }
    this.#onChange = onChange;
  }

  static #invalidToken(
    token: string,
  ) {
    return token === "" || /[\t\n\f\r ]/.test(token);
  }

  #setIndices() {
    const classes = Array.from(this.#set);
    for (let i = 0; i < classes.length; i++) {
      this[i] = classes[i];
    }
  }

  set value(
    input: string,
  ) {
    this.#value = input;
    this.#set = input
      .trim()
      .split(/[\t\n\f\r\s]+/g)
      .filter(Boolean);

    if (this.#set.length > DOMTokenList.#DOM_TOKEN_LIST_MIN_SET_SIZE) {
      this.#set = new Set(this.#set);
    } else {
      const deduplicatedSet: string[] = [];
      for (const element of this.#set) {
        if (!deduplicatedSet.includes(element)) {
          deduplicatedSet.push(element);
        }
      }
      this.#set = deduplicatedSet;
    }

    this.#setIndices();
  }

  get value(): string {
    return this.#_value;
  }

  get length(): number {
    if (this.#set.constructor === Array) {
      return this.#set.length;
    } else {
      return (this.#set as Set<string>).size;
    }
  }

  *entries(): IterableIterator<[number, string]> {
    const array = Array.from(this.#set);
    for (let i = 0; i < array.length; i++) {
      yield [i, array[i]];
    }
  }

  *values(): IterableIterator<string> {
    yield* this.#set.values();
  }

  *keys(): IterableIterator<number> {
    const length = this.length;
    for (let i = 0; i < length; i++) {
      yield i;
    }
  }

  *[Symbol.iterator](): IterableIterator<string> {
    yield* this.#set.values();
  }

  item(
    index: number,
  ): string {
    index = Number(index);
    if (Number.isNaN(index) || index === Infinity) index = 0;
    return this[Math.trunc(index) % 2 ** 32] ?? null;
  }

  contains(
    element: string,
  ): boolean {
    if (this.#set.constructor === Array) {
      return this.#set.includes(element);
    } else {
      return (this.#set as Set<string>).has(element);
    }
  }

  #arrayAdd(element: string) {
    const array = this.#set as string[];
    if (!array.includes(element)) {
      this[array.length] = element;
      array.push(element);
    }
  }
  #setAdd(element: string) {
    const set = this.#set as Set<string>;
    const { size } = set;
    set.add(element);
    if (size < set.size) {
      this[size] = element;
    }
  }

  add(
    ...elements: Array<string>
  ) {
    const method =
      (this.#set.constructor === Array ? this.#arrayAdd : this.#setAdd).bind(
        this,
      );

    for (const element of elements) {
      if (DOMTokenList.#invalidToken(element)) {
        throw new DOMException(
          "Failed to execute 'add' on 'DOMTokenList': The token provided must not be empty.",
        );
      }

      method(element);
    }
    this.#updateClassString();
  }

  #arrayRemove(element: string) {
    const array = this.#set as string[];
    const index = array.indexOf(element);
    if (index >= 0) {
      array.splice(index, 1);
    }
  }
  #setRemove(element: string) {
    (this.#set as Set<string>).delete(element);
  }

  remove(
    ...elements: Array<string>
  ) {
    const method =
      (this.#set.constructor === Array ? this.#arrayRemove : this.#setRemove)
        .bind(this);
    const size = this.length;
    for (const element of elements) {
      if (DOMTokenList.#invalidToken(element)) {
        throw new DOMException(
          "Failed to execute 'remove' on 'DOMTokenList': The token provided must not be empty.",
        );
      }
      method(element);
    }
    const newSize = this.length;
    if (size !== newSize) {
      for (let i = newSize; i < size; i++) {
        delete this[i];
      }
      this.#setIndices();
    }
    this.#updateClassString();
  }

  replace(
    oldToken: string,
    newToken: string,
  ): boolean {
    const isArrayBacked = this.#set.constructor === Array;
    const removeMethod = (isArrayBacked ? this.#arrayRemove : this.#setRemove)
      .bind(this);
    const addMethod = (isArrayBacked ? this.#arrayAdd : this.#setAdd).bind(
      this,
    );
    if ([oldToken, newToken].some((v) => DOMTokenList.#invalidToken(v))) {
      throw new DOMException(
        "Failed to execute 'replace' on 'DOMTokenList': The token provided must not be empty.",
      );
    }
    if (!this.contains(oldToken)) {
      return false;
    }

    if (this.contains(newToken)) {
      this.remove(oldToken);
    } else {
      removeMethod(oldToken);
      addMethod(newToken);
      this.#setIndices();
      this.#updateClassString();
    }
    return true;
  }

  supports(): never {
    throw new Error("Not implemented");
  }

  toggle(
    element: string,
    force?: boolean,
  ): boolean {
    if (force !== undefined) {
      const operation = force ? "add" : "remove";
      this[operation](element);
      return false;
    } else {
      const contains = this.contains(element);
      const operation = contains ? "remove" : "add";
      this[operation](element);
      return !contains;
    }
  }

  forEach(
    callback: (value: string, index: number, list: DOMTokenList) => void,
  ) {
    for (const [i, value] of this.entries()) {
      callback(value, i, this);
    }
  }

  #updateClassString() {
    this.#value = Array.from(this.#set).join(" ");

    if (
      this.#set.constructor === Array &&
      this.#set.length > DOMTokenList.#DOM_TOKEN_LIST_MIN_SET_SIZE
    ) {
      this.#set = new Set(this.#set);
    }
  }
}

const initializeClassListSym = Symbol("initializeClassListSym");
const domTokenListCurrentElementSym = Symbol("domTokenListCurrentElementSym");
/**
 * The purpose of this uninitialized DOMTokenList is to consume less memory
 * than the actual DOMTokenList class. By measurements of Deno v2.1.0 (V8 13.0.245.12-rusty)
 * this class consumes 48 bytes while the smallest DOMTokenList consumes 488
 * bytes
 */
class UninitializedDOMTokenList {
  // This will always be populated with the current element
  // being queried

  [domTokenListCurrentElementSym]: Element;
  constructor(
    currentElement: Element,
  ) {
    this[domTokenListCurrentElementSym] = currentElement;
  }

  #getInitialized(): DOMTokenList | null {
    const currentClassList = this[domTokenListCurrentElementSym].classList;
    if (currentClassList === this as unknown as DOMTokenList) {
      return null;
    }

    return currentClassList;
  }

  set value(input: string) {
    this[domTokenListCurrentElementSym][initializeClassListSym]();
    this[domTokenListCurrentElementSym].classList.value = String(input);
  }

  get value(): string {
    return this.#getInitialized()?.value ?? "";
  }

  get length(): number {
    return this.#getInitialized()?.length ?? 0;
  }

  *entries(): IterableIterator<[number, string]> {
    const initialized = this.#getInitialized();
    if (initialized) {
      yield* initialized.entries();
    }
  }
  *values(): IterableIterator<string> {
    const initialized = this.#getInitialized();
    if (initialized) {
      yield* initialized.values();
    }
  }
  *keys(): IterableIterator<number> {
    const initialized = this.#getInitialized();
    if (initialized) {
      yield* initialized.keys();
    }
  }

  *[Symbol.iterator](): IterableIterator<string> {
    yield* this.values();
  }

  item(index: number): string | null {
    return this.#getInitialized()?.item(index) ?? null;
  }

  contains(element: string): boolean {
    return this.#getInitialized()?.contains(element) ?? false;
  }

  add(...elements: string[]) {
    this[domTokenListCurrentElementSym][initializeClassListSym]();
    this[domTokenListCurrentElementSym].classList.add(...elements);
  }

  remove(...elements: string[]) {
    this.#getInitialized()?.remove(...elements);
  }
  replace(oldToken: string, newToken: string) {
    return this.#getInitialized()?.replace(oldToken, newToken) ?? false;
  }

  supports(): never {
    throw new Error("Not implemented");
  }

  toggle(
    element: string,
    force?: boolean,
  ): boolean {
    if (force === false) {
      return this.#getInitialized()?.toggle(element, force) ?? false;
    }

    this[domTokenListCurrentElementSym][initializeClassListSym]();
    this[domTokenListCurrentElementSym].classList.add(element);
    return true;
  }

  forEach(
    callback: (value: string, index: number, list: DOMTokenList) => void,
  ) {
    this.#getInitialized()?.forEach(callback);
  }
}

const setNamedNodeMapOwnerElementSym = Symbol("setNamedNodeMapOwnerElementSym");
const setAttrValueSym = Symbol("setAttrValueSym");
export class Attr extends Node {
  #namedNodeMap: NamedNodeMap | null = null;
  #name = "";
  #value = "";
  #ownerElement: Element | null = null;

  constructor(
    map: NamedNodeMap | null,
    name: string,
    value: string,
    key: typeof CTOR_KEY,
  ) {
    if (key !== CTOR_KEY) {
      throw new TypeError("Illegal constructor");
    }
    super(name, NodeType.ATTRIBUTE_NODE, null, CTOR_KEY);

    this.#name = name;
    this.#value = value;
    this.#namedNodeMap = map;
  }

  [setNamedNodeMapOwnerElementSym](ownerElement: Element | null) {
    this.#ownerElement = ownerElement;
    this.#namedNodeMap = ownerElement?.attributes ?? null;

    if (ownerElement) {
      this._setOwnerDocument(ownerElement.ownerDocument);
    }
  }

  [setAttrValueSym](value: string) {
    this.#value = value;
  }

  override _shallowClone(): Attr {
    const newAttr = new Attr(null, this.#name, this.#value, CTOR_KEY);
    newAttr._setOwnerDocument(this.ownerDocument);
    return newAttr;
  }

  override cloneNode(): Attr {
    return super.cloneNode() as Attr;
  }

  override appendChild(): Node {
    throw new DOMException("Cannot add children to an Attribute");
  }

  override replaceChild(): Node {
    throw new DOMException("Cannot add children to an Attribute");
  }

  override insertBefore(): Node {
    throw new DOMException("Cannot add children to an Attribute");
  }

  override removeChild(): Node {
    throw new DOMException(
      "The node to be removed is not a child of this node",
    );
  }

  get name(): string {
    return this.#name;
  }

  get localName(): string {
    // TODO: When we make namespaces a thing this needs
    // to be updated
    return this.#name;
  }

  get value(): string {
    return this.#value;
  }

  set value(value: any) {
    this.#value = String(value);

    if (this.#namedNodeMap) {
      this.#namedNodeMap[setNamedNodeMapValueSym](
        this.#name,
        this.#value,
        true,
      );
    }
  }

  get ownerElement(): Element | null {
    return this.#ownerElement ?? null;
  }

  get specified(): boolean {
    return true;
  }

  // TODO
  get prefix(): string | null {
    return null;
  }
}

export interface NamedNodeMap {
  [index: number]: Attr;
}

const setNamedNodeMapValueSym = Symbol("setNamedNodeMapValueSym");
const getNamedNodeMapValueSym = Symbol("getNamedNodeMapValueSym");
const getNamedNodeMapAttrNamesSym = Symbol("getNamedNodeMapAttrNamesSym");
const getNamedNodeMapAttrNodeSym = Symbol("getNamedNodeMapAttrNodeSym");
const removeNamedNodeMapAttrSym = Symbol("removeNamedNodeMapAttrSym");
export class NamedNodeMap {
  static #indexedAttrAccess = function (
    this: NamedNodeMap,
    map: Record<string, string | undefined>,
    index: number,
  ): Attr | undefined {
    if (index + 1 > this.length) {
      return undefined;
    }

    const attribute = Object
      .keys(map)
      .filter((attribute) => map[attribute] !== undefined)[index]
      ?.slice(1); // Remove "a" for safeAttrName
    return this[getNamedNodeMapAttrNodeSym](attribute);
  };
  #onAttrNodeChange: (attr: string, value: string | null) => void;

  constructor(
    ownerElement: Element,
    onAttrNodeChange: (attr: string, value: string | null) => void,
    key: typeof CTOR_KEY,
  ) {
    if (key !== CTOR_KEY) {
      throw new TypeError("Illegal constructor.");
    }
    this.#ownerElement = ownerElement;
    this.#onAttrNodeChange = onAttrNodeChange;

    // Retain ordering of any preceding id or class attributes
    for (const attr of ownerElement.getAttributeNames()) {
      this[setNamedNodeMapValueSym](
        attr,
        ownerElement.getAttribute(attr) as string,
      );
    }
  }

  #attrNodeCache: Record<string, Attr | undefined> = {};
  #map: Record<string, string | undefined> = {};
  #length = 0;
  #capacity = 0;
  #ownerElement: Element | null = null;

  [getNamedNodeMapAttrNodeSym](attribute: string): Attr {
    const safeAttrName = "a" + attribute;
    let attrNode = this.#attrNodeCache[safeAttrName];
    if (!attrNode) {
      attrNode = this.#attrNodeCache[safeAttrName] = new Attr(
        this,
        attribute,
        this.#map[safeAttrName] as string,
        CTOR_KEY,
      );
      attrNode[setNamedNodeMapOwnerElementSym](this.#ownerElement);
    }

    return attrNode;
  }

  [getNamedNodeMapAttrNamesSym](): string[] {
    const names: string[] = [];

    for (const [name, value] of Object.entries(this.#map)) {
      if (value !== undefined) {
        names.push(name.slice(1)); // Remove "a" for safeAttrName
      }
    }

    return names;
  }

  [getNamedNodeMapValueSym](attribute: string): string | undefined {
    const safeAttrName = "a" + attribute;
    return this.#map[safeAttrName];
  }

  [setNamedNodeMapValueSym](attribute: string, value: string, bubble = false) {
    const safeAttrName = "a" + attribute;
    if (this.#map[safeAttrName] === undefined) {
      this.#length++;

      if (this.#length > this.#capacity) {
        this.#capacity = this.#length;
        const index = this.#capacity - 1;
        Object.defineProperty(this, String(this.#capacity - 1), {
          get: NamedNodeMap.#indexedAttrAccess.bind(this, this.#map, index),
        });
      }
    } else if (this.#attrNodeCache[safeAttrName]) {
      this.#attrNodeCache[safeAttrName]![setAttrValueSym](value);
    }

    this.#map[safeAttrName] = value;

    if (bubble) {
      this.#onAttrNodeChange(attribute, value);
    }
  }

  /**
   * Called when an attribute is removed from
   * an element
   */
  [removeNamedNodeMapAttrSym](attribute: string) {
    const safeAttrName = "a" + attribute;
    if (this.#map[safeAttrName] !== undefined) {
      this.#length--;
      this.#map[safeAttrName] = undefined;
      this.#onAttrNodeChange(attribute, null);

      const attrNode = this.#attrNodeCache[safeAttrName];
      if (attrNode) {
        attrNode[setNamedNodeMapOwnerElementSym](null);
        this.#attrNodeCache[safeAttrName] = undefined;
      }
    }
  }

  *[Symbol.iterator](): Generator<Attr> {
    for (let i = 0; i < this.length; i++) {
      yield this[i];
    }
  }

  get length(): number {
    return this.#length;
  }

  // FIXME: This method should accept anything and basically
  // coerce any non numbers (and Infinity/-Infinity) into 0
  item(index: number): Attr | null {
    if (index >= this.#length) {
      return null;
    }

    return this[index];
  }

  getNamedItem(attribute: string): Attr | null {
    const safeAttrName = "a" + attribute;
    if (this.#map[safeAttrName] !== undefined) {
      return this[getNamedNodeMapAttrNodeSym](attribute);
    }

    return null;
  }

  setNamedItem(attrNode: Attr) {
    if (attrNode.ownerElement) {
      throw new DOMException("Attribute already in use");
    }

    const safeAttrName = "a" + attrNode.name;
    const previousAttr = this.#attrNodeCache[safeAttrName];
    if (previousAttr) {
      previousAttr[setNamedNodeMapOwnerElementSym](null);
      this.#map[safeAttrName] = undefined;
    }

    attrNode[setNamedNodeMapOwnerElementSym](this.#ownerElement);
    this.#attrNodeCache[safeAttrName] = attrNode;
    this[setNamedNodeMapValueSym](attrNode.name, attrNode.value, true);
  }

  removeNamedItem(attribute: string): Attr {
    const safeAttrName = "a" + attribute;
    if (this.#map[safeAttrName] !== undefined) {
      const attrNode = this[getNamedNodeMapAttrNodeSym](attribute);
      this[removeNamedNodeMapAttrSym](attribute);
      return attrNode;
    }

    throw new DOMException("Node was not found");
  }
}

const XML_NAMESTART_CHAR_RE_SRC = ":A-Za-z_" +
  String.raw`\u{C0}-\u{D6}\u{D8}-\u{F6}\u{F8}-\u{2FF}\u{370}-\u{37D}` +
  String
    .raw`\u{37F}-\u{1FFF}\u{200C}-\u{200D}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}` +
  String
    .raw`\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}`;
const XML_NAME_CHAR_RE_SRC = XML_NAMESTART_CHAR_RE_SRC +
  String.raw`\u{B7}\u{0300}-\u{036F}\u{203F}-\u{2040}0-9.-`;
const xmlNamestartCharRe = new RegExp(`[${XML_NAMESTART_CHAR_RE_SRC}]`, "u");
const xmlNameCharRe = new RegExp(`[${XML_NAME_CHAR_RE_SRC}]`, "u");

export class Element extends Node {
  #namedNodeMap: NamedNodeMap | null = null;
  get attributes(): NamedNodeMap {
    if (!this.#namedNodeMap) {
      this.#namedNodeMap = new NamedNodeMap(this, (attribute, value) => {
        const isRemoved = value === null;
        if (value === null) {
          value = "";
        }

        switch (attribute) {
          case "class": {
            if (isRemoved) {
              this.#hasClassNameAttribute = -1;
            } else if (this.#hasClassNameAttribute === -1) {
              this.#hasClassNameAttribute = this.#hasIdAttribute + 1;
            }
            // This must happen after the attribute is marked removed
            this.#currentClassName = value;
            this.#classList.value = value;
            break;
          }
          case "id": {
            if (isRemoved) {
              this.#hasIdAttribute = -1;
            } else if (this.#hasIdAttribute === -1) {
              this.#hasIdAttribute = this.#hasClassNameAttribute + 1;
            }
            this.#currentId = value;
            break;
          }
        }
      }, CTOR_KEY);
    }

    return this.#namedNodeMap;
  }

  #datasetProxy: Record<string, string | undefined> | null = null;
  #currentId = "";
  #currentClassName = "";
  #hasIdAttribute = -1;
  #hasClassNameAttribute = -1;

  // Only initialize a classList when we need one
  #classListInstance: DOMTokenList = new UninitializedDOMTokenList(
    this,
  ) as unknown as DOMTokenList;
  get #classList(): DOMTokenList {
    return this.#classListInstance;
  }

  [initializeClassListSym]() {
    if (this.#classListInstance.constructor === DOMTokenList) {
      return;
    }

    this.#classListInstance = new DOMTokenList(
      (className) => {
        if (this.#currentClassName !== className) {
          this.#currentClassName = className;
          if (this.#hasClassNameAttribute === -1) {
            this.#hasClassNameAttribute = this.#hasIdAttribute + 1;
          }
          if (
            this.#namedNodeMap &&
            (this.hasAttribute("class") || className !== "")
          ) {
            this.attributes[setNamedNodeMapValueSym]("class", className);
          }
        }
      },
      CTOR_KEY,
    );
  }

  constructor(
    tagName: string,
    parentNode: Node | null,
    attributes: [string, string][],
    key: typeof CTOR_KEY,
  ) {
    super(
      tagName,
      NodeType.ELEMENT_NODE,
      parentNode,
      key,
    );

    for (const attr of attributes) {
      this.setAttribute(attr[0], attr[1]);
    }

    this.nodeName = getUpperCase(tagName);
  }

  get tagName(): string {
    return this.nodeName;
  }

  get localName(): string {
    return getLowerCase(this.tagName);
  }

  override _shallowClone(): Node {
    // FIXME: This attribute copying needs to also be fixed in other
    // elements that override _shallowClone like <template>
    const attributes: [string, string][] = [];
    for (const attribute of this.getAttributeNames()) {
      attributes.push([attribute, this.getAttribute(attribute)!]);
    }
    return new Element(this.nodeName, null, attributes, CTOR_KEY);
  }

  get childElementCount(): number {
    return this._getChildNodesMutator().elementsView().length;
  }

  get className(): string {
    return this.#currentClassName;
  }

  set className(className: string) {
    this.#classList.value = className;
  }

  get classList(): DOMTokenList {
    return this.#classList;
  }

  get outerHTML(): string {
    return getOuterOrInnerHtml(this, true);
  }

  set outerHTML(html: string) {
    if (this.parentNode) {
      const { parentElement, parentNode } = this;
      let contextLocalName = parentElement?.localName;

      switch (parentNode.nodeType) {
        case NodeType.DOCUMENT_NODE: {
          throw new DOMException(
            "Modifications are not allowed for this document",
          );
        }

        // setting outerHTML, step 4. Document Fragment
        // ref: https://w3c.github.io/DOM-Parsing/#dom-element-outerhtml
        case NodeType.DOCUMENT_FRAGMENT_NODE: {
          contextLocalName = "body";
          // fall-through
        }

        default: {
          const { childNodes: newChildNodes } =
            fragmentNodesFromString(html, contextLocalName!).childNodes[0];
          const mutator = parentNode._getChildNodesMutator();
          const insertionIndex = mutator.indexOf(this);

          for (let i = newChildNodes.length - 1; i >= 0; i--) {
            const child = newChildNodes[i];
            mutator.splice(insertionIndex, 0, child);
            child._setParent(parentNode);
            child._setOwnerDocument(parentNode.ownerDocument);
          }

          this.remove();
        }
      }
    }
  }

  get innerHTML(): string {
    return getOuterOrInnerHtml(this, false);
  }

  set innerHTML(html: string) {
    // Remove all children
    for (const child of this.childNodes) {
      child._setParent(null);
    }

    const mutator = this._getChildNodesMutator();
    mutator.splice(0, this.childNodes.length);

    // Parse HTML into new children
    if (html.length) {
      const parsed = fragmentNodesFromString(html, this.localName);
      for (const child of parsed.childNodes[0].childNodes) {
        mutator.push(child);
      }

      for (const child of this.childNodes) {
        child._setParent(this);
        child._setOwnerDocument(this.ownerDocument);
      }
    }
  }

  get innerText(): string {
    return this.textContent;
  }

  set innerText(text: string) {
    this.textContent = text;
  }

  get children(): HTMLCollection {
    return this._getChildNodesMutator().elementsView();
  }

  get id(): string {
    return this.#currentId || "";
  }

  set id(id: string) {
    this.setAttribute("id", id);
  }

  get dataset(): Record<string, string | undefined> {
    if (this.#datasetProxy) {
      return this.#datasetProxy;
    }

    this.#datasetProxy = new Proxy<Record<string, string | undefined>>({}, {
      get: (_target, property, _receiver) => {
        if (typeof property === "string") {
          const attributeName = getDatasetHtmlAttrName(property);
          return this.getAttribute(attributeName) ?? undefined;
        }

        return undefined;
      },

      set: (_target, property, value, _receiver) => {
        if (typeof property === "string") {
          let attributeName = "data-";

          let prevChar = "";
          for (const char of property) {
            // Step 1. https://html.spec.whatwg.org/multipage/dom.html#dom-domstringmap-setitem
            if (prevChar === "-" && lowerCaseCharRe.test(char)) {
              throw new DOMException(
                "An invalid or illegal string was specified",
              );
            }

            // Step 4. https://html.spec.whatwg.org/multipage/dom.html#dom-domstringmap-setitem
            if (!xmlNameCharRe.test(char)) {
              throw new DOMException("String contains an invalid character");
            }

            // Step 2. https://html.spec.whatwg.org/multipage/dom.html#dom-domstringmap-setitem
            if (upperCaseCharRe.test(char)) {
              attributeName += "-";
            }

            attributeName += char.toLowerCase();
            prevChar = char;
          }

          this.setAttribute(attributeName, String(value));
        }

        return true;
      },

      deleteProperty: (_target, property) => {
        if (typeof property === "string") {
          const attributeName = getDatasetHtmlAttrName(property);
          this.removeAttribute(attributeName);
        }

        return true;
      },

      ownKeys: (_target) => {
        return this
          .getAttributeNames()
          .flatMap((attributeName) => {
            if (attributeName.startsWith?.("data-")) {
              return [getDatasetJavascriptName(attributeName)];
            } else {
              return [];
            }
          });
      },

      getOwnPropertyDescriptor: (_target, property) => {
        if (typeof property === "string") {
          const attributeName = getDatasetHtmlAttrName(property);
          if (this.hasAttribute(attributeName)) {
            return {
              writable: true,
              enumerable: true,
              configurable: true,
            };
          }
        }

        return undefined;
      },

      has: (_target, property) => {
        if (typeof property === "string") {
          const attributeName = getDatasetHtmlAttrName(property);
          return this.hasAttribute(attributeName);
        }

        return false;
      },
    });

    return this.#datasetProxy;
  }

  getAttributeNames(): string[] {
    if (!this.#namedNodeMap) {
      const attributes = [];

      // We preserve the order of the "id" and "class" attributes when
      // returning the list of names with an uninitialized NamedNodeMap
      const startWithClassAttr = Number(
        this.#hasIdAttribute > this.#hasClassNameAttribute,
      );
      for (let i = 0; i < 2; i++) {
        const attributeIdx = (i + startWithClassAttr) % 2;
        switch (attributeIdx) {
          // "id" attribute
          case 0: {
            ~this.#hasIdAttribute && attributes.push("id");
            break;
          }
          // "class" attribute
          case 1: {
            ~this.#hasClassNameAttribute && attributes.push("class");
            break;
          }
        }
      }

      return attributes;
    }

    return this.attributes[getNamedNodeMapAttrNamesSym]();
  }

  getAttribute(rawName: string): string | null {
    const name = getLowerCase(String(rawName));

    switch (name) {
      case "id": {
        if (~this.#hasIdAttribute) {
          return this.#currentId;
        } else {
          return null;
        }
      }
      case "class": {
        if (~this.#hasClassNameAttribute) {
          return this.#currentClassName;
        } else {
          return null;
        }
      }
    }

    if (!this.#namedNodeMap) {
      return null;
    }

    return this.attributes[getNamedNodeMapValueSym](name) ?? null;
  }

  setAttribute(rawName: string, value: any) {
    const name = getLowerCase(String(rawName));
    const strValue = String(value);
    let isNormalAttribute = false;

    switch (name) {
      case "id": {
        this.#currentId = strValue;
        if (this.#hasIdAttribute === -1) {
          this.#hasIdAttribute = this.#hasClassNameAttribute + 1;
        }
        break;
      }
      case "class": {
        this.#classList.value = strValue;
        if (this.#hasClassNameAttribute === -1) {
          this.#hasClassNameAttribute = this.#hasIdAttribute + 1;
        }
        break;
      }
      default: {
        isNormalAttribute = true;
      }
    }

    if (this.#namedNodeMap || isNormalAttribute) {
      this.attributes[setNamedNodeMapValueSym](name, strValue);
    }
  }

  removeAttribute(rawName: string) {
    const name = getLowerCase(String(rawName));
    switch (name) {
      case "id": {
        this.#currentId = "";
        this.#hasIdAttribute = -1;
        break;
      }
      case "class": {
        this.#classList.value = "";
        this.#hasClassNameAttribute = -1;
        break;
      }
    }

    if (!this.#namedNodeMap) {
      return;
    }

    this.attributes[removeNamedNodeMapAttrSym](name);
  }

  toggleAttribute(rawName: string, force?: boolean): boolean {
    const name = getLowerCase(String(rawName));
    if (this.hasAttribute(name)) {
      if ((force === undefined) || (force === false)) {
        this.removeAttribute(name);
        return false;
      }
      return true;
    }
    if ((force === undefined) || (force === true)) {
      this.setAttribute(name, "");
      return true;
    }
    return false;
  }

  hasAttribute(rawName: string): boolean {
    const name = getLowerCase(String(rawName));

    switch (name) {
      case "id": {
        return Boolean(~this.#hasIdAttribute);
      }
      case "class": {
        return Boolean(~this.#hasClassNameAttribute);
      }
    }

    if (!this.#namedNodeMap) {
      return false;
    }

    return this.attributes[getNamedNodeMapValueSym](name) !== undefined;
  }

  hasAttributeNS(_namespace: string, rawName: string): boolean {
    const name = getLowerCase(String(rawName));

    switch (name) {
      case "id": {
        return Boolean(~this.#hasIdAttribute);
      }
      case "class": {
        return Boolean(~this.#hasClassNameAttribute);
      }
    }

    if (!this.#namedNodeMap) {
      return false;
    }

    // TODO: Use namespace
    return this.attributes[getNamedNodeMapValueSym](name) !== undefined;
  }

  /**
   * https://dom.spec.whatwg.org/#concept-element-attributes-get-by-name
   */
  getAttributeNode(rawName: string): Attr | null {
    const name = getLowerCase(String(rawName));
    return this.attributes.getNamedItem(name);
  }

  /**
   * https://dom.spec.whatwg.org/#concept-element-attributes-set
   */
  setAttributeNode(attr: Attr): Attr | null {
    if (attr?.constructor !== Attr) {
      throw new TypeError(
        "Element.setAttributeNode: Argument 1 does not implement interface Attr",
      );
    }

    const attrName = attr.localName;
    const oldAttr = this.attributes.getNamedItem(attrName);

    if (oldAttr === attr) {
      return attr;
    }

    this.attributes.setNamedItem(attr);
    return oldAttr;
  }

  replaceWith(...nodes: (Node | string)[]) {
    this._replaceWith(...nodes);
  }

  remove() {
    this._remove();
  }

  append(...nodes: (Node | string)[]) {
    const mutator = this._getChildNodesMutator();
    mutator.push(...nodesAndTextNodes(nodes, this));
  }

  prepend(...nodes: (Node | string)[]) {
    const mutator = this._getChildNodesMutator();
    mutator.splice(0, 0, ...nodesAndTextNodes(nodes, this));
  }

  before(...nodes: (Node | string)[]) {
    if (this.parentNode) {
      insertBeforeAfter(this, nodes, true);
    }
  }

  after(...nodes: (Node | string)[]) {
    if (this.parentNode) {
      insertBeforeAfter(this, nodes, false);
    }
  }

  get firstElementChild(): Element | null {
    const elements = this._getChildNodesMutator().elementsView();
    return elements[0] ?? null;
  }

  get lastElementChild(): Element | null {
    const elements = this._getChildNodesMutator().elementsView();
    return elements[elements.length - 1] ?? null;
  }

  get nextElementSibling(): Element | null {
    const parent = this.parentNode;

    if (!parent) {
      return null;
    }

    const mutator = parent._getChildNodesMutator();
    const index = mutator.indexOfElementsView(this);
    const elements = mutator.elementsView();
    return elements[index + 1] ?? null;
  }

  get previousElementSibling(): Element | null {
    const parent = this.parentNode;

    if (!parent) {
      return null;
    }

    const mutator = parent._getChildNodesMutator();
    const index = mutator.indexOfElementsView(this);
    const elements = mutator.elementsView();
    return elements[index - 1] ?? null;
  }

  querySelector<T = Element>(selectors: string): T | null {
    if (!this.ownerDocument) {
      throw new Error("Element must have an owner document");
    }

    return this.ownerDocument!._nwapi.first(selectors, this) as T;
  }

  querySelectorAll<T extends Element = Element>(
    selectors: string,
  ): NodeList<T> {
    if (!this.ownerDocument) {
      throw new Error("Element must have an owner document");
    }

    const nodeList = new NodeList();
    const mutator = nodeList[nodeListMutatorSym]();

    for (const match of this.ownerDocument!._nwapi.select(selectors, this)) {
      mutator.push(match);
    }

    return nodeList as NodeList<T>;
  }

  matches(selectorString: string): boolean {
    return this.ownerDocument!._nwapi.match(selectorString, this);
  }

  closest(selectorString: string): Element | null {
    const { match } = this.ownerDocument!._nwapi; // See note below
    // deno-lint-ignore no-this-alias
    let el: Element | null = this;
    do {
      // Note: Not using `el.matches(selectorString)` because on a browser if you override
      // `matches`, you *don't* see it being used by `closest`.
      if (match(selectorString, el)) {
        return el;
      }
      el = el.parentElement;
    } while (el !== null);
    return null;
  }

  // TODO: DRY!!!
  getElementById(id: string): Element | null {
    if (!this._hasInitializedChildNodes()) {
      return null;
    }

    for (const child of this.childNodes) {
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        if ((<Element> child).id === id) {
          return <Element> child;
        }

        const search = (<Element> child).getElementById(id);
        if (search) {
          return search;
        }
      }
    }

    return null;
  }

  getElementsByTagName(tagName: string): Element[] {
    if (!this._hasInitializedChildNodes()) {
      return [];
    }

    const fixCaseTagName = getUpperCase(tagName);

    if (fixCaseTagName === "*") {
      return <Element[]> this._getElementsByTagNameWildcard([]);
    } else {
      return <Element[]> this._getElementsByTagName(fixCaseTagName, []);
    }
  }

  _getElementsByTagNameWildcard(search: Node[]): Node[] {
    if (!this._hasInitializedChildNodes()) {
      return search;
    }

    for (const child of this.childNodes) {
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        search.push(child);
        (<Element> child)._getElementsByTagNameWildcard(search);
      }
    }

    return search;
  }

  _getElementsByTagName(tagName: string, search: Node[]): Node[] {
    if (!this._hasInitializedChildNodes()) {
      return search;
    }

    for (const child of this.childNodes) {
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        if ((<Element> child).tagName === tagName) {
          search.push(child);
        }

        (<Element> child)._getElementsByTagName(tagName, search);
      }
    }

    return search;
  }

  getElementsByClassName(className: string): Element[] {
    if (!this._hasInitializedChildNodes()) {
      return [];
    }

    return getElementsByClassName(
      this,
      className.trim().split(/\s+/),
      [],
    ) as Element[];
  }

  getElementsByTagNameNS(_namespace: string, localName: string): Element[] {
    if (!this._hasInitializedChildNodes()) {
      return [];
    }

    // TODO: Use namespace
    return this.getElementsByTagName(localName);
  }
}

UtilTypes.Element = Element;
