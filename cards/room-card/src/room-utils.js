export function normalizeRoom(c={}){
 if(!String(c.name??'').trim())throw Error('Geef de ruimte een naam');
 if(c.navigation_path&&!/^\/(?!\/)[a-zA-Z0-9_\-/]+$/.test(c.navigation_path))throw Error('Gebruik een lokaal dashboardpad');
 const lights=[...new Set(c.lights??[])];
 if(lights.some(id=>!/^light\.[a-z0-9_]+$/.test(id)))throw Error('Kies alleen lampen');
 return {...c,name:String(c.name),icon:c.icon||'mdi:home-outline',lights};
}
export function temperatureText(s,locale='nl-NL'){
 if(!s||s.state==null||String(s.state).trim()===''||!Number.isFinite(Number(s.state)))return '';
 return new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(Number(s.state))+(s.attributes?.unit_of_measurement?' '+s.attributes.unit_of_measurement:'');
}
export function roomStatus(ids=[],states={}){
 const unique=[...new Set(ids)],total=unique.length;
 const on=unique.filter(id=>states[id]?.state==='on').length;
 const unavailable=unique.filter(id=>!states[id]||['unknown','unavailable'].includes(states[id].state)).length;
 const label=!total?'Nog niet gekoppeld':[on?`${on} aan`:unavailable?'':'Licht uit',unavailable?`${unavailable} niet beschikbaar`:''].filter(Boolean).join(' · ');
 return {total,on,unavailable,label};
}
