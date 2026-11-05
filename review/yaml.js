// JSON-compatible values rendered as block YAML with quoted keys and strings.
// Quoting avoids YAML 1.1 booleans, timestamps, anchors and numeric coercion.
const quote=value=>JSON.stringify(value).replace(/[\u007f-\u009f\u2028\u2029]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
function scalar(value){
 if(value===null)return 'null';
 if(typeof value==='string')return quote(value);
 if(typeof value==='boolean')return String(value);
 if(typeof value==='number'&&Number.isFinite(value))return String(value);
 if(Array.isArray(value)&&value.length===0)return '[]';
 if(value&&Object.getPrototypeOf(value)===Object.prototype&&Object.keys(value).length===0)return '{}';
 return undefined;
}
export function toYaml(value){
 const seen=new Set();
 function lines(value,depth){
  const atom=scalar(value),pad=' '.repeat(depth);
  if(atom!==undefined)return [pad+atom];
  if(!value||typeof value!=='object'||(!Array.isArray(value)&&Object.getPrototypeOf(value)!==Object.prototype)||seen.has(value))throw new TypeError('Expected acyclic JSON-compatible YAML value');
  seen.add(value);
  const rows=[];
  for(const [key,child] of Array.isArray(value)?value.map((v,i)=>[i,v]):Object.entries(value)){
   const prefix=Array.isArray(value)?'-':quote(key)+':';
   const leaf=scalar(child);
   if(leaf!==undefined)rows.push(pad+prefix+' '+leaf);
   else {rows.push(pad+prefix);rows.push(...lines(child,depth+2));}
  }
  seen.delete(value);return rows;
 }
 return lines(value,0).join('\n')+'\n';
}
export async function copyYaml(button,status,text,clipboard=globalThis.navigator?.clipboard){
 button.disabled=true;status.textContent='';
 try{
  if(!clipboard?.writeText)throw new Error('Clipboard unavailable');
  await clipboard.writeText(text);
  status.textContent='YAML gekopieerd.';return true;
 }catch{
  status.textContent='Kopiëren mislukt. Selecteer de YAML en kopieer handmatig.';return false;
 }finally{button.disabled=false;}
}
