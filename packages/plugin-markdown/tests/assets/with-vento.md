---
title: Module **example**
templateEngine: vto,md
myData:
  one: un
  two: dous
  three: tres
---
# {{ title }}

Foo

{{ for title, no of myData }}
- {{ title }}: [{{ no }}](/items/{{ no }}.html)
{{ /for }}
