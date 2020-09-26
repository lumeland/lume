---
title: JSX
---

[JSX](https://facebook.github.io/jsx/) (or the equivalent TSX for typescript) is a template language to create and render HTML code, very popular in some frameworks like React. This format **is disabled by default** so you have to enable it by using the jsx plugin in the `_config.js` file:

```js
import jsx from "https://deno.land/x/lume/plugins/jsx.js";

site.use(jsx());
```

## Creating pages

To create a page with this format, just add a file with `.jsx` or `.tsx` extension to your site. This format works exactly the same as [javascript/typescript files](/plugins/modules), but with the addition of you can export JSX code in the default export:

```jsx
export const title = "Welcome to my page";
export const layout = "layouts/main.njk";

export default (data) => 
  <h1>{ data.title }</h1>
  <p>This is my first post using lume. I hope you like it!</p>
```

Note that this page uses the `layouts/main.njk` layout to wrap the content (you can mix different template languages like Nunjucks and JSX)

## Creating layouts

To create layouts in JSX, just add `.jsx` or `.tsx` files to the `_includes` folder. Note that we need to use the variable `children` to render the page content instead `content`. The difference is that `content` is a string and cannot be easily used in JSX because it's escaped, and `children` is the JSX object un-rendered.

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
