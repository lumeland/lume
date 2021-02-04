export function compileFilter(query) {
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

export function compileSort(path) {
  path = path.replaceAll(".", "?.");

  return new Function("a", "b", `return (a.${path} < b.${path}) ? -1 : 1`);
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

  if (operator === "~=") {
    return `page.${path}?.includes(${value})`;
  }

  if (operator === "ALL") {
    return `${value}.every((i) => page.${path}?.includes(i))`;
  }

  if (operator === "SOME") {
    return `${value}.some((i) => page.${path}?.includes(i))`;
  }

  throw new Error(`Invalid conditional operator ${operator}`);
}
