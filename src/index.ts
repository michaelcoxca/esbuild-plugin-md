// src/index.ts
import * as esbuild from 'esbuild';
import path from 'node:path';
import { TextDecoder } from "util";
import { readFile, writeFile, mkdir,access, constants  } from 'node:fs/promises';
import { parse, MarkedOptions } from "marked";



export interface PluginOptions {
  markedOptions?: MarkedOptions;
}

export interface Markdown {
	content:string;
	html:string;
	raw:string;
}

export default (options?: PluginOptions) => ({
  name: "markdown",
  setup(build) {
	  

  
	const canWrite = build.initialOptions.write;
	const dirname = import.meta.dirname;
	
	const cwd = build.initialOptions.absWorkingDir || process.cwd();
	const outDir = build.initialOptions.outdir || undefined;
	const outBase = build.initialOptions.outbase || process.cwd();
	
	const loaders = build.initialOptions.loader || {};
	const mdLoader = loaders[".md"] || 'js';
	
	//MD-RUNTIME
	build.onResolve({filter: /^esbuild-plugin-md-runtime$/}, (args) => {	
		const runTimePath = path.join(dirname, "runtime.js");
		return {
				path:runTimePath,
				namespace: "file"
		}
	});
	
	//ES-PLUGIN-MD
    //resolve imports of .md files
    build.onResolve({ filter: /\.md$/ }, (args) => {
		
      if (args.resolveDir === "") return;

		//get source file C:/project/__test__/src/assets/example.md
	  const filePath = (path.isAbsolute(args.path) ? args.path : path.join(args.resolveDir, args.path));
	  
	  //get directory where we should write those files C:/project/__test__/dist/
	  const projectRoot = path.resolve(cwd, outDir || '.');
	  
	  //path relative to project root...
	  let relPath = path.relative(projectRoot, filePath);
	  

	  let argFilePath = relPath.replace(/\.md$/, '.json');
	  
	  	  let parts = argFilePath.split(path.sep);
		  console.log(parts);
		  
	while(parts[0] === '..') {
	  parts.shift();
	}
	  parts.shift();
	  let cleanRelPath = parts.join(path.sep);

	  
	  //create file path for browser
	   const urlPath = path.relative(outDir, cleanRelPath).split(path.sep).join('/');
	   //URL needs a dummy base url for some reason?
	   const url = new URL(urlPath, "http://example.com").pathname;
		
	   const writePath = path.join(projectRoot, cleanRelPath);
		
	  
	  
      return {
        path: filePath,
		pluginData: {writePath, url},
        namespace: "es-plugin-md"
      };
    });

    // handle loading of .md files
    build.onLoad({ filter: /.*/, namespace: "es-plugin-md" }, async (args) => {
	  const fileName = path.basename(args.path);
      const rawText = new TextDecoder().decode(await readFile(args.path));  
      const markdownHTML = parse(rawText, options?.markedOptions);
	  
	  
	  switch (mdLoader) {
		  default:
		  case "text":
			  return {
				  contents: markdownHTML,
				  loader: "text"
			  };
			  break;
		  case "js":
		  case "json":
			  return {
				contents: JSON.stringify({
				  html: markdownHTML,
				  raw: rawText,
				  filename: fileName
				}),
				loader: "json"
			}; 		
			break;
		  case "copy":
		 case "file":
				
				try {
					if (canWrite) {
							const writeDir = path.dirname(args.pluginData.writePath);
							await mkdir(writeDir,{recursive: true});
							//check if we have permission to actually write files there
							const hasAccess = await access(writeDir, constants.W_OK);
							if(hasAccess === undefined) {
								await writeFile(args.pluginData.writePath, JSON.stringify({filename:fileName, html: markdownHTML, raw:""}));
							}
						
					}
					return {
						contents: `
						import lazyLoad from "esbuild-plugin-md-runtime";
						export default lazyLoad("${args.pluginData.url}");
						`,
						loader: "js"
					}
				} catch(err) {console.error(err);throw err;};
			break;
	   }
    });
  }
});
