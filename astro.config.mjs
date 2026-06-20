import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: "https://robinberzinmd.com",
  adapter: vercel(),
  trailingSlash: "always",
});
