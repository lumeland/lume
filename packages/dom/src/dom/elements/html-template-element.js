import { Element } from "../element.js";
import { DocumentFragment } from "../document-fragment.js";
import { getElementAttributesString, getOuterOrInnerHtml } from "../utils.js";
import { fragmentNodesFromString } from "../../deserialize.js";
import { CTOR_KEY } from "../../constructor-lock.js";
export class HTMLTemplateElement extends Element {
  /**
   * This blocks access to the .#contents property when the
   * super() constructor is running which invokes (our
   * overridden) _setParent() method. Without it, we get
   * the following error thrown:
   *
   *   TypeError: Cannot read private member #content from
   *   an object whose class did not declare it
   *
   * FIXME: Maybe find a cleaner way to do this
   */ __contentIsSet = false;
  #content = null;
  constructor(parentNode, attributes, key, content){
    super("TEMPLATE", parentNode, attributes, key);
    this.#content = content;
    this.__contentIsSet = true;
  }
  get content() {
    return this.#content;
  }
  _setOwnerDocument(document) {
    super._setOwnerDocument(document);
    if (this.__contentIsSet) {
      this.content._setOwnerDocument(document);
    }
  }
  _shallowClone() {
    const frag = new DocumentFragment();
    const attributes = this.getAttributeNames().map((name)=>[
        name,
        this.getAttribute(name)
      ]);
    return new HTMLTemplateElement(null, attributes, CTOR_KEY, frag);
  }
  cloneNode(deep = false) {
    const newNode = super.cloneNode(deep);
    if (deep) {
      const destContent = newNode.content;
      for (const child of this.content.childNodes){
        destContent.appendChild(child.cloneNode(deep));
      }
    }
    return newNode;
  }
  get innerHTML() {
    return getOuterOrInnerHtml(this, false);
  }
  // Replace children in the `.content`
  set innerHTML(html) {
    const content = this.content;
    // Remove all children
    for (const child of content.childNodes){
      child._setParent(null);
    }
    const mutator = content._getChildNodesMutator();
    mutator.splice(0, content.childNodes.length);
    // Parse HTML into new children
    if (html.length) {
      const parsed = fragmentNodesFromString(html, this.localName);
      mutator.push(...parsed.childNodes[0].childNodes);
      for (const child of content.childNodes){
        child._setParent(content);
        child._setOwnerDocument(content.ownerDocument);
      }
    }
  }
  get outerHTML() {
    return `<template${getElementAttributesString(this)}>${this.innerHTML}</template>`;
  }
}
//# sourceMappingURL=html-template-element.js.map