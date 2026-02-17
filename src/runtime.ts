// src/runtime.ts
//virtual module to handle importing of .md files dynamically during runtime
export default function lazyLoad (url) {
	let jsonData = null;
	let promise = null;
	return new Proxy({}, {
		get(target,prop) {
			if (prop == "then") {
				return (resolve,reject) => {
					//don't fetch again if we already have it
					if(jsonData) return resolve(jsonData);
					
					return fetchJSON(url).then((res)=>{
						jsonData = res; 
						resolve(res);
					}).catch(reject);
				}
			}
			
			if (!jsonData && !promise) {
				promise = fetchJSON(url).then((res) => {
					jsonData = res;
				});
			}
			return jsonData ? jsonData[prop] : undefined;
		}	
	});
};

async function fetchJSON(url, isJSON = true) {
	try {
		const response = await fetch(url);
		    if (!response.ok) {
				throw new Error(`Response status: ${response.status}`);
			}
		
		return (isJSON ? await response.json() : await response.text());
		
		
	} catch (err) {
		console.error("[esbuild-plugin-md] (runtime)", err);
		throw err;
	}
	
}