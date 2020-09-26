---
title: Page files
slug: pages
---

Pages are the files that are loaded, processed and saved in your site. You can create pages using different formats but the simplest way is by adding a markdown file in the root directory with a suitable filename and `.md` as extension. Lume will load these files and generate html pages with them:

```
.
├── index.md     => /index.html
├── about.md     => /about/index.html
└── contact.md   => /contact/index.html
```

You can organize the pages into subfolders, and this structure will be used also in the output of the site build:

```
.
├── index.md        => /index.html
└── documentation
    └── doc1.md     => /documentation/doc1/index.html
    └── doc2.md     => /documentation/doc2/index.html
```

## Page order

Pages are ordered by date, using the file creation date as default. If you want to have full control over this, you can assign the data by prepending it to the filename using the `yyyy-mm-dd` syntax following by an underscore `_` (or `yyyy-mm-dd-hh-ii-ss` if you need also the time). Note that this part is removed to generate the final name:

```
.
├── index.md                          => /index.html
└── posts
    └── 2020-06-21_hello-world.md     => /posts/hello-world/index.html
    └── 2020-06-22_my-second-post.md  => /posts/my-second-post/index.html
```

If you don't mind the exact date, only want to keep an order, you can use just numbers:

```
.
├── index.md                   => /index.html
└── docs
    └── 1_getting-started.md   => /docs/getting-started/index.html
    └── 2_installation.md      => /docs/installation/index.html
    └── 3_downloads.md         => /docs/downloads/index.html
```

## Changing the output URL

You might want to have a particular folder structure for your source files that is different for the built site. With the `permalink` variable you change the output filename of any page (see [Page variables](/creating-pages/page-variables))
