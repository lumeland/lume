---
title: Extra data
---

You can assign extra data to your site available everywhere. This allows to have functions that you can execute everywhere, for example for searching or pagination results.

In fact, there are two helpers available by default: [`search`](/creating-pages/searching) and [`paginate`](/creating-pages/pagination) precisely for that purpose.

If you need to add more extra data, use the `_config.js` file:

```js
site.data("randomNumber", function () {
  return Math.random();
})
```

Now, this function is available in your layouts:

```html
<p>Random number: {{ randomNumber() }}</p>
```
