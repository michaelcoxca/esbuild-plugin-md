import * as esbuild from "esbuild";
import markdownPlugin from "../dist/index.js";
import { describe, test } from "vitest";



	describe("Test loaders when compiling markdown file", async () => {
		const loaders = ["text", "json", "file", "copy"];
		let res;
		for (const loader of loaders) {
			await test(`testing loader: ${loader}`, async () => {
			res = await esbuild.build({
				entryPoints: ['__test__/src/basic.ts'],
				bundle:true,
				write:false,
				plugins:[markdownPlugin()],
				loader:{".md": loader},
				outdir:"__test__/dist/"
			});
			console.log(loader,res.outputFiles[0].text);
			});

		}

		await test("Save file using loader:file", async () => {
			
			res = await esbuild.build({
				entryPoints: ['__test__/src/index.html', '__test__/src/basic.ts'],
				bundle:true,
				write:true,
				plugins:[markdownPlugin({generateManifest:true})],
				loader:{".md": "file",
				".html": "copy",
				".ts": "ts"},
				outdir:"__test__/dist/"
			});
			console.log(res);
			
		});

	});
	



