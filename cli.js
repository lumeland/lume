import { existsSync } from "./deps/fs.js";
import { parse } from "./deps/flags.js";
import { brightGreen, gray } from "./deps/colors.js";
import { join, relative, resolve } from "./deps/path.js";
import lume from "./mod.js";
import { error } from "./utils.js";

if (import.meta.main) {
  cli(Deno.args);
}

export default async function cli(args) {
  const version = "v0.11.0";
  let stop = false;
  const options = parse(args, {
    boolean: ["serve", "init", "version", "dev", "help", "upgrade"],
    string: ["run", "port", "src", "dest", "location"],
    alias: {
      help: "h",
      version: "v",
    },
    ["--"]: true,
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
        --dest     Set/override the dest option
        --dev      Run lume in development mode
    -h, --help     Prints help information
        --init     Creates a _config.js file
        --location Set/override the location option
        --port     Change the default port of the webserver (from 3000)
        --run      Run a script
        --serve    Starts the webserver
        --src      Set/override the src option
        --upgrade  Upgrade lume to the latest version
    -v, --version  Prints version information
`);
    return;
  }

  // lume --version
  if (options.version) {
    console.log(`🔥lume ${version}`);
    return;
  }

  // lume --upgrade
  if (options.upgrade) {
    const versions = await fetch(
      "https://cdn.deno.land/lume/meta/versions.json",
    ).then((res) => res.json());

    if (versions.latest === version) {
      console.log(
        `You're using the latest version of lume: ${versions.latest}!`,
      );
      console.log("");
      return;
    }

    console.log(
      `New version available. Updating lume to ${versions.latest}...`,
    );

    await Deno.run({
      cmd: [
        "deno",
        "install",
        "--unstable",
        "-Afr",
        `https://deno.land/x/lume@${versions.latest}/cli.js`,
      ],
    }).status();

    await Deno.run({
      cmd: [
        "deno",
        "cache",
        "--unstable",
        "-r",
        `https://deno.land/x/lume/mod.js`,
      ],
    }).status();

    console.log("");
    console.log(
      `Update successful! You're using the latest version of lume: ${
        brightGreen(versions.latest)
      }!`,
    );
    console.log(`See the changes in https://github.com/lumeland/lume/blob/${versions.latest}/CHANGELOG.md`);
    console.log("");
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

const site = lume();

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
    site = lume({ cwd });
  }

  if (options.dev) {
    site.options.dev = options.dev;
  }

  if (options.location) {
    site.options.location = new URL(options.location);
  }

  if (options.src) {
    site.options.src = options.src;
  }

  if (options.dest) {
    site.options.dest = options.dest;
  }

  if (options["--"]) {
    site.options.flags = options["--"];
  }

  // lume --run
  if (options.run) {
    const success = await site.run(options.run);
    window.addEventListener("unload", () => Deno.exit(success ? 0 : 1));
    return;
  }

  console.log("");
  await site.build();

  console.log("");
  console.log(`🍾 ${brightGreen("Site built into")} ${gray(site.options.dest)}`);

  if (!options.serve) {
    return;
  }

  // lume --serve
  const { server } = await import("./server.js");

  try {
    await server(site, options);
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
        error("rebuild", "Error on build the site", err);
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
