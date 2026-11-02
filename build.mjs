import {build} from "esbuild";
import {mkdir,cp,rm} from "node:fs/promises";
await rm("dist",{recursive:true,force:true});
await mkdir("dist/assets",{recursive:true});
await cp("public","dist",{recursive:true});
await build({entryPoints:["src/main.tsx"],outfile:"dist/assets/app.js",bundle:true,minify:true,format:"esm",platform:"browser",target:["es2022"],jsx:"automatic",define:{"process.env.NODE_ENV":'"production"'},legalComments:"linked"});
console.log("Built GitHub Pages demo in dist/. Firebase integration is pending.");
