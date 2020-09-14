import { existsSync } from "./deps/fs.js";
import { parse } from "./deps/flags.js";
import { brightGreen } from "./deps/colors.js";
import { join, relative } from "./deps/path.js";

if (import.meta.main) {
  cli(Deno.args);
}

export default async function cli(args) {
  const version = "v0.2.3";
  const options = parse(args, {
    boolean: ["serve", "init", "version"],
    default: {
      serve: false,
      port: 3000,
    },
  });

  const configFile = join(Deno.cwd(), "_config.js");

  // lume --version
  if (options.version) {
    console.log(`🔥lume ${version}`);
    return;
  }

  // lume --init
  if (options.init) {
    Deno.writeTextFileSync(
      configFile,
      `import lume from "https://deno.land/x/lume@${version}/mod.js";
  
  const site = lume({
    src: ".",
    dest: "_site",
  });
  
  export default site;
  `,
    );
    console.log(brightGreen("Created config file"), configFile);
    return;
  }

  let site;

  if (existsSync(configFile)) {
    const mod = await import(`file://${configFile}`);
    site = mod.default;
  } else {
    const { default: lume } = await import("./mod.js");

    site = lume({
      src: Deno.cwd(),
      dest: join(Deno.cwd(), "_site"),
    });
  }

  console.log("");
  await site.build();

  console.log("");
  console.log(brightGreen("Site built"));

  if (!options.serve) {
    return;
  }

  // lume --serve
  const { server } = await import("./server.js");

  try {
    const update = await server(site.options.dest, options.port);
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
