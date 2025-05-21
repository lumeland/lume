export default function* (_, { slugify }) {
  yield {
    title: slugify("Filloas con nocilla"),
    url: "/Filloas con nocilla/",
    content: "Filloas con nocilla",
  };
  yield {
    title: slugify("/803Ñfon sfodij&%&/(/"),
    url: "/803Ñfon sfodij&%&/(/",
    content: "Foo",
  };
}
