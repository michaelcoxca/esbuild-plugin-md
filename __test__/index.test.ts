import * as esbuild from "esbuild";
import markdownPlugin from "../dist/index.js";
import { describe, test } from "vitest";


 describe("Markdown esbuild tests", () => {
	test("Load markdown file", async () => {
		const res = await esbuild.build({
			entryPoints: ['__test__/assets/example.md'],
			bundle:true,
			write:false,
			plugins:[markdownPlugin()],
			loader:{".md": "js"}
		});
		
		console.log(res.outputFiles[0].text);
	});
	
}); 



