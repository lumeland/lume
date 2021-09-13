export const title = "Module example";
export const templateEngine = "tmpl.js,md";

export default function ({ title }) {
  return `
# ${title}

[Back to home](/)
`;
}
