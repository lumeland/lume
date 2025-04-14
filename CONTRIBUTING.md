# Contributing Guide

## How to contribute

This is a collaborative effort. We welcome all contributions submitted as pull
requests.

(Contributions on wording & style are also welcome.)

### Bugs

A bug is a demonstrable problem that is caused by the code in the repository.
Good bug reports are extremely helpful – thank you!

Please try to be as detailed as possible in your report. Include specific
information about the environment – version of Lume, Deno, Operating System,
etc, and steps required to reproduce the issue.

### Pull Requests

Good pull requests – patches, improvements, new features – are a fantastic help.
Before create a pull request, please follow these instructions:

- One pull request per feature. If you want to do more than one thing, send
  multiple pull request.
- Write tests.
- Run `deno fmt` to fix the code format before commit.
- Document any change in the `CHANGELOG.md`.

## Local development

To use a local version of Lume in your site for testing purposes, change the
`lume/` import in the import map to the local folder of Lume. For example:

```diff
{
    "imports": {
-       "lume/": "https://deno.land/x/lume@2.5.0/",
+       "lume/": "../lume/",
```

Alternatively, use [Lume CLI](https://github.com/lumeland/cli) for a simpler
process:

- Run `lume local --save` in your local Lume clone to set the current directory
  as the local Lume path.
- Run `lume local` in your project folder to update the `lume/` import to the
  local path.
