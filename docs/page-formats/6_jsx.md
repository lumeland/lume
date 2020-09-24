---
title: JSX / TSX
---

[JSX](https://facebook.github.io/jsx/) (or the equivalent TSX for typescript) is a template language to create and render HTML code, very popular in some frameworks like React.

You can use this format to create layouts and pages in lume, but this format **is disabled by default** so you have to enable it by using the jsx plugin in the `_config.js` file:

```js
import lume from "https://deno.land/x/lume/mod.js";
import jsx from "https://deno.land/x/lume/plugins/jsx.js";
  
const site = lume({
  src: ".",
  dest: "_site",
});

// Enable JSX
site.use(jsx());

export default site;
```

To create a page with this format, just add a file with `.jsx` or `.tsx` extension to your site. Like with javascript/typescript files, you can use named exports to return variables and the default export to return the HTML code:

```jsx
export const title = "Welcome to my page";
export const layout = "layouts/main.njk";

export default (data) => 
  <h1>{ data.title }</h1>
  <p>This is my first post using lume. I hope you like it!</p>
```

Note that this page uses the `layouts/main.njk` layout to wrap the content (you can mix different template languages like Nunjucks and JSX). The layout could be something like this:

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

The equivalent layout in `.jsx` format would be:

```jsx
export default ({ children }) =>
  <html>
    <head>
      <title>{ title }</title>
    </head>
    <body>
      { children }
    </body>
  </html>
```

Note that we are using the variable `children` to render the page content instead `content`. The difference is that `content` is a string and cannot be easily used in JSX because it's escaped, and `children` is the JSX object un-rendered.