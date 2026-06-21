import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { FontaineTransform } from "fontaine";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
  base: "/",
  plugins: [
    devtools(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    // Eliminate web-font swap layout shift (CLS). Reads each self-hosted woff2's
    // metrics at build time and injects a metric-matched fallback @font-face
    // (size-adjust/ascent-override/etc.) so the fallback occupies the exact same
    // box as Geist / Cormorant Garamond — the swap from `font-display: swap`
    // becomes visually weightless instead of reflowing text (e.g. in popovers).
    // MUST be listed before tailwindcss(): both enforce "pre", so array order
    // decides which runs first, and fontaine needs the raw (quoted) @font-face /
    // font-family rules before Tailwind/Lightning CSS strips the quotes — without
    // this the multi-word "Cormorant Garamond" family is mis-parsed and broken.
    FontaineTransform.vite({
      // Per-family so the fallback's actual glyphs match the web font's category
      // during the brief swap window: a sans for Geist, a serif for Cormorant.
      // (Arial/Georgia ship on effectively all Windows & macOS systems and have
      // known metrics, so size-adjust resolves precisely against them.)
      fallbacks: {
        Geist: ["Arial"],
        "Cormorant Garamond": ["Georgia"],
      },
      // @font-face src URLs are public paths ("/fonts/geist-latin.woff2"); map
      // them to the on-disk file under public/ so metrics can be measured.
      resolvePath: (id) => new URL(`./public${id}`, import.meta.url),
    }),
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    viteReact(),
  ],
});

export default config;
