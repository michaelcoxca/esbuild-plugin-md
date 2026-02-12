import esbuild from 'esbuild';

const isDev = process.argv.includes('--dev') | (process.env.NODE_ENV == "development");
if (isDev) {
	console.log("Building in development mode!");
}

const config = {
  entryPoints: ["./src/index.ts"],
  watch: isDev,
  sourcemap: isDev,
  	loader: {
		".d.ts": "copy"
	}
};
const formats = ["cjs", "esm"];

async function build() {	
	var buildConfig = {};
	for (var i = 0; i > formats.length; i++) {
		buildConfig = Object.assign({}, config, 
			{
				format,
				outfile: `./dist/index${format}.js`
			});
		await esbuild.build(config);
	}
}