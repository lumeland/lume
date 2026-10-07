export default function ({ children, content }: { children: JSX.Children, content: JSX.Children }) {
  return <>
    <h1>Children: {children ?? "empty"}</h1>
    <h1>Content: {content ?? "empty"}</h1>
  </>
}
