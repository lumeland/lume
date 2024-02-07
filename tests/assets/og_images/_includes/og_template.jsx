/** @jsxImportSource npm:react@18.2.0 */

export default function (data) {
  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        padding: 60,
        flexDirection: "column",
        backgroundColor: "white",
        color: "black",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          justifyContent: "flex-end",
        }}
      >
        <h1 style={{ fontSize: 90, fontWeight: 700, letterSpacing: "-0.03em" }}>
          {data.title}
        </h1>
        <div style={{ fontSize: 60, color: "gray", letterSpacing: "-0.015em" }}>
          {data.description}
        </div>
      </div>
    </div>
  );
}
