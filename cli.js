import lume from "./mod.js";
import { server } from "./src/server.js";
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
  try {
    const update = await server(site.options.dest);
    const watcher = Deno.watchFs(site.options.src);
    const changes = new Set();
    console.log("Watching for changes...");

    async function rebuild() {
      if (!changes.size) {
        return;
      }

      console.log("Changes detected. Reloading...");
      await site.update(changes);
      await update();
      changes.clear();
      console.log("");
    }

    setInterval(rebuild, 500);

    for await (const event of watcher) {
      if (event.paths.every((path) => path.startsWith(site.options.dest))) {
        continue;
      }

      event.paths.forEach((path) =>
        changes.add(join("/", relative(site.options.src, path)))
      );
    }
  } catch (err) {
    console.log(err);
  }
}
