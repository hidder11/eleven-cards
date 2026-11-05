// Pure advisory calculations. All elapsed durations use instants, not wall-clock arithmetic.
export function instant(value) {
 if(typeof value==='string'&&!/(Z|[+-]\d\d:\d\d)$/i.test(value))throw Error('Tijdzone ontbreekt');
 const n=+new Date(value);if(!Number.isFinite(n))throw Error('Ongeldige datum');return n;
}
export function localValue(date,zone){return new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(date)).replace(' ','T');}
export function localInputISO(value,zone){
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value))throw Error('Kies een geldige datum en tijd');
 const parsed=Date.parse(value+'Z');let target=parsed;
 for(let i=0;i<4;i++)target+=parsed-Date.parse(localValue(target,zone)+'Z');
 if(!Number.isFinite(target)||localValue(target,zone)!==value)throw Error('Deze lokale tijd bestaat niet');
 for(const delta of [-3600000,3600000])if(localValue(target+delta,zone)===value)throw Error('Deze lokale tijd is dubbel door wintertijd');
 return new Date(target).toISOString();
}
export function canonicalPrices(data,intervalMinutes){
 if(!Array.isArray(data)||!data.length)throw Error('Geen prijsintervallen beschikbaar');
 const rows=data.map(r=>({start:instant(r.start??r.start_time),end:r.end?instant(r.end):null,price:Object.hasOwn(r,'price')?r.price:r.price_per_kwh})).sort((a,b)=>a.start-b.start);
 if(rows.some(r=>typeof r.price!=='number'||!Number.isFinite(r.price)))throw Error('Ongeldige prijs');
 // Start-only contracts need a demonstrated cadence. Never stretch a gap to the next start.
 const diffs=rows.slice(1).map((r,i)=>(r.start-rows[i].start)/60000).filter(n=>n>0&&n<=60);
 const cadence=intervalMinutes??(diffs.length?Math.min(...diffs):null);
 for(let i=0;i<rows.length;i++){
  const r=rows[i];if(r.end===null){if(![15,30,60].includes(cadence))throw Error('Prijsinterval onbekend; geef expliciete eindtijden');r.end=r.start+cadence*60000;}
  if(r.end<=r.start||i&&rows[i-1].end>r.start)throw Error('Ongeldige of overlappende prijsintervallen');
 }
 return rows.map(r=>({start:new Date(r.start).toISOString(),end:new Date(r.end).toISOString(),price:r.price}));
}
export function advise(data,program,earliest,deadline){
 const start=instant(earliest),limit=instant(deadline),minutes=Number(program.minutes),kwh=Number(program.kwh),duration=minutes*60000;
 if(!(minutes>=1&&minutes<=1440&&kwh>0&&kwh<=30))throw Error('Vul duur en totaal kWh in');
 if(limit-start>7*86400000)throw Error('Kies maximaal zeven dagen vooruit');
 if(duration>limit-start)throw Error('Dit programma past niet vóór de eindtijd');
 const rows=canonicalPrices(data).map(r=>({...r,start:instant(r.start),end:instant(r.end)}));
 const costAt=(a,b)=>{
  let cursor=a,area=0;
  for(const r of rows){if(r.end<=cursor)continue;if(r.start>cursor)return null;const end=Math.min(b,r.end);area+=(end-cursor)*r.price;cursor=end;if(cursor>=b)return area/duration*kwh;}
  return null;
 };
 const candidates=new Set([start,limit-duration]);
 for(const r of rows)for(const t of [r.start,r.end,r.start-duration,r.end-duration])if(t>=start&&t<=limit-duration)candidates.add(t);
 let best=null;
 for(const t of [...candidates].sort((a,b)=>a-b)){const cost=costAt(t,t+duration);if(cost!==null&&(!best||cost<best.cost-1e-10))best={start:new Date(t).toISOString(),end:new Date(t+duration).toISOString(),cost};}
 if(!best)throw Error('Nog geen volledig geprijsd tijdvak beschikbaar');
 const immediate=costAt(start,start+duration);
 return {...best,kwh,average:best.cost/kwh,savings:immediate===null?null:Math.max(0,immediate-best.cost),immediate_cost:immediate,provisional:costAt(start,limit)===null,profile_source:'uniform'};
}
