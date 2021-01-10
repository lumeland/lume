import { loadModule } from "../utils.js";

export default async function (path) {
  return loadModule(path, (fileData) => {
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
  });
}
