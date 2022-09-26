---
templateEngine: njk,md
myData:
  one: un
  two: dous
  three: tres
---
<!-- deno-fmt-ignore-file -->
# {{ title }}

Foo

{% for title, no in myData %}
- {{ title }}: [{{ no }}](/items/{{ no }}.html)
{%- endfor %}
