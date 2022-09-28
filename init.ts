import { checkDenoVersion } from "./core/utils.ts";
import init from "./cli/init.ts";

checkDenoVersion();
init();
