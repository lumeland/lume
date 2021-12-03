export const title = "Default Filter";
export const url = "/default-filter";

export default function ({}, { url, htmlUrl }) {
  return `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <title>Default Filter</title>
        </head>
        <body>
            <a id="url" href="${url?.("/url/", true)}">Url</a>
            ${htmlUrl?.('<a id="htmlUrl" href="/htmlUrl/">htmlUrl</a>', true)}
        </body>
    </html>
  `;
}
