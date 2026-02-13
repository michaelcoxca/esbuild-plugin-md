import esbuild from 'esbuild';

const isDev = (process.argv.includes('--dev') | (process.env.NODE_ENV == "development")) > 0 ? true:false;
if (isDev) {
	console.log("Building in development mode!");
}

const config = {
  entryPoints: ["./src/index.ts", "./src/markdown.d.ts"],
  format:"esm",
  //outfile: `./dist/index.${formats[i]}.js`
  outdir:"./dist",
  logLevel: "info",
  sourcemap: isDev,
  	loader: {
		".d.ts": "copy"
	}
};

async function build() {
	console.log("Running esbuild.");
	const start = performance.now(); 
	
	await esbuild.build(config);
	
	const end = performance.now(); 
	const d = end - start; 
	console.log(`Operation took ${d.toFixed(3)} milliseconds`);
}

build().then(()=>{console.log("Build finished")}).catch((err)=>{throw err;});