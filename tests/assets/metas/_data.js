export const metas = {
  site: "My site",
  title: "My title",
  description: (data) => data.excerpt?.toUpperCase(),
  image: "/my-image.png",
  icon: "/my-icon.png",
  robots: false,
  keywords: [
    "one",
    "two",
  ],
  twitter: "@myUser",
  lang: "gl",
  color: "black",
};
