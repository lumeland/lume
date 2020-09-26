---
title: Filters
---

Filters are functions that can be applied to variables to transform content. Nunjucks template engine [has some builtin filters](https://mozilla.github.io/nunjucks/templating.html#builtin-filters), for example:

```html
<h1>{{ 'Welcome' | upper }}</h1>
```

Output:

```html
<h1>WELCOME</h1>
```

Lume allows to create your own filters to be used by all template engines. New plugins must be registered in the `_config.js` file:

```js
// Filter to prepend a 👍 to any text
site.filter("thumbsUp", (value) => "👍 " + value);
```

Now this filter is available in your layouts:

```html
<h1>{{ 'Welcome' | upper | thumbsUp }}</h1>
```

Output:

```html
<h1>👍 WELCOME</h1>
```

## Builtin filters

Lume includes the following convenient preinstalled filters:

### md

It's installed by the `markdown` plugin and allows to render markdown content to HTML. [More info](plugins/markdown)

### url

The filter `url` normalize paths with the location value that you have configured in `_config.js`. It's useful if your site is in a subdirectory or you want to generate absolute urls.

```html
<a href="{{ '/about-us' | url }}">

<!-- Full url -->
<a href="{{ '/about-us' | url(true) }}">
```

### attr

Provide a convenient way to work with html attributes.

```html
---
link:
  title: Go to Github
  href: https://github.com
  target: _blank
---

<a {{ link | attr | safe }}>
```

You can also filter the attributes names:

```html
---
link:
  text: Go to Github
  href: https://github.com
  target: _blank
  noopen: true
  class:
    - link
    - link-external
---

<a {{ link | attr('href', 'target', 'noopen', 'class') | safe }}>
  {{ link.text }}
</a>
```

## Using the filters in javascript modules

If you're using javascript/typescript modules instead a template engine like Nunjucks, filters are passed as the second argument of your default exported function:

```js

export default function(data, filters) {
  return `<a href="${filters.url('/about-us')}">About us</a>`
}
```