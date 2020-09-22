---
title: md
---

The filter `md` renders any markdown value to html. It's enabled by default and accepts an argument to render the markdown in *inline* mode.

```html
<!-- Render to html code -->
<div>{{ text | md }}<div>

<!-- Single line rendering, without paragraph wrap: -->
<p>{{ text | md(true) }}<p>
```

## Use the filter in javascript template

Filters are available in all template engines. To use it in a javascript module:

```js
export const title = "Welcome **to my page**";

export default ({ title }, { md }) => 
  `<h1>${md(title, true)}</h1>`
```