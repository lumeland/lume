---
header:
  title: Title from page data
cover: ./use-cover-as-meta-image.png
jsonLd:
  "@type": "WebSite"
  url: "/"
  name: "=header.title"
  inLanguage: "gl"
  publisher:
    "@type": "Organization"
    name: "=header.title"
    logo:
      "@type": "ImageObject"
      url: "=cover"
  image: "/my-image.png"
  keywords:
    - "one"
    - "two"
  emptyThing:
    "@type": "EmptyThing"
---

# Welcome to my website

This is my first page using **Lume,** a static site generator for Deno.
[test link](/test/)
I hope you enjoy it.
