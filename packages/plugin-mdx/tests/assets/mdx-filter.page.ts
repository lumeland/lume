export const title = "mdx filter example";
export default async (data: Lume.Data, { mdx }: Lume.Helpers) =>
  await mdx(
    `
---
title: Hello world
description: This is a description
---

<comp.Header title={title} description={description}/>

## Hello world
  
This is a markdown file with the title **{ title }**.
    `,
    {
      ...data,
      title: "Hello world",
      description: "This is a description",
    },
  );
