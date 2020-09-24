export default async function (path) {
  console.log(`file://${path}`);
  const fileData = await import(`file://${path}`);
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
