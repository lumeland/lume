export default class Search {
  #site = null;
  #cache = null;

  constructor(site) {
    this.#site = site;
    this.#cache = new Map();

    site.addEventListener("beforeUpdate", () => this.#cache.clear());
  }

  data(path = "/") {
    const file = this.#site.source.getFileOrDirectory(path);

    if (file) {
      return file.data;
    }
  }

  pages(query, sort) {
    return this.#searchPages(query, sort);
  }

  tags(query) {
    const tags = new Set();

    this.pages(query).forEach((page) =>
      page.data.tags.forEach((tag) => tags.add(tag))
    );

    return Array.from(tags);
  }

  nextPage(url, query, sort) {
    const pages = this.pages(query, sort);
    const index = pages.findIndex((page) => page.data.url === url);

    return (index === -1) ? undefined : pages[index + 1];
  }

  previousPage(url, query, sort) {
    const pages = this.pages(query, sort);
    const index = pages.findIndex((page) => page.data.url === url);

    return (index <= 0) ? undefined : pages[index - 1];
  }

  #searchPages(query = [], sort = "date") {
    const id = JSON.stringify([query, sort]);

    if (this.#cache.has(id)) {
      return [...this.#cache.get(id)];
    }

    const filter = buildFilter(query);
    const result = filter ? this.#site.pages.filter(filter) : this.#site.pages;

    result.sort(compileSort(`data.${sort}`));

    this.#cache.set(id, result);
    return [...result];
  }
}

function buildFilter(query) {
  if (!query) {
    return null;
  }

  if (typeof query === "string") {
    query = query.split(/\s+/).filter((arg) => arg);
  }

  if (!query.length) {
    return null;
  }

  const filter = {};

  query.forEach((arg) => {
    if (!arg.includes("=")) {
      if (!filter["data.tags ALL"]) {
        filter["data.tags ALL"] = [];
      }

      return filter["data.tags ALL"].push(arg);
    }

    const match = arg.match(/([\w\.-]+)([!\^\$~]?=)(.*)/);
    let [, key, operator, value] = match;

    if (value.toLowerCase() === "true") {
      value = true;
    } else if (value.toLowerCase() === "false") {
      value = false;
    }

    filter[`data.${key} ${operator}`] = value;
  });

  return compileFilter(filter);
}

function compileFilter(query) {
  const filters = [];
  const args = [];

  Object.keys(query).forEach((key, index) => {
    const value = `value${index}`;
    filters.push(compileCondition(key, value));
    args.push(value);
  });

  args.push(`return (page) => ${filters.join(" && ")};`);

  const factory = new Function(...args);

  return factory(...Object.values(query));
}

function compileSort(arg) {
  const match = arg.match(/([\w\.-]+)(=(asc|desc))?/);
  let [, key, , direction] = match;

  key = key.replaceAll(".", "?.");
  const operator = direction === "desc" ? ">" : "<";

  return new Function(
    "a",
    "b",
    `return a.${key} == b.${key} ? 0 : (a.${key} ${operator} b.${key} ? -1 : 1)`,
  );
}

function compileCondition(key, value) {
  let [path, operator] = key.trim().split(" ");

  path = path.replaceAll(".", "?.");

  if (!operator || operator === "=") {
    return `page.${path} === ${value}`;
  }

  if (operator === "!=") {
    return `page.${path} !== ${value}`;
  }

  if (operator === "^=") {
    return `page.${path}?.startsWith(${value})`;
  }

  if (operator === "$=") {
    return `page.${path}?.endsWith(${value})`;
  }

  if (operator === "*=") {
    return `page.${path}?.includes(${value})`;
  }

  if (operator === "&=") {
    return `${value}.every((i) => page.${path}?.includes(i))`;
  }

  if (operator === "|=") {
    return `${value}.some((i) => page.${path}?.includes(i))`;
  }

  throw new Error(`Invalid conditional operator ${operator}`);
}
