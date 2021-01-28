import {brightGreen} from "../deps/colors.js";

export const USAGE = `
    ${brightGreen("lume init")}: create a _config.js file for a new site
    
    USAGE:
        lume init
`
/**
 * Command to generate a new _config.js file
 */
export default async function init() {
  Deno.writeTextFileSync(
      file,
      `import lume from "https://deno.land/x/lume@${version}/mod.js";

const site = lume();

export default site;
`,
  );
  console.log(brightGreen("Created config file"), file);
}
