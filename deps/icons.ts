export interface Catalog {
  id: string;
  src: string;
  name?: (name: string, variant?: Variant) => string;
  variants?: (Variant | string)[];
}

export interface Variant {
  id: string;
  path: string;
}

/**
 * The list of icon catalogs.
 */
export const catalogs: Catalog[] = [
  {
    // https://icons.getbootstrap.com/
    id: "bootstrap",
    src: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/icons/{name}.svg",
  },
  {
    // https://heroicons.com/
    id: "heroicons",
    src: "https://cdn.jsdelivr.net/npm/heroicons@2.2.0/{variant}/{name}.svg",
    variants: [
      { id: "outline", path: "24/outline" },
      { id: "solid", path: "24/solid" },
      { id: "minimal", path: "20/solid" },
      { id: "micro", path: "16/solid" },
    ],
  },
  {
    // https://lucide.dev/
    id: "lucide",
    src: "https://cdn.jsdelivr.net/npm/lucide-static@0.542.0/icons/{name}.svg",
  },
  {
    // https://fonts.google.com/icons?icon.set=Material+Symbols
    id: "material-100",
    src:
      "https://cdn.jsdelivr.net/npm/@material-symbols/svg-100@0.34.1/{variant}/{name}.svg",
    variants: ["outlined", "rounded", "sharp"],
  },
  {
    // https://fonts.google.com/icons?icon.set=Material+Symbols
    id: "material-200",
    src:
      "https://cdn.jsdelivr.net/npm/@material-symbols/svg-200@0.34.1/{variant}/{name}.svg",
    variants: ["outlined", "rounded", "sharp"],
  },
  {
    // https://fonts.google.com/icons?icon.set=Material+Symbols
    id: "material-300",
    src:
      "https://cdn.jsdelivr.net/npm/@material-symbols/svg-300@0.34.1/{variant}/{name}.svg",
    variants: ["outlined", "rounded", "sharp"],
  },
  {
    // https://fonts.google.com/icons?icon.set=Material+Symbols
    id: "material-400",
    src:
      "https://cdn.jsdelivr.net/npm/@material-symbols/svg-400@0.34.1/{variant}/{name}.svg",
    variants: ["outlined", "rounded", "sharp"],
  },
  {
    // https://fonts.google.com/icons?icon.set=Material+Symbols
    id: "material-500",
    src:
      "https://cdn.jsdelivr.net/npm/@material-symbols/svg-500@0.34.1/{variant}/{name}.svg",
    variants: ["outlined", "rounded", "sharp"],
  },
  {
    // https://fonts.google.com/icons?icon.set=Material+Symbols
    id: "material-600",
    src:
      "https://cdn.jsdelivr.net/npm/@material-symbols/svg-600@0.34.1/{variant}/{name}.svg",
    variants: ["outlined", "rounded", "sharp"],
  },
  {
    // https://fonts.google.com/icons?icon.set=Material+Symbols
    id: "material-700",
    src:
      "https://cdn.jsdelivr.net/npm/@material-symbols/svg-700@0.34.1/{variant}/{name}.svg",
    variants: ["outlined", "rounded", "sharp"],
  },
  {
    // https://fonts.google.com/icons?icon.set=Material+Icons
    id: "material",
    src:
      "https://cdn.jsdelivr.net/npm/@material-design-icons/svg@0.14.15/{variant}/{name}.svg",
    variants: ["filled", "outlined", "round", "sharp", "two-tone"],
  },
  {
    // https://www.mingcute.com/
    id: "mingcute",
    src: "https://cdn.jsdelivr.net/gh/Richard9394/MingCute@2.95/svg/{name}.svg",
  },
  {
    // https://phosphoricons.com/
    id: "phosphor",
    src:
      "https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2.1.1/assets/{variant}/{name}.svg",
    name(name: string, variant?: Variant) {
      const suffix = variant?.id === "regular" ? "" : `-${variant?.id}`;
      return `${name}${suffix}`;
    },
    variants: ["regular", "bold", "duotone", "fill", "light", "thin"],
  },
  {
    // https://remixicon.com/
    id: "remix",
    src: "https://cdn.jsdelivr.net/npm/remixicon@4.6.0/icons/{name}.svg",
    name: capitalize,
  },
  {
    // https://simpleicons.org/
    id: "simpleicons",
    src: "https://cdn.jsdelivr.net/npm/simple-icons@15.12.0/icons/{name}.svg",
  },
  {
    // https://tabler.io/icons
    id: "tabler",
    src:
      "https://cdn.jsdelivr.net/npm/@tabler/icons@3.34.1/icons/{variant}/{name}.svg",
    variants: ["filled", "outline"],
  },
  {
    // https://mynaui.com/icons
    id: "myna",
    src:
      "https://cdn.jsdelivr.net/npm/@mynaui/icons@0.3.9/{variant}/{name}.svg",
    variants: [
      { id: "regular", path: "icons" },
      { id: "solid", path: "icons-solid" },
    ],
  },
  {
    // https://iconoir.com/
    id: "iconoir",
    src:
      "https://cdn.jsdelivr.net/npm/iconoir@7.11.0/icons/{variant}/{name}.svg",
    variants: ["regular", "solid"],
  },
  {
    // https://sargamicons.com/
    id: "sargam",
    name: capitalize,
    src:
      "https://cdn.jsdelivr.net/npm/sargam-icons@1.4.8/Icons/{variant}/si_{name}.svg",
    variants: [
      { id: "duotone", path: "Duotone" },
      { id: "fill", path: "Fill" },
      { id: "line", path: "Line" },
    ],
  },
  {
    // https://boxicons.com/
    id: "boxicons",
    src: "https://cdn.jsdelivr.net/npm/boxicons@2.1.4/svg/{variant}-{name}.svg",
    variants: [
      { id: "regular", path: "regular/bx" },
      { id: "solid", path: "solid/bxs" },
      { id: "logos", path: "logos/bxl" },
    ],
  },
  {
    // https://ant.design/components/icon
    id: "ant",
    src:
      "https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.4.2/inline-namespaced-svg/{variant}/{name}.svg",
    variants: ["filled", "outlined", "twotone"],
  },
  {
    // https://react.fluentui.dev/?path=/docs/icons-catalog--docs
    id: "fluent",
    src:
      "https://cdn.jsdelivr.net/npm/@fluentui/svg-icons@1.1.309/icons/{name}_{variant}.svg",
    variants: [
      { id: "outlined", path: "regular" },
      "filled",
      { id: "twotone", path: "color" },
    ],
  },
  {
    // https://primer.style/foundations/icons
    id: "octicons",
    src:
      "https://cdn.jsdelivr.net/npm/@primer/octicons@19.16.0/build/svg/{name}-{variant}.svg",
    variants: ["24", "16", "12", "48", "96"],
  },
  {
    // https://openmoji.org/
    id: "openmoji",
    src:
      "https://cdn.jsdelivr.net/npm/openmoji@16.0.0/{variant}/svg/{name}.svg",
    variants: ["color", "black"],
  },
  {
    // https://feathericons.com/
    id: "feather",
    src:
      "https://cdn.jsdelivr.net/npm/feather-icons@4.29.2/dist/icons/{name}.svg",
  },
  {
    // https://fontawesome.com/icons
    id: "fontawesome",
    src:
      "https://cdn.jsdelivr.net/npm/fontawesome-free-icons@1.0.0/icons/{variant}/{name}.svg",
    variants: ["regular", "solid", "brands"],
  },
  {
    // https://css.gg/
    id: "cssgg",
    src: "https://cdn.jsdelivr.net/npm/css.gg@2.1.4/icons/svg/{name}.svg",
  },
  {
    // https://www.radix-ui.com/icons
    id: "radix",
    src:
      "https://cdn.jsdelivr.net/gh/radix-ui/icons@bde33b13aa5848555f5512ac12155930fb4beb7d/packages/radix-icons/icons/{name}.svg",
  },
];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
