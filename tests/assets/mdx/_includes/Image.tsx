interface Options {
  src: string;
  alt: string;
}

export default function Image({ src, alt }: Options) {
  return <img src={src || "https://via.placeholder.com/350x150"} alt={alt} />;
}
