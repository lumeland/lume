const cache = new Map();

export default async function (path) {
  if (cache.has(path)) {
    return cache.get(path);
  }

  const hash = new Date().getTime();
  const fileData = await import(`file://${path}#${hash}`);
  const data = {};

  for (let [name, value] of Object.entries(fileData)) {
    if (name === "default") {
      switch (typeof value) {
        case "string":
        case "function":
          data.content = value;
          break;
        default:
          Object.assign(data, value);
      }

      continue;
    }

    data[name] = value;
  }

  cache.set(path, data);

  return data;
}

export function removeCache(path) {
  cache.delete(path);
}
