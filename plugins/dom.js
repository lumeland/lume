import { DOMParser } from "../deps/dom.js";

export default function (callback) {
  const parser = new DOMParser();

  return (site) => {
    site.process([".html"], processor);

    async function processor(page) {
      const document = parser.parseFromString(page.content, "text/html");
      callback(document, page);
      page.content = document.documentElement.outerHTML;
    }
  };
}
