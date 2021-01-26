import { exists } from "../deps/fs.js";
import { error } from "../utils.js";
import { brightGreen, gray } from "../deps/colors.js";

/**
 * Command to update the lume modules used in a _config.js file to the currently installed version
 */
export default async function update(file, version) {
  if (!await exists(file)) {
    error("error", `The file ${file} does not exists`);
    return;
  }

  const content = await Deno.readTextFile(file);
  const updated = content.replaceAll(
    /https:\/\/deno\.land\/x\/lume(@v[\d\.]+)?\/(.*)/g,
    (m, v, path) => `https://deno.land/x/lume@${version}/${path}`,
  );

  if (content === updated) {
    console.log("No changes required in", gray(file));
    console.log("");
    return;
  }

  Deno.writeTextFile(file, updated);

  console.log(`Updated lume modules to ${brightGreen(version)} in`, gray(file));
  console.log("");
}
