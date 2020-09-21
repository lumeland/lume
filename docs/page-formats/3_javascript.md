---
title: Javascript/Typescript
---

You can use also javascript or typescript files to generate your pages. To do that, create a file with the extension `.tmpl.js` or `.tmpl.ts`. The `.tmpl` subextension is required to differentiate these pages from the javascript files that you want to execute in the browser. To export the variables, use named exports and to export the main content you can use the default export.

For example, let's see this **markdown** file:

```yaml
---
title: Welcome to my page
layout: layouts/main.njk
---

This is my first post using lume. I hope you like it!
```

The equivalent in javascript is:

```js
export const title = "Welcome to my page";
export const layout = "layouts/main.njk";

export default "This is my first post using lume. I hope you like it!";
```

The default export can be also a function, so it will be executed passing all the available data in the first argument and the filters in the second argument:

```js
export const title = "Welcome to my page";
export const layout = "layouts/main.njk";

export default (data, filters) => 
  `<h1>${filters.uppercase(data.title)}</h1>
  <p>This is my first post using lume. I hope you like it!</p>`
```

The default export can be consumed in the layouts with the `content` variable:

```html
<html>
  <head>
    <title>{{ title }}</title>
  </head>
  <body>
    {{ content | safe }}
  </body>
</html>
```

