import { compileFilter, compileSort } from "./search-compiler.js";

export default class Search {
  #site = null;
  #cache = null;

  constructor(site) {
    this.#site = site;
    this.#cache = new Map();

    site.addEventListener("beforeUpdate", () => this.#cache.clear());
  }

  folder(path = "/") {
    return this.#site.source.getDirectory(path);
  }

  pages(tags, sort) {
    return this.#searchPages(tags, sort);
  }

  tags() {
    const tags = new Set();

    this.#site.pages.forEach((page) => {
      page.data.tags.forEach((tag) => tags.add(tag));
    });

    return Array.from(tags);
  }

  nextPage(url, tags, sort) {
    const pages = this.pages(tags, sort);
    const index = pages.findIndex((page) => page.data.url === url);

    return (index === -1) ? undefined : pages[index + 1];
  }

  previousPage(url, tags, sort) {
    const pages = this.pages(tags, sort);
    const index = pages.findIndex((page) => page.data.url === url);

    return (index <= 0) ? undefined : pages[index - 1];
  }

  #searchPages(tags = [], sort = "date") {
    const id = JSON.stringify([tags, sort]);

    if (this.#cache.has(id)) {
      return [...this.#cache.get(id)];
    }

    const filter = buildFilter(tags);

    const result = filter ? this.#site.pages.filter(filter) : this.#site.pages;

    result.sort(compileSort(`data.${sort}`));

    this.#cache.set(id, result);
    return [...result];
  }
}

function buildFilter(args) {
  if (!args) {
    return null;
  }

  if (typeof args === "string") {
    args = args.split(/\s+/).filter((arg) => arg);
  }

  if (!args.length) {
    return null;
  }

  const query = {};

  args.forEach((arg) => {
    if (!arg.includes(":")) {
      if (!query["data.tags ALL"]) {
        query["data.tags ALL"] = [];
      }

      return query["data.tags ALL"].push(arg);
    }

    let [key, value] = arg.split(":", 2);

    if (value.toLowerCase() === "true") {
      value = true;
    } else if (value.toLowerCase() === "false") {
      value = false;
    }

    query[`data.${key}`] = value;
  });

  return compileFilter(query);
}
