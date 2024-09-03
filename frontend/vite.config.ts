import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import fs from 'fs';

export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    https: {
      key: fs.readFileSync('/Users/zacharycervenka/certs/localhost-key.pem'),
      cert: fs.readFileSync('/Users/zacharycervenka/certs/localhost.pem'),
    },
  },
});
