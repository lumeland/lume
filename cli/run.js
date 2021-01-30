import { unimplemented } from "../deps/asserts.js";
import { brightGreen } from "../deps/colors.js";

export const HELP = `
    ${brightGreen("lume run")}: run a script in your site
    
    USAGE:
        lume run 
`;
export async function run(args) {
  unimplemented();
}
