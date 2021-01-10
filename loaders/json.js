import { readFile } from "../utils.js";

export default async function (path) {
  return readFile(path, (content) => JSON.parse(content));
}
