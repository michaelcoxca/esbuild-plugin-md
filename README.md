# esbuild-plugin-md (WIP)

Import markdown files with `esbuild`, using [marked](https://github.com/markedjs/marked).

## Install


```sh
npm i -D esbuild-plugin-md
```

## Usage

Add it to your esbuild plugins list:

```ts
import * as esbuild from "esbuild";
import markdownPlugin from "esbuild-plugin-md";

await esbuild.build({
  ...
  plugins: [
    markdownPlugin()
  ],
  loader: {
	".md": "file"
  }
  ...
});
```
Using it in your project:

```ts
import markdownFile from "./assets/example.md";
async function getArticle() {
	return await exampleMd;
}

async function someFunction() {
	...
	let content = await getArticle();
// content: {
//  html: parsed markdown (with "marked") sanitized with DOMPurify
//  raw: raw markdown file (Blank when using file as loader for .md)
//  filename: imported file's absolute path
//  frontmatter: { title, slug } Object containing front-matter
//
// }
	...
}
```

## Options

You can add your own custom configuration of options to `esbuild-plugin-md`:

```ts
markdownPlugin({
  markedOptions: { 
	//options
	... 
  }
});
```

### `markedOptions`

Custom [marked](https://github.com/markedjs/marked) options.

If you don't wish to bundle all of your .md content, you can set the loader in your esbuild config

```ts
import * as esbuild from "esbuild";
import markdownPlugin from "esbuild-plugin-md";

await esbuild.build({
  ...
  loader: {
	".md": "file"
  }
  ...
});
```

To bundle json instead use js or json.

```ts
import * as esbuild from "esbuild";
import markdownPlugin from "esbuild-plugin-md";

await esbuild.build({
  ...
  loader: {
	".md": "json"
  }
  ...
});
```

generate a sitemap for static routing:


```ts
await markdownPlugin({
	generateManifest:true,
	manifestName:"manifest.json" //default file name
	... 
});
```

this will wrtite a json file with the following structure:


```json
[{
	filename:string;
	frontmatter:object;
	location:string;
	path:string;
},
...
]
```

Handle importing your md files with a virtual module:

```ts
await markdownPlugin({
	//options
	generateManifest:true,
	manifestType:"virtualmodule" // can be json or virtualmodule
	... 
});
```

Then in your code:

```ts
import manifestMd from "esbuild-plugin-md-manifest";
let siteMap = manifestMd();
async someFunction(slug) {
	if (typeof pageLoader == "function") {
		let page =await pageLoader();
		return await page.default;
	}
}
someFunction().then((pg)=>{
	console.log(pg);
});
```