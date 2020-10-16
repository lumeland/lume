---
title: Installation
---

**lume** requires Deno installed on your computer. Read [Deno installation](https://deno.land/#installation) instructions if you don't have it yet.

You can execute **lume** remotely by executing the following command:

```sh
deno run --unstable --allow-read --allow-write --allow-net https://deno.land/x/lume/cli.js
```

But it's easier if you install the script as an executable, by running:

```sh
deno install --unstable --allow-read --allow-write --allow-net https://deno.land/x/lume/cli.js
```

Now you have the `lume` command that can be invoked at any point. If you want to change the command name, just use the `-n / --name` argument. For example, to change the name to `fire`:

```sh
deno install --unstable --allow-read --allow-write --allow-net -n fire https://deno.land/x/lume/cli.js
```

More info about [how to install scripts in Deno](https://deno.land/manual/tools/script_installer).

## Update

Updating **lume** is like install it, but you need to add `-f` (to override the previous installation) and `-r` to remove cache and reload all dependencies:

```sh
deno install -f -r --unstable --allow-read --allow-write --allow-net https://deno.land/x/lume/cli.js
```
