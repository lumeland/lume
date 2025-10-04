export interface Link {
  element: Element;
  attribute: string;
  value: string;
}

const selectors = {
  href: "[href]",
  src: "[src]",
  poster: "video[poster]",
  srcset: "[srcset]",
  imagesrcset: "[imagesrcset]",
  action: "form[action]",
};

export function* searchLinks(document: Document): Iterable<Link> {
  for (const [attribute, selector] of Object.entries(selectors)) {
    for (const element of document.querySelectorAll(selector)) {
      yield {
        element,
        attribute,
        value: element.getAttribute(attribute)?.trim() ?? "",
      };
    }
  }
}

export function parseSrcset(srcset: string): [string, string][] {
  return srcset.trim().split(",").map((src) => {
    const [, url, rest] = src.trim().match(/^(\S+)(.*)/)!;
    return [url, rest];
  });
}
