import { existsSync } from "./deps/fs.js";
import { parse } from "./deps/flags.js";
import { brightGreen } from "./deps/colors.js";
import { join, relative } from "./deps/path.js";

if (import.meta.main) {
  cli(Deno.args);
}

export default async function cli(args) {
  const version = "v0.5.1";
  let stop = false;
  const options = parse(args, {
    boolean: ["serve", "init", "version", "dev", "help"],
    alias: {
      help: "h",
      version: "V",
    },
    default: {
      serve: false,
      port: 3000,
      dev: false,
    },
    unknown(option) {
      console.log(`Unknown option: ${option}`);
      console.log(`Run ${brightGreen("lume --help")} for usage information`);
      stop = true;
    },
  });

  if (stop) {
    return;
  }

  // lume --help
  if (options.help) {
    console.log(`🔥lume ${version}
A static site generator for Deno

Docs: https://oscarotero.github.io/lume/

To build the site:
    lume

To serve the site in localhost
    lume --serve

USAGE:
    lume [OPTIONS]

OPTIONS:
        --dev      Run lume in development mode
    -h, --help     Prints help information
        --init     Creates a _config.js file
        --port     Change the default port of the webserver (from 3000)
        --serve    Starts the webserver
    -V, --version  Prints version information
`);
    return;
  }

  // lume --version
  if (options.version) {
    console.log(`🔥lume ${version}`);
    return;
  }

  const configFile = join(Deno.cwd(), "_config.js");

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

  if (options.dev) {
    site.options.dev = options.dev;
  }

  if (options.location) {
    site.options.location = new URL(options.location);
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
    await server(site.options.dest, options.port);
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
      console.log("Done");
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
