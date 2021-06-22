export default async function (path) {
  const hash = Date.now();
  const mod = await import(`file://${path}#${hash}`);
  const data = {};

  for (const [name, value] of Object.entries(mod)) {
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

  return data;
}
