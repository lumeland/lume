# Migration from Lume v1 to Lume v2

## Core

- Removed output extension detection in the filename: #430
- Removed `Page.dest` property #290.
  - This also removed `Page.updateDest` function.
- Removed `--dev` mode #244, #201.
  - Use the env variable `LUME_DRAFTS=true` to output draft pages.

## `search` Plugin

- Removed `returnPageData` option. Pages always return the `data` object
  https://github.com/lumeland/lume/issues/251
- Removed `search.tags()` function. Use `search.values("tags")`.
- Removed `data` filter.

## `toml` Plugin

- It's installed by default
- QUESTION: Should be possible to create pages from toml files?
  - No, use only for _data
  - Yes, but with a subextension to avoid conflicts with some configuration
    files like `netlify.toml`. For example: `page.tmpl.toml`.
  - Yes.

## `markdown` Plugin

- Disable indented code blocks by default #376

## `jsx` Plugin

- Removed `window.React` #332.

## `slugify_urls` Plugin

- Slugify static files by default. #447
