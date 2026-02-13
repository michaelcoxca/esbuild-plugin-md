// src/index.ts
/// <reference path="markdown.d.ts" />
import * as esbuild from 'esbuild'
import { TextDecoder } from "util";
import path from 'node:path'
import { readFile } from 'node:fs/promises';
import { parse, MarkedOptions } from "marked";

export interface PluginOptions {
  markedOptions?: MarkedOptions;
}

export default (options?: PluginOptions) => ({
  name: "markdown",
  setup(build) {
    // resolve .md files
    build.onResolve({ filter: /\.md$/ }, (args) => {
      if (args.resolveDir === "") return;

      return {
        path: path.isAbsolute(args.path)
          ? args.path
          : path.join(args.resolveDir, args.path),
        namespace: "markdown"
      };
    });

    // load files with "markdown" namespace
    build.onLoad({ filter: /.*/, namespace: "markdown" }, async (args) => {
		
      const markdownContent = new TextDecoder().decode(await readFile(args.path));  
      const markdownHTML = parse(markdownContent, options?.markedOptions);

      return {
        contents: JSON.stringify({
          html: markdownHTML,
          raw: markdownContent,
          filename: path.basename(args.path)
        }),
        loader: "json"
      };
    });
  }
});
