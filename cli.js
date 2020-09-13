import lume from "./mod.js";
import { existsSync } from "./deps/fs.js";
import { parse } from "./deps/flags.js";
import { brightGreen } from "./deps/colors.js";
import { join, relative } from "./deps/path.js";

const args = parse(Deno.args, {
  boolean: ["serve"],
  default: {
    serve: false,
    port: 3000,
  },
});

let site;
const configFile = join(Deno.cwd(), "_config.js");

if (existsSync(configFile)) {
  const mod = await import(configFile);
  site = mod.default;
} else {
  site = lume({
    src: Deno.cwd(),
    dest: join(Deno.cwd(), "_site"),
  });

  site.copy("/_static", "/");
}

console.log("");
await site.build();

console.log("");
console.log(brightGreen("Site built"));

if (args.serve) {
  const { server } = await import("./server.js");

  try {
    const update = await server(site.options.dest, args.port);
    const watcher = Deno.watchFs(site.options.src);
    const changes = new Set();
    console.log("Watching for changes...");

    let timer = 0;

    const rebuild = async () => {
      console.log("");
      console.log("Changes detected. Building...");
      const files = new Set(changes);
      changes.clear();

      await site.update(files);
      await update();
      console.log("");
    };

    for await (const event of watcher) {
      if (event.paths.every((path) => path.startsWith(site.options.dest))) {
        continue;
      }

      event.paths.forEach((path) =>
        changes.add(join("/", relative(site.options.src, path)))
      );

      //Debounce
      clearTimeout(timer);
      timer = setTimeout(rebuild, 500);
    }
  } catch (err) {
    console.log(err);
  }
}
