export const title = "Default title";

export default function ({ content, title }) {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
    </head>
    <body>
      <main>${content}</main>
    </body>
  </html>
  `;
}
