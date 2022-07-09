import { cyan, green, red } from "./deps/colors.ts";
import { checkDenoVersion } from "./core/utils.ts";
import init from "./cli/init.ts";

const denoInfo = checkDenoVersion();

if (denoInfo) {
  console.log("----------------------------------------");
  console.error(red("Error initializing Lume"));
  console.log(`Lume needs Deno ${green(denoInfo.minimum)} or greater`);
  console.log(`Your current version is ${red(denoInfo.current)}`);
  console.log(`Run ${cyan(denoInfo.command)} and try again`);
  console.log("----------------------------------------");
  Deno.exit(1);
}

init();
