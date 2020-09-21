---
title: Installation
---

**lume** requires Deno to be installed on your computer (Windows, Mac or Linux). If you don't have it, see [Deno installation](https://deno.land/#installation) for instructions.

You can execute **lume** remotely simply by executing the following command:

```sh
deno run --unstable --allow-read --allow-write --allow-net https://deno.land/x/lume/cli.js
```

An easier way would be to installing the script as an executable. To do that, just execute:

```sh
deno install --unstable --allow-read --allow-write --allow-net https://deno.land/x/lume/cli.js
```

Now you have the `lume` command that can be invoked at any point:

```sh
cd ./my-project-dir
lume
```

If you want to change the command name, just use the `-n / --name` argument. For example:

```sh
deno install --unstable --allow-read --allow-write --allow-net -n fire https://deno.land/x/lume/cli.js
```

More info about [how to install scripts in Deno](https://deno.land/manual/tools/script_installer).
