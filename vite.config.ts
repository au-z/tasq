import { defineConfig } from "vite";
import CssHmr from "rollup-plugin-css-hmr";

export default defineConfig({
  server: {
    proxy: {
      "/api/v1/employee": {
        target: "http://dummy.restapiexample.com",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    {
      ...CssHmr(".ts"),
      enforce: "post",
    },
  ],
});
