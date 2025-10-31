// // vite.config.ts
// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import mdx from "@mdx-js/rollup";
// import path from "path";
// import tailwindcss from "@tailwindcss/vite";

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [
//     react(),
//     tailwindcss(),
//     mdx({
//       remarkPlugins: [],
//       rehypePlugins: [],
//     }),
//   ],
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
// });

// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import mdx from "@mdx-js/rollup";
// import path from "path";

// export default defineConfig({
//   plugins: [
//     mdx({
//       providerImportSource: "@mdx-js/react",
//     }),
//     react({
//       include: /\.(jsx|js|mdx|md|tsx|ts)$/, // Include MDX files
//     }),
//   ],
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
//   esbuild: {
//     jsx: "automatic", // This helps with JSX compilation
//   },
// });

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    mdx({
      remarkPlugins: [remarkGfm, remarkFrontmatter, remarkMdxFrontmatter],
      providerImportSource: "@mdx-js/react",
    }),
    react({
      include: /\.(jsx|js|tsx|ts)$/,
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Allow all hosts in preview mode
  preview: {
    allowedHosts: ["*"], // This allows any domain
  },
});
