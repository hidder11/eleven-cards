// Adapter supplies _config, _hass and _setCustomTabs().
export const customTabsEditor=Base=>class extends Base{
 _customAction(action,index,rowIndex){
  const tabs=this._config.custom_tabs.map(tab=>({...tab,entities:tab.entities.map(row=>({...row}))}));
  const move=(list,from,to)=>{if(to>=0&&to<list.length)[list[from],list[to]]=[list[to],list[from]];};
  if(action==='tab-add'){let n=1;while(tabs.some(tab=>tab.id==='custom-'+n))n++;tabs.push({id:'custom-'+n,title:'',show:true,entities:[]});}
  if(action==='tab-remove')tabs.splice(index,1);
  if(action==='tab-up')move(tabs,index,index-1);if(action==='tab-down')move(tabs,index,index+1);
  if(action==='row-add')tabs[index].entities.push({entity:''});
  if(action==='row-remove')tabs[index].entities.splice(rowIndex,1);
  if(action==='row-up')move(tabs[index].entities,rowIndex,rowIndex-1);if(action==='row-down')move(tabs[index].entities,rowIndex,rowIndex+1);
  this._setCustomTabs(tabs);
  if(action==='tab-add')this.shadowRoot.querySelector('.custom-tabs').lastElementChild.open=true;
  if(action==='row-add')this.shadowRoot.querySelector('.custom-tabs').children[index].querySelector('.tab-entities').lastElementChild.open=true;
 }
 _renderCustomTabs(nl){
  const container=this.shadowRoot.querySelector('.custom-tabs'),tabs=this._config.custom_tabs;
  this.shadowRoot.querySelector('h3').textContent=nl?'Eigen tabbladen':'Custom tabs';
  this.shadowRoot.querySelector('.tabs-help').textContent=nl?'Voeg je eigen tabbladen en entiteiten toe, ook in compacte weergave. Entiteiten tonen altijd hun actuele waarde.':'Add your own tabs and entities, including compact layouts. Entities always show their current value.';
  const add=this.shadowRoot.querySelector('[data-action=tab-add]');add.textContent=nl?'Tabblad toevoegen':'Add tab';
  const buttons=(actions)=>actions.map(([action,label])=>`<button type="button" data-action="${action}">${label}</button>`).join('');
  for(const element of [...container.children])if(!tabs.some(tab=>tab.id===element.dataset.tabId))element.remove();
  tabs.forEach((tab,index)=>{
   let element=[...container.children].find(el=>el.dataset.tabId===tab.id);
   if(!element){element=document.createElement('details');element.dataset.tabId=tab.id;element.innerHTML='<summary></summary><div class="tab-body"><ha-form class="tab-form"></ha-form><div class="tab-entities"></div><div class="actions">'+buttons([['row-add',nl?'Entiteit toevoegen':'Add entity'],['tab-up',nl?'Omhoog':'Move up'],['tab-down',nl?'Omlaag':'Move down'],['tab-remove',nl?'Tabblad verwijderen':'Remove tab']])+'</div></div>';
    element.querySelector('.tab-form').addEventListener('value-changed',event=>{event.stopPropagation();const i=Number(element.dataset.index),next=this._config.custom_tabs.map((item,j)=>j===i?{...item,...event.detail.value}:item);this._setCustomTabs(next);});
    element.addEventListener('click',event=>{const button=event.target.closest('button[data-action]');if(!button)return;this._customAction(button.dataset.action,Number(element.dataset.index),Number(button.closest('[data-row]')?.dataset.row));});
   }
   element.dataset.index=index;
   // Moving an already-positioned node disconnects its focused input.
   if(container.children[index]!==element)container.insertBefore(element,container.children[index]??null);
   element.querySelector('summary').textContent=tab.title||(nl?'Eigen tabblad ':'Custom tab ')+(index+1);
   Object.assign(element.querySelector('.tab-form'),{hass:this._hass,data:tab,schema:[{name:'title',selector:{text:{}}},{name:'show',selector:{boolean:{}}}],computeLabel:item=>item.name==='title'?(nl?'Naam tabblad':'Tab name'):(nl?'Tabblad tonen':'Show tab')});
   element.querySelector('[data-action=tab-up]').disabled=index===0;element.querySelector('[data-action=tab-down]').disabled=index===tabs.length-1;
   const rows=element.querySelector('.tab-entities');while(rows.children.length>tab.entities.length)rows.lastElementChild.remove();
   tab.entities.forEach((row,rowIndex)=>{
    let rowElement=rows.children[rowIndex];
    if(!rowElement){rowElement=document.createElement('details');rowElement.innerHTML='<summary></summary><div class="tab-body"><ha-form></ha-form><div class="actions">'+buttons([['row-up',nl?'Omhoog':'Move up'],['row-down',nl?'Omlaag':'Move down'],['row-remove',nl?'Verwijderen':'Remove']])+'</div></div>';rows.append(rowElement);
     rowElement.querySelector('ha-form').addEventListener('value-changed',event=>{event.stopPropagation();const i=Number(element.dataset.index),r=Number(rowElement.dataset.row),next=this._config.custom_tabs.map((item,j)=>j===i?{...item,entities:item.entities.map((value,k)=>k===r?{...value,...event.detail.value}:value)}:item);this._setCustomTabs(next);});
    }
    rowElement.dataset.row=rowIndex;rowElement.querySelector('summary').textContent=row.name||this._hass.states?.[row.entity]?.attributes?.friendly_name||row.entity||(nl?'Nieuwe entiteit':'New entity');
    const rowLabels={entity:nl?'Entiteit':'Entity',name:nl?'Label (optioneel)':'Label (optional)',attribute:nl?'Attribuut (optioneel)':'Attribute (optional)',unit:nl?'Eigen eenheid (optioneel)':'Custom unit (optional)',show_unit:nl?'Eenheid tonen':'Show unit',decimals:nl?'Decimalen (optioneel)':'Decimal places (optional)'};
    Object.assign(rowElement.querySelector('ha-form'),{hass:this._hass,data:row,schema:[{name:'entity',selector:{entity:{}}},...['name','attribute'].map(name=>({name,selector:{text:{}}})),{name:'show_unit',selector:{boolean:{}}},...(row.show_unit?[{name:'unit',selector:{text:{}}}]:[]),{name:'decimals',selector:{number:{min:0,max:this._customTabMaxDecimals??6,step:1,mode:'box'}}}],computeLabel:item=>rowLabels[item.name]});
    rowElement.querySelector('[data-action=row-up]').disabled=rowIndex===0;rowElement.querySelector('[data-action=row-down]').disabled=rowIndex===tab.entities.length-1;
   });
  });
  const actionLabels={'row-add':nl?'Entiteit toevoegen':'Add entity','tab-up':nl?'Omhoog':'Move up','tab-down':nl?'Omlaag':'Move down','tab-remove':nl?'Tabblad verwijderen':'Remove tab','row-up':nl?'Omhoog':'Move up','row-down':nl?'Omlaag':'Move down','row-remove':nl?'Verwijderen':'Remove'};
  for(const button of container.querySelectorAll('[data-action]'))button.textContent=actionLabels[button.dataset.action];
 }
};
