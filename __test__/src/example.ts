import manifestMd from "esbuild-plugin-md-manifest";
let siteMap = manifestMd();


async function someFunction(slug) {
	if (typeof pageLoader == "function") {
		let page =await pageLoader();
		return await page.default;
	}
}

someFunction("about").then((pg)=>{
	console.log(pg);
});