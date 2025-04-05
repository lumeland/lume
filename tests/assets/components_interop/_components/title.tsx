export default function ({ children, content }) {
  return <>
    <h1>Children: {children ?? "empty"}</h1>
    <h1>Content: {content ?? "empty"}</h1>
  </>
}