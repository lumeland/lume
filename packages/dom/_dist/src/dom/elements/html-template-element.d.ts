import { Node } from "../node.js";
import { Element } from "../element.js";
import { Document } from "../document.js";
import { DocumentFragment } from "../document-fragment.js";
import { CTOR_KEY } from "../../constructor-lock.js";
export declare class HTMLTemplateElement extends Element {
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
   */ private __contentIsSet: any;
  constructor(parentNode: Node | null, attributes: [string, string][], key: typeof CTOR_KEY, content: DocumentFragment);
  get content(): DocumentFragment;
  override _setOwnerDocument(document: Document | null): void;
  override _shallowClone(): HTMLTemplateElement;
  override cloneNode(deep?: boolean): HTMLTemplateElement;
  override get innerHTML(): string;
  override set innerHTML(html: string);
  override get outerHTML(): string;
}
//# sourceMappingURL=html-template-element.d.ts.map