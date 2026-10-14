---
title: Module **example**
templateEngine: vto,md
myData:
  one: un
  two: dous
  three: tres
---
<!-- deno-fmt-ignore-file -->
# {{ title }}

Foo

{{ for title, no of myData }}
- {{ title }}: [{{ no }}](/items/{{ no }}.html)
{{ /for }}
