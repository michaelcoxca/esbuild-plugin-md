// src/index.ts
import * as esbuild from 'esbuild';
import path from 'node:path';
import { TextDecoder } from "util";
import { readFile, writeFile, mkdir,access, constants  } from 'node:fs/promises';

import { parse, MarkedOptions } from "marked";
import matter from 'gray-matter';

import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window);


export interface PluginOptions {
  markedOptions?: MarkedOptions;
  sanitize?:boolean;
  generateManifest?:boolean;
  manifestName?:string;
}
export interface Manifest {
	filename:string;
	frontmatter:object;
	location:string;
	path:string;
}

export interface Markdown {
	filename:string;
	content:string;
	html:string;
	raw:string;
	frontMatter:object;
}
async function saveFile(filepath:string, content:string | object) {
	let _content = content;
	if (typeof(content) !== "string") {
		_content = JSON.stringify(content);
	}
	try {
		const writeDir = path.dirname(filepath);
		await mkdir(writeDir,{recursive: true});
		//check if we have permission to actually write files there
		const hasAccess = await access(writeDir, constants.W_OK);
		if(hasAccess === undefined) {
			await writeFile(filepath, _content as string);
		}
	} catch (err) {
		return false;
	}
	
	
	return true;
}
export default (options?: PluginOptions) => ({
  name: "markdown",
  setup(build) {
	  
	  
	  //Thanks, I hate it.
	  let _options = {
		  ...options
	  };
	  //allow disabling DOMPurify
	  const sanitize = _options.sanitize || true;
	  const generateManifest = _options.generateManifest || false;
	  const manifestName = _options.manifestName || "manifest.json";

	let manifest:Array<Manifest> = [];
	
  
	const canWrite = build.initialOptions.write;
	const dirname = import.meta.dirname;
	
	const cwd = build.initialOptions.absWorkingDir || process.cwd();
	const outDir = build.initialOptions.outdir || undefined;
	const outBase = build.initialOptions.outbase || process.cwd();
	  
	  //get directory where we should write those files C:/project/__test__/dist/
	  const projectRoot = path.resolve(cwd, outDir || '.');
	  
	
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
	
	  //path relative to project root...
	  let relPath = path.relative(projectRoot, filePath);
	  

	  let argFilePath = relPath.replace(/\.md$/, '.json');
	  
	  	  let parts = argFilePath.split(path.sep);
		  
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
		pluginData: {writePath, url, originalPath: args.path},
        namespace: "es-plugin-md"
      };
    });

    // handle loading of .md files
    build.onLoad({ filter: /.*/, namespace: "es-plugin-md" }, async (args) => {
		
	  const fileName = path.basename(args.path);
      const rawText = new TextDecoder().decode(await readFile(args.path));  
	  
	  const frontMatter = matter(rawText);
	  
      const markdownRawHtml = parse(frontMatter.content, options?.markedOptions);
	  

	  const markdownHtml = sanitize ? purify.sanitize(markdownRawHtml as any) : markdownRawHtml;

	  
	  switch (mdLoader) {
		  default:
		  case "text":
			  return {
				  contents: rawText,
				  loader: "text"
			  };
			  break;
		  case "js":
		  case "json":
			  return {
				contents: JSON.stringify({
				  html: markdownHtml,
				  raw: rawText,
				  filename: fileName,
				  frontmatter: frontMatter.data
				}),
				loader: "json"
			}; 		
			break;
		  case "copy":
		 case "file":
				
				try {
					if (canWrite) {
						const savedFile = await saveFile(args.pluginData.writePath, {filename:fileName, html: markdownHtml, raw: "", frontmatter: frontMatter.data});
						if(savedFile) manifest.push({
							filename:fileName, 
							frontmatter:frontMatter.data, 
							location:args.pluginData.url, 
							path:args.pluginData.originalPath
							
							});
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
	
	build.onEnd(async (result) => {
		 if (result.errors.length > 0) {
        console.error('❌ Build failed with errors.');
      } else {
        console.log('✔ Build completed.');
		if (generateManifest) {
		console.log('Generating site manifest.');	

		const manifestWritePath = path.join(projectRoot, manifestName);

			const savedManifest = await saveFile(manifestWritePath, JSON.stringify(manifest));
			
			console.log(`Manifest has ${savedManifest?"been succesfully saved at":"failed to save at"}:${manifestWritePath}`);
		
		}
      }
		
	});
  }
});
