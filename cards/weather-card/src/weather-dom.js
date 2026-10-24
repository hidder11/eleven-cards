// Retain live nodes, focus, scroll offsets and running SVG animations on telemetry updates.
export function patchWeatherDOM(root,markup){
 const template=document.createElement('template');template.innerHTML=markup;
 const key=node=>node.nodeType===1?node.localName+'|'+(node.getAttribute('data-weather-key')??node.getAttribute('data-ui-tab')??node.getAttribute('data-ui-tab-panel')??node.getAttribute('data-forecast-field')??node.getAttribute('class')?.split(' ')[0]??''):String(node.nodeType);
 const patch=(parent,incoming)=>{
  let cursor=parent.firstChild;
  for(const next of [...incoming.childNodes]){
   let current=cursor;
   if(!current||key(current)!==key(next)){
    current=cursor?.nextSibling;
    while(current&&key(current)!==key(next))current=current.nextSibling;
    if(current)parent.insertBefore(current,cursor);else{current=next.cloneNode(true);parent.insertBefore(current,cursor);}
   }
   if(!current.isEqualNode(next)){
    if(current.nodeType===3)current.nodeValue=next.nodeValue;
    else if(current.nodeType===1){
     for(const attribute of [...current.attributes])if(!next.hasAttribute(attribute.name))current.removeAttribute(attribute.name);
     for(const attribute of [...next.attributes])if(current.getAttribute(attribute.name)!==attribute.value)current.setAttribute(attribute.name,attribute.value);
     patch(current,next);
    }
   }
   cursor=current.nextSibling;
  }
  while(cursor){const next=cursor.nextSibling;parent.removeChild(cursor);cursor=next;}
 };
 patch(root,template.content);
}
