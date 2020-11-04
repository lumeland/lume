import { existsSync } from "./deps/fs.js";
import { parse } from "./deps/flags.js";
import { brightGreen } from "./deps/colors.js";
import { join, relative, resolve } from "./deps/path.js";

if (import.meta.main) {
  cli(Deno.args);
}

export default async function cli(args) {
  const version = "v0.8.1";
  let stop = false;
  const options = parse(args, {
    boolean: ["serve", "init", "version", "dev", "help"],
    string: ["run"],
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
      if (option.startsWith("-")) {
        console.log(`Unknown option: ${option}`);
        stop = true;
      }
    },
  });

  if (stop) {
    console.log(`Run ${brightGreen("lume --help")} for usage information`);
    console.log("");
    return;
  }

  if (options._.length > 1) {
    console.log(`Too much arguments: ${options._.join(", ")}`);
    console.log(`Run ${brightGreen("lume --help")} for usage information`);
    console.log("");
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
    lume [OPTIONS] [<path>]

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

  let cwd, configFile;

  if (options._[0]) {
    const path = options._[0];

    if (path.endsWith(".js") || path.endsWith(".ts")) {
      configFile = resolve(path);
      cwd = dirname(configFile);
    } else {
      cwd = resolve(path);
      configFile = join(cwd, "_config.js");

      if (!existsSync(cwd)) {
        console.log(`The folder ${cwd} does not exists`);
        console.log("");
        return;
      }
    }
  } else {
    cwd = Deno.cwd();
    configFile = join(cwd, "_config.js");
  }

  // lume --init
  if (options.init) {
    Deno.writeTextFileSync(
      configFile,
      `import lume from "https://deno.land/x/lume/mod.js";

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
    site.options.cwd = cwd;
  } else {
    const { default: lume } = await import("./mod.js");
    site = lume({ cwd });
  }

  if (options.dev) {
    site.options.dev = options.dev;
  }

  if (options.location) {
    site.options.location = new URL(options.location);
  }

  // lume --run
  if (options.run) {
    const success = await site.scripts.run(options.run);
    Deno.exit(success ? 0 : 1);
  }

  console.log("");
  await site.build();

  console.log("");
  console.log(`🍾 ${brightGreen("Site built")}`);

  if (!options.serve) {
    return;
  }

  // lume --serve
  const { server } = await import("./server.js");

  try {
    await server(site.dest(), options.port);
    const watcher = Deno.watchFs(site.src());
    const changes = new Set();
    console.log("Watching for changes...");

    let timer = 0;

    const rebuild = async () => {
      console.log("");
      console.log("Changes detected. Building...");
      const files = new Set(changes);
      changes.clear();

      try {
        await site.update(files);
        console.log("Done");
        console.log("");
      } catch (err) {
        console.error(err);
      }
    };

    for await (const event of watcher) {
      if (event.paths.every((path) => path.startsWith(site.dest()))) {
        continue;
      }

      event.paths.forEach((path) =>
        changes.add(join("/", relative(site.src(), path)))
      );

      //Debounce
      clearTimeout(timer);
      timer = setTimeout(rebuild, 500);
    }
  } catch (err) {
    console.log(err);
  }
}
