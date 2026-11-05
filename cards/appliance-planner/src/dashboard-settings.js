// Narrow adapter to HA's Lovelace saveConfig interface. Never saves an ambiguous target.
// Contract inspected in frontend/src/panels/lovelace/ha-panel-lovelace.ts.
export function stable(value){if(Array.isArray(value))return '['+value.map(stable).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';return JSON.stringify(value);}
export async function saveCardConfiguration(host,hass,previous,next,normalize){
 if(!hass.user?.is_admin)throw Error('Alleen beheerders kunnen dashboardinstellingen opslaan');
 let node=host,lovelace;
 while(node){if(node.lovelace?.saveConfig){lovelace=node.lovelace;break;}node=node.parentNode||node.host;}
 if(!lovelace||lovelace.mode!=='storage'||!lovelace.rawConfig)throw Error('Open de native dashboard-editor om deze instellingen op te slaan');
 const baseline=JSON.parse(JSON.stringify(lovelace.rawConfig)),matches=[];
 const visit=(obj,path=[])=>{if(!obj||typeof obj!=='object')return;if(obj.type===previous.type){try{if(stable(normalize(obj))===stable(normalize(previous)))matches.push(path);}catch{}}for(const [key,value] of Object.entries(obj))if(value&&typeof value==='object')visit(value,[...path,key]);};visit(baseline);
 if(matches.length!==1)throw Error('Kaart niet uniek gevonden. Gebruik de native dashboard-editor');
 const query={type:'lovelace/config',...(lovelace.urlPath!==null&&lovelace.urlPath!==undefined?{url_path:lovelace.urlPath}:{})};
 const latest=await hass.callWS(query);
 if(stable(latest)!==stable(baseline))throw Error('Dashboard is intussen gewijzigd. Herlaad vóór opslaan');
 const path=matches[0];let target=baseline;for(const key of path.slice(0,-1))target=target[key];target[path.at(-1)]=JSON.parse(JSON.stringify(next));
 await lovelace.saveConfig(baseline);
 const verified=await hass.callWS(query);let readback=verified;for(const key of path)readback=readback?.[key];
 if(stable(readback)!==stable(next))throw Error('Opslag kon niet worden bevestigd. Herlaad het dashboard');
 return verified;
}
