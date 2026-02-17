// src/index.ts
import * as esbuild from 'esbuild';
import path from 'node:path';
import { TextDecoder } from "util";
import { readFile, writeFile, mkdir } from 'node:fs/promises';
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
	
	
	const cwd = build.initialOptions.absWorkingDir || process.cwd();
	const outDir = build.initialOptions.outdir || undefined;
	const outBase = build.initialOptions.outbase || process.cwd();
	
	const loaders = build.initialOptions.loader || {};
	const mdLoader = loaders[".md"] || 'js';
	
	//MD-RUNTIME
	build.onResolve({filter: /^esbuild-plugin-md-runtime$/}, (args) => {	
		const runTimePath = path.join(__dirname, "runtime.js");
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
	  
	  		//change file extension
		const ArgFilePath = path.format({
			...path.parse(args.path),
			base:null,
			ext: "json"
		});
	  
	  //create file path for browser
	   const urlPath = path.relative(outDir, ArgFilePath).split(path.sep).join('/');
	   //URL needs a dummy base url for some reason?
	   const url = new URL(urlPath, "http://example.com").pathname;
	 
	  

		console.log(process.cwd());
		console.log(filePath);
		
		
		const writePath = path.join(projectRoot, ArgFilePath);
		console.log(writePath);
	  
	  
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
				
				console.log(args);
				
				
				if (canWrite) {
						const dirExists = mkdir(path.dirname(args.pluginData.writePath),{recursive: true});
						if(dirExists) {
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
			break;
	   }
    });
  }
});
