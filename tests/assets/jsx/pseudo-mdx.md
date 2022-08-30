---
layout: layout.jsx
title: Markdown combined with JSX
templateEngine: jsx,md
---

import Hello from "./_includes/hello.jsx";

# Hello <strong className="foo">world</strong>

This is a **markdown** text. [Go home](/)

<comp.Button type="foo" />

<img src="foo" />

<Hello>Hello world</Hello>
