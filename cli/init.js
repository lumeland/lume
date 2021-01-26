import { brightGreen } from "../deps/colors.js";

/**
 * Command to generate a new _config.js file
 */
export default async function init(file, version) {
  Deno.writeTextFileSync(
    file,
    `import lume from "https://deno.land/x/lume@${version}/mod.js";

const site = lume();

export default site;
`,
  );
  console.log(brightGreen("Created config file"), file);
}
