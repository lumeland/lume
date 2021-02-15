export default function (path, source) {
  return source.loadModule(path, (fileData) => {
    const data = {};

    for (const [name, value] of Object.entries(fileData)) {
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
  });
}
