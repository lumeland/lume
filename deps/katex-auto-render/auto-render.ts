import { katex, KatexOptions } from "../../deps/katex.ts";
import splitAtDelimiters from "./splitAtDelimiters.js";
import { Node } from "../../deps/dom.ts";
import type { Document, Element } from "../../deps/dom.ts";

/* Note: optionsCopy is mutated by this method. If it is ever exposed in the
 * API, we should copy it before mutating.
 */
const renderMathInText = function (
    document: Document,
    text: string,
    optionsCopy: KatexOptions,
) {
    const data = splitAtDelimiters(text, optionsCopy.delimiters);
    if (data.length === 1 && data[0].type === 'text') {
        // There is no formula in the text.
        // Let's return null which means there is no need to replace
        // the current text node with a new one.
        return null;
    }

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < data.length; i++) {
        if (data[i].type === "text") {
            fragment.appendChild(document.createTextNode(data[i].data));
        } else {
            const span = document.createElement("span");
            let math = data[i].data;
            // Override any display mode defined in the settings with that
            // defined by the text itself
            optionsCopy.displayMode = data[i].display;
            if (optionsCopy.preProcess) {
                math = optionsCopy.preProcess(math);
            }
            const rendered = katex.renderToString(
                math,
                optionsCopy,
            );
            const div = document.createElement("div");
            div.innerHTML = rendered.trim();

            span.appendChild(div.firstChild as Node);
            fragment.appendChild(span);
        }
    }

    return fragment;
};

function renderElem(elem: Element, optionsCopy: KatexOptions) {
    for (let i = 0; i < elem.childNodes.length; i++) {
        const childNode = elem.childNodes[i];
        if (childNode.nodeType === 3) {
            // Text node
            let textContentConcat = childNode.textContent || "";
            let sibling = childNode.nextSibling;
            let nSiblings = 0;
            while (sibling && (sibling.nodeType === Node.TEXT_NODE)) {
                textContentConcat += sibling.textContent;
                sibling = sibling.nextSibling;
                nSiblings++;
            }
            const frag = renderMathInText(
                elem.ownerDocument!,
                textContentConcat,
                optionsCopy,
            );
            if (frag) {
                // Remove extra text nodes
                for (let j = 0; j < nSiblings; j++) {
                    (childNode.nextSibling as Element | undefined)?.remove();
                }
                i += frag.childNodes.length - 1;
                elem.replaceChild(frag, childNode);
            } else {
                // If the concatenated text does not contain math
                // the siblings will not either
                i += nSiblings;
            }
        } else if (childNode.nodeType === 1) {
            // Element node
            const className = " " + (childNode as Element).className + " ";
            const shouldRender = optionsCopy.ignoredTags!.indexOf(
                        childNode.nodeName.toLowerCase(),
                    ) === -1 &&
                optionsCopy.ignoredClasses!.every(
                    (x) => className.indexOf(" " + x + " ") === -1,
                );

            if (shouldRender) {
                renderElem(childNode as Element, optionsCopy);
            }
        }
        // Otherwise, it's something else, and ignore it.
    }
}

export function renderMathInElement(
    elem: Element | undefined,
    options: KatexOptions,
) {
    if (!elem) {
        throw new Error("No element provided to render");
    }

    renderElem(elem, Object.assign({}, options));
}
