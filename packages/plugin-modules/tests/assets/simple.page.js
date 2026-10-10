export const title = "Module example";
export const layout = "layout.js";
export const url = "/simple-page-new-permalink.html";

const content = `
<p>This is a simple page.</p>
<a class="link-1" href="/">Go to home page</a>
<a class="link-2" href="~/simple.page.js">Go to simple page</a>
`;

export default function ({ title }, { url, htmlUrl }) {
  return `
    <h1>${title}</h1>
    <nav>
      <a class="home" href="${url("/", true)}">Back to home</a>
    </nav>
    <div>
      ${htmlUrl(content)}
    </div>
  `;
}
