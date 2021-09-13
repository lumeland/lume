import { posix } from "../deps/path.ts";
import { brightGreen } from "../deps/colors.ts";

interface Options {
  config: string;
  importMap: boolean;
  plugins: string[];
}

/** Generate a _config.js file */
export default async function init({ config, importMap, plugins }: Options) {
  const lumeUrl = importMap
    ? "https://deno.land/x/lume/"
    : new URL("..", import.meta.url).href;
  const code = [`import lume from "${posix.join(lumeUrl, "mod.ts")}";`];

  plugins.sort().forEach((name) =>
    code.push(
      `import ${name} from "${posix.join(lumeUrl, `plugins/${name}.ts`)}";`,
    )
  );
  code.push("");
  code.push("const site = lume();");

  if (plugins.length) {
    code.push("");
    plugins.sort().forEach((name) => code.push(`site.use(${name}());`));
  }

  code.push("");
  code.push("export default site;");
  code.push("");

  await Deno.writeTextFile(config, code.join("\n"));
  console.log(brightGreen("Created a config file"), config);
}
