import * as fs from "fs";
import * as path from "path";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";

const copyFiles = [
  [
    "node_modules/@typescene/webapp/umd/typescene.es8.min.js",
    "dist/lib/typescene.es8.min.js",
  ],
  ["index.html", "dist/index.html"],
];

export default {
  input: "./app/app.ts",
  external: ["typescene", "@typescene/webapp"],
  output: {
    name: "app",
    dir: "dist",
    entryFileNames: "app.bundle.js",
    format: "iife",
    sourcemap: true,
    globals: {
      typescene: "typescene",
      "@typescene/webapp": "typescene",
    },
  },
  plugins: [
    {
      async buildStart() {
        for (let f of copyFiles) {
          let src = path.resolve(__dirname, f[0]);
          let dest = path.resolve(__dirname, f[1]);
          if (!fs.existsSync(path.dirname(dest)))
            fs.mkdirSync(path.dirname(dest), { recursive: true });
          console.log(src + " => " + dest);
          fs.copyFileSync(src, dest);
          this.addWatchFile(src);
        }
      },
    },
    resolve(),
    typescript({ tsconfig: "./tsconfig.json" }),
    serve({
      port: 8080,
      contentBase: "dist",
      open: true,
    }),
    livereload(),
  ],
};
