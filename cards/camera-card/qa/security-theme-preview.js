// Preview the real released theme, without duplicating its palette in the card.
export async function setupThemePreview(controls,update){
 const response=await fetch('/themes/eleven_material.yaml');
 if(!response.ok)throw Error('Material theme fixture unavailable');
 const yaml=await response.text(),roles={base:{},light:{},dark:{}};let mode='base';
 for(const line of yaml.split(/\r?\n/)){
  const section=line.match(/^    (light|dark):$/);if(section){mode=section[1];continue;}
  const entry=line.match(/^( {2}| {6})([\w-]+): "(.*)"\s*$/);
  if(entry)roles[entry[1].length===2?'base':mode]['--'+entry[2]]=entry[3];
 }
 const label=document.createElement('label');label.textContent='Thema';
 const select=document.createElement('select');select.id='theme-style';
 select.innerHTML='<option value="material">Eleven Material</option><option value="ha">Home Assistant</option>';
 label.append(select);controls.append(label);
 const accentLabel=document.createElement('label');accentLabel.textContent='Accentkleur';
 const accent=document.createElement('input');accent.type='color';accent.id='theme-accent';accent.value='#a18cdd';accentLabel.append(accent);controls.append(accentLabel);
 const owned=new Set([...Object.keys(roles.base),...Object.keys(roles.light),...Object.keys(roles.dark)]);
 const apply=()=>{
  for(const name of owned)document.body.style.removeProperty(name);
  const light=document.body.classList.contains('light');
  if(select.value==='material')for(const [name,value] of Object.entries({...roles.base,...roles[light?'light':'dark']}))document.body.style.setProperty(name,value);
  document.body.style.background='var(--primary-background-color,'+(light?'#edf0f4':'#151b22')+')';
  document.body.style.setProperty('--accent-color',accent.value);update();
 };
 select.onchange=apply;accent.oninput=apply;
 const toggle=document.querySelector('#theme'),previous=toggle.onclick;
 toggle.onclick=event=>{previous(event);apply();};
 apply();
 return {apply,select,accent};
}
