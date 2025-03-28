export default async function ({ comp, text }) {
  return `<div>${await comp.jsx_button({ text })}</div>`;
}
