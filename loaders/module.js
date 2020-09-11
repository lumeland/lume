export default async function (path) {
  const fileData = await import(path);
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

  return data;
}
