export const title = "Renamed Filter";
export const url = "/renamed-filter/";

export default function (_, { urlify, htmlUrlify }) {
  return `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <title>Renamed Filter</title>
        </head>
        <body>
            <a id="urlify" href="${urlify?.("/urlify/", true)}">Urlify</a>
            ${htmlUrlify?.(
    '<a id="htmlUrlify" href="/htmlUrlify/">htmlUrlify</a>',
    true,
  )}
        </body>
    </html>
  `;
}
