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

export function buildFilter(query) {
  if (!query) {
    return null;
  }

  if (typeof query === "string") {
    query = query.split(/\s+/).filter((arg) => arg);
  }

  if (!query.length) {
    return null;
  }

  const conditions = [];

  query.forEach((arg) => {
    const match = arg.match(/([\w.-]+)([!^$*]?=|[<>]=?)(.*)/);

    if (!match) {
      return conditions.push(["data.tags", "*=", compileValue(arg)]);
    }

    const [, key, operator, value] = match;

    conditions.push([`data.${key}`, operator, compileValue(value)]);
  });

  return compileFilter(conditions);
}

function compileFilter(conditions) {
  const filters = [];
  const args = [];
  const values = [];

  conditions.forEach((condition, index) => {
    const [key, operator, value] = condition;
    const varname = `value${index}`;

    filters.push(compileCondition(key, operator, varname, value));
    args.push(varname);
    values.push(value);
  });

  args.push(`return (page) => ${filters.join(" && ")};`);

  const factory = new Function(...args);

  return factory(...values);
}

function compileCondition(key, operator, name, value) {
  key = key.replaceAll(".", "?.");

  if (Array.isArray(value)) {
    switch (operator) {
      case "=":
        return `${name}.some((i) => page.${key} === i)`;

      case "!=":
        return `${name}.some((i) => page.${key} !== i)`;

      case "^=":
        return `${name}.some((i) => page.${key}?.startsWith(i))`;

      case "$=":
        return `${name}.some((i) => page.${key}?.endsWith(i))`;

      case "*=":
        return `${name}.some((i) => page.${key}?.includes(i))`;

      default: // < > <= =>
        return `${name}.some((i) => page.${key} ${operator} i)`;
    }
  }

  switch (operator) {
    case "=":
      return `page.${key} === ${name}`;

    case "!=":
      return `page.${key} !== ${name}`;

    case "^=":
      return `page.${key}?.startsWith(${name})`;

    case "$=":
      return `page.${key}?.endsWith(${name})`;

    case "*=":
      return `page.${key}?.includes(${name})`;

    default: // < > <= =>
      return `page.${key} ${operator} ${name}`;
  }
}

function compileValue(value) {
  if (value.includes("|")) {
    return value.split("|").map((val) => compileValue(val));
  }
  if (value.toLowerCase() === "true") {
    return true;
  }
  if (value.toLowerCase() === "false") {
    return false;
  }
  if (value && isFinite(value)) {
    return Number(value);
  }

  return value;
}

function compileSort(arg) {
  const match = arg.match(/([\w.-]+)(?:=(asc|desc))?/);
  let [, key, direction] = match;

  key = key.replaceAll(".", "?.");
  const operator = direction === "desc" ? ">" : "<";

  return new Function(
    "a",
    "b",
    `return a.${key} == b.${key} ? 0 : (a.${key} ${operator} b.${key} ? -1 : 1)`,
  );
}
