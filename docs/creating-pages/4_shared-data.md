---
title: Shared data
---

In addition to the variables defined in the front matter of the pages and layouts, you can store other data accessible by some or all pages. Shared data must be saved in the `_data` folder or `_data.*` files with extensions like `.json`, `.yaml`, `.js`, `.ts` etc.

## The `_data.*` files

Any data stored in files with `_data` as *basename* will be loaded and shared by all pages in the same directory or subdirectory.

```
.
├── _data.yaml      # Data shared with all pages
├── index.md
└── documentation
    └── _data.json  # Shared with pages in this directory or subdirectories
    └── doc1.md
    └── doc2.md
    └── examples
        └── _data.json  # Shared with pages in this directory or subdirectories
        └── example1.md
        └── example2.md
```

As you can see, the shared data is propagated in cascade following the folder structure. A typical use case is to store those variables that are common to all pages in the same directory. For example, if all pages in the `documentation` folder use the same layout, instead repeating the same value in the front matter of `doc1.md`, `doc2.md` etc, you can write it only once in the `_data.json` file.

## The `_data` folders

`_data` folders are similar to `_data` files, but instead using only one file, you save the data in files inside that folder. It's useful if to want to have data organized in multiple files. The *basename* of each file determines the variable name that is used. Let's see an example:

```
.
└── _data
    └── users.json
    └── menu.yaml
    └── documents.js
```

In this example, the data stored in the file `_/data/users.json` can be accessed via `users` variable, and the same for `menu.yaml` and `documents.js`. To render the list of users in your `nunjucks` template, you only need to do this:

```html
<h2>Users</h2>

<ul>
{% for user in users %}
  <li>
      {{ user.name }}
  </li>
{% endfor %}
</ul>
```

Like `_data.*` files, you can have `_data` folders in different directories, and their data will be shared only to all pages in the same directory or subdirectories.