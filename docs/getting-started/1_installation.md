---
title: Installation
---

**lume** requires Deno installed on your computer. Read [Deno installation](https://deno.land/#installation) instructions if you don't have it yet.

## Execute without install

You can execute **lume** remotely by executing the following command:

```sh
deno run --unstable -A https://deno.land/x/lume/cli.js
```

## Install as executable

But it's easier if you install the script as an executable, by running:

```sh
deno install --unstable -A https://deno.land/x/lume/cli.js
```

Now you have the `lume` command. If you want to change the command name, just use the `-n / --name` argument. More info about [how to install scripts in Deno](https://deno.land/manual/tools/script_installer).

## Update

Updating **lume** is like install it, but you need to add `-f` (to override the previous installation) and `-r` to remove cache and reload all dependencies:

```sh
deno install -f -r --unstable -A https://deno.land/x/lume/cli.js
```
