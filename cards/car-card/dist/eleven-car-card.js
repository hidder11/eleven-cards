// Eleven Car (beta) - self-contained standalone module
(()=>{
// One recipe for raised information surfaces across all cards.
const UI_SURFACE_SHADOW='inset 0 1px 0 color-mix(in srgb,var(--primary-text-color,#20252b) 5%,transparent),inset 0 -1px 0 rgb(0 0 0 / 4%),0 4px 10px rgb(0 0 0 / 12%)';
function uiSurfaceStyles(selector){return `
:host{--eleven-surface-shadow:${UI_SURFACE_SHADOW}}
${selector}{box-shadow:var(--eleven-surface-shadow)}
@media(forced-colors:active){${selector}{box-shadow:none;outline:1px solid CanvasText;outline-offset:-1px}}
`;}

// Native controls: text/attributes are escaped; content is trusted, caller-owned HTML.
function uiEscape(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function uiAttributes(values={}){
 return Object.entries(values).map(([key,value])=>{
  if(!/^[a-zA-Z_:][\w:.-]*$/.test(key)||/^on/i.test(key))throw Error('Invalid UI attribute: '+key);
  if(value==null)return '';
  if(['disabled','hidden','required','autofocus','multiple','readonly'].includes(key))return value?` ${key}`:'';
  return ` ${key}="${uiEscape(value)}"`;
 }).join('');
}
function uiButton({text='',content,label,title,variant='icon',className='',type='button',href,disabled=false,attrs={}}={}){
 const classes=className?` class="${uiEscape(className)}"`:'';
 const body=content??uiEscape(text),attributes=uiAttributes({...attrs,...(label==null?{}:{'aria-label':label}),...(title==null?{}:{title}),...(disabled?{disabled:true}:{})});
 return href==null?`<button type="${uiEscape(type)}"${classes} data-ui-button="${uiEscape(variant)}"${attributes}>${body}</button>`:`<a${classes} data-ui-button="${uiEscape(variant)}" href="${uiEscape(href)}"${attributes}>${body}</a>`;
}
function uiButtonStyles(){return `
[data-ui-button]{display:flex;align-items:center;justify-content:center;box-sizing:border-box;font:inherit;font-size:12px;font-weight:400;padding:0;border:0;border-radius:4px;background:transparent;color:var(--primary-text-color,#20252b);text-decoration:none;cursor:pointer;flex:none}
[data-ui-button="icon"]{width:32px;height:32px}
[data-ui-button]:not(:disabled):hover{background:color-mix(in srgb,var(--primary-text-color,#20252b) 12%,var(--ha-card-background,var(--card-background-color,#fff)))}
[data-ui-button]:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:-2px}
[data-ui-button="icon"]:focus-visible{background:var(--secondary-background-color,#eee)}
[data-ui-button]:disabled{opacity:.35;cursor:default}
[data-ui-button="surface"]{height:auto;width:100%;justify-content:space-between;gap:8px;min-height:34px;text-align:start;padding:6px 8px;border-radius:5px;background:var(--secondary-background-color,#eee)}
[data-ui-button="surface"][aria-checked="true"],[data-ui-button="surface"][aria-pressed="true"]{color:var(--primary-color,#2196f3);background:color-mix(in srgb,var(--primary-color,#2196f3) 14%,var(--ha-card-background,var(--card-background-color,#fff)));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--primary-color,#2196f3) 55%,transparent)}
[data-ui-button="text"]{min-height:30px;height:auto;width:auto;border-radius:5px}
[data-ui-button="close"]{width:30px;height:30px;min-height:30px;border-radius:5px;font-size:20px;color:inherit}
`;}


// The caller formats measurements and translates the subtitle. All text is escaped.
function uiPrimaryValue({value,unit='',subtitle='',subtitleEntity='',compact=false,entity='',attrs={}}={}){
 const missing=value==null||value==='';
 const number=uiEscape(missing?'—':value);
 const label=subtitle!==''&&subtitle!=null?(subtitleEntity?`<button type="button" class="primary-label" data-entity="${uiEscape(subtitleEntity)}">${uiEscape(subtitle)}</button>`:`<div class="primary-label">${uiEscape(subtitle)}</div>`):'';
 return `<div${uiAttributes({...attrs,'data-ui-primary-value':'','data-density':compact?'compact':'standard','data-unavailable':String(missing)})}><div class="primary-value">${entity?`<button type="button" class="primary-number" data-entity="${uiEscape(entity)}" aria-label="${uiEscape((missing?'—':value)+(!missing&&unit?' '+unit:''))}">${number}</button>`:`<span class="primary-number">${number}</span>`}${!missing&&unit?`<small>${uiEscape(unit)}</small>`:''}</div>${label}</div>`;
}

function uiPrimaryValueStyles(){return `
[data-ui-primary-value]{--_primary-tone:var(--ui-primary-tone,var(--tone,var(--primary-color,#2196f3)));min-width:0;color:var(--primary-text-color,#20252b);font:inherit;text-align:start}
[data-ui-primary-value] .primary-value{display:flex;align-items:flex-start;gap:6px;flex-wrap:wrap;margin:0;font-size:var(--ui-primary-size,60px);line-height:1.15;font-weight:650;letter-spacing:-.055em;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
[data-ui-primary-value] .primary-number{display:block;min-width:0;max-width:100%;overflow-wrap:anywhere}
[data-ui-primary-value] button.primary-number{font:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:inherit}[data-ui-primary-value] button:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:3px;border-radius:3px}
[data-ui-primary-value] .primary-value small{display:block;margin:8px 0 0;font-size:var(--ui-primary-unit-size,16px);line-height:1.4;font-weight:400;letter-spacing:-.03em;color:var(--secondary-text-color,#626a78)}
[data-ui-primary-value] .primary-label{margin-top:6px;padding-inline-start:8px;border-inline-start:2px solid color-mix(in srgb,var(--_primary-tone) 55%,transparent);font-size:11px;line-height:1.4;font-weight:400;letter-spacing:0;color:var(--secondary-text-color,#626a78);overflow-wrap:anywhere}
[data-ui-primary-value] button.primary-label{display:block;max-width:100%;min-height:0;margin-bottom:0;padding-block:0;padding-inline-end:0;border-block:0;border-inline-end:0;border-radius:0;background:none;font-family:inherit;text-align:start;cursor:pointer}
[data-ui-primary-value][data-density=compact] .primary-value{font-size:var(--ui-primary-size,46px)}
[data-ui-primary-value][data-density=compact] .primary-value small{font-size:var(--ui-primary-unit-size,14px);margin-top:5px}
`;}



// Text is escaped. *Content options are trusted markup owned by the calling card.
// action renders a native button; do not nest other controls in that variant.
function uiMetric({icon='',iconContent='',title='',value,valueContent='',unit='',info='',infoContent='',compact=false,action=false,attrs={}}={}){
 const missing=!valueContent&&(value==null||value==='');
 const symbol=iconContent||(icon?`<ha-icon icon="${uiEscape(icon)}"></ha-icon>`:'');
 const tag=action?'button':'div';
 return `<${tag}${uiAttributes({...attrs,...(action?{type:'button'}:{}),'data-ui-metric':'','data-density':compact?'compact':'standard','data-unavailable':String(missing)})}>
  ${symbol?`<span class="ui-metric-icon" aria-hidden="true">${symbol}</span>`:''}
  <div class="ui-metric-reading"><div class="ui-metric-title">${uiEscape(title)}</div><div class="ui-metric-value">${valueContent||uiEscape(missing?'—':value)}${!missing&&unit?` <span class="ui-metric-unit">${uiEscape(unit)}</span>`:''}</div></div>
  ${infoContent||info!==''&&info!=null?`<div class="ui-metric-info">${infoContent||uiEscape(info)}</div>`:''}
 </${tag}>`;
}

function uiMetricStyles(){return uiSurfaceStyles('[data-ui-metric]')+`
[data-ui-metric]{--_metric-tone:var(--ui-metric-tone,var(--primary-color,#2196f3));box-sizing:border-box;display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto;column-gap:8px;row-gap:2px;align-content:start;align-items:start;min-width:0;padding:12px;border-radius:var(--ui-metric-radius,8px);background:radial-gradient(ellipse at 100% 0%,color-mix(in srgb,var(--_metric-tone) 10%,transparent),color-mix(in srgb,var(--_metric-tone) 3%,transparent) 30%,transparent 70%),var(--secondary-background-color,#eee);color:var(--primary-text-color,#20252b);font:inherit;text-align:start}
[data-ui-metric]:has(.ui-metric-info){grid-template-rows:auto auto auto}
[data-ui-metric] .ui-metric-icon{box-sizing:border-box;display:grid;place-items:center;grid-column:2;grid-row:1/span 2;width:26px;height:26px;border-radius:7px;color:var(--_metric-tone);background:transparent;transform:translate(4px,-4px)}
[data-ui-metric] .ui-metric-icon svg,[data-ui-metric] .ui-metric-icon ha-icon{display:block;width:18px;height:18px;--mdc-icon-size:18px}
[data-ui-metric] .ui-metric-icon svg{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
[data-ui-metric] .ui-metric-reading{display:contents}
[data-ui-metric] .ui-metric-title{grid-column:1;grid-row:1;min-width:0}
[data-ui-metric]:not(:has(.ui-metric-icon)) :is(.ui-metric-title,.ui-metric-value){grid-column:1/-1}
[data-ui-metric] .ui-metric-title,[data-ui-metric] .ui-metric-info{font-size:11px;line-height:1.4;font-weight:400;color:var(--secondary-text-color,#626a78);overflow-wrap:anywhere}
[data-ui-metric] .ui-metric-value{grid-column:1;grid-row:2;align-self:stretch;min-width:0;margin:0;font-size:24px;line-height:1.25;font-weight:650;letter-spacing:-.03em;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.ui-metric-unit{display:inline-block;margin-inline-start:4px;font-size:11px;line-height:1.4;font-weight:400;letter-spacing:0;color:var(--secondary-text-color,#626a78)}
[data-ui-metric] .ui-metric-info{grid-column:1/-1;grid-row:3;align-self:stretch;margin-top:6px;padding-top:8px;border-top:1px solid color-mix(in srgb,var(--_metric-tone) 8%,transparent)}
[data-ui-metric][data-density=compact]{padding:8px;column-gap:6px}
[data-ui-metric][data-density=compact] .ui-metric-icon{width:20px;height:20px;border-radius:6px;transform:translate(2px,-2px)}
[data-ui-metric][data-density=compact] .ui-metric-icon svg,[data-ui-metric][data-density=compact] .ui-metric-icon ha-icon{width:16px;height:16px;--mdc-icon-size:16px}
[data-ui-metric][data-density=compact] .ui-metric-value{font-size:20px}
[data-ui-metric][data-density=compact] .ui-metric-info{margin-top:4px;padding-top:4px}
[data-ui-metric][data-unavailable=true]{--_metric-tone:var(--secondary-text-color,#626a78)}
button[data-ui-metric]{width:100%;border:0;cursor:pointer}button[data-ui-metric]:hover{filter:brightness(1.04)}button[data-ui-metric]:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:3px}
[data-ui-metric-grid]{--_metric-rows:2;display:grid;grid-template-columns:repeat(var(--ui-metric-columns,2),minmax(0,1fr));column-gap:12px;row-gap:2px;align-items:stretch}
[data-ui-metric-grid]:has(.ui-metric-info){--_metric-rows:3}
@supports(grid-template-rows:subgrid){[data-ui-metric-grid]>[data-ui-metric]{grid-row:span var(--_metric-rows);grid-template-rows:subgrid}}
`;}


function uiTabs({id,label,items,selected,className='',panelClassName='',variant=''}={}){
 if(typeof id!=='string'||!id||!items?.length||items.some(item=>typeof item.value!=='string'||!item.value)||new Set(items.map(item=>item.value)).size!==items.length)throw Error('Tabs need an id and distinct text values.');
 const active=items.find(item=>item.value===selected&&!item.disabled)??items.find(item=>!item.disabled);
 const tabId=value=>`${id}-tab-${encodeURIComponent(value)}`,panelId=value=>`${id}-panel-${encodeURIComponent(value)}`;
 const bar=`<div${uiAttributes({class:className||null,'data-ui-tabs':'','data-ui-card-tabs':variant==='card'?true:null,role:'tablist','aria-label':label})}>${items.map(item=>uiButton({variant:'tab',text:item.label,disabled:item.disabled,attrs:{role:'tab',id:tabId(item.value),'data-ui-tab':item.value,'aria-controls':panelId(item.value),'aria-selected':item===active,tabindex:item===active?0:-1,...item.tabAttrs}})).join('')}</div>`;
 const panels=items.map(item=>`<section${uiAttributes({class:[panelClassName,item.className].filter(Boolean).join(' ')||null,id:panelId(item.value),role:'tabpanel','aria-labelledby':tabId(item.value),'data-ui-tab-panel':item.value,'data-ui-card-tab-panel':variant==='card'?true:null,...item.panelAttrs,hidden:item!==active})}>${item.content??''}</section>`).join('');
 return bar+panels;
}
function bindUITabs({tabs,panels,onSelect=()=>{}}){
 const buttons=[...tabs],sections=[...panels],cleanups=[];
 const select=(value,{focus=false,notify=true}={})=>{
  const target=buttons.find(tab=>tab.dataset.uiTab===value&&!tab.disabled);if(!target)return false;
  for(const tab of buttons){const active=tab===target;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;}
  for(const panel of sections)panel.hidden=panel.dataset.uiTabPanel!==value;
  if(focus)target.focus({preventScroll:true});if(notify)onSelect(value,target);return true;
 };
 for(const tab of buttons){
  const click=()=>select(tab.dataset.uiTab,{focus:true});
  const keydown=e=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
   e.preventDefault();e.stopPropagation();const enabled=buttons.filter(button=>!button.disabled),index=enabled.indexOf(tab);
   const next=e.key==='Home'?0:e.key==='End'?enabled.length-1:(index+(e.key==='ArrowRight'?1:-1)+enabled.length)%enabled.length;
   if(enabled[next])select(enabled[next].dataset.uiTab,{focus:true});
  };
  tab.onclick=click;tab.onkeydown=keydown;
  cleanups.push(()=>{if(tab.onclick===click)tab.onclick=null;if(tab.onkeydown===keydown)tab.onkeydown=null;});
 }
 return {select,disconnect(){cleanups.splice(0).forEach(remove=>remove());}};
}
function uiTabsStyles(){return `
[data-ui-tabs]{display:flex;align-items:flex-end;gap:8px;border-bottom:1px solid var(--divider-color,#ddd)}
[data-ui-tabs] [role="tab"]{flex:1;justify-content:center;min-width:0;min-height:36px;padding:8px 3px;border:0;border-bottom:2px solid transparent;border-radius:0;background:transparent;color:var(--secondary-text-color,#666);white-space:nowrap}
[data-ui-tabs] [role="tab"]:hover{background:color-mix(in srgb,var(--primary-text-color,#20252b) 5%,var(--ha-card-background,var(--card-background-color,#fff)));color:var(--primary-text-color,#20252b)}
[data-ui-tabs] [role="tab"][aria-selected="true"]{border-bottom-color:var(--primary-color,#2196f3);color:var(--primary-color,#2196f3);font-weight:600}
[data-ui-tab-panel][hidden]{display:none!important}
[data-ui-tabs][data-ui-card-tabs]{margin-top:16px;overflow-x:auto;scrollbar-width:thin}
[data-ui-tabs][data-ui-card-tabs] [role=tab]{flex:1 0 auto;min-width:64px;max-width:220px;display:block;overflow:hidden;text-overflow:ellipsis;text-align:center;font:inherit;line-height:inherit;border-radius:0}
[data-ui-tabs][data-ui-card-tabs] [role=tab][aria-selected=true]{font-weight:600}
[data-ui-card-tab-panel]{margin:0;padding:16px 0 0;border:0;min-width:0}
`;}


const entityTabText=value=>typeof value==='string'?value.trim():'';
const entityTabClamp=(value,fallback,min,max)=>value!==''&&value!=null&&Number.isFinite(Number(value))?Math.max(min,Math.min(max,Number(value))):fallback;
function normalizeEntityTabs(input,maxDecimals=6){
 const used=new Set();return (Array.isArray(input)?input:[]).filter(tab=>tab&&typeof tab==='object').map((tab,index)=>{
  let id=/^custom-[a-z0-9_-]+$/.test(tab.id)?tab.id:'custom-'+(index+1);let n=1;while(used.has(id))id='custom-'+(index+1)+'-'+n++;used.add(id);
  return {id,title:typeof tab.title==='string'?tab.title:'',show:tab.show!==false,entities:(Array.isArray(tab.entities)?tab.entities:[]).map(row=>{
   row=typeof row==='string'?{entity:row}:row??{};
   return {entity:entityTabText(row.entity),name:typeof row.name==='string'?row.name:'',attribute:entityTabText(row.attribute),unit:entityTabText(row.unit),show_unit:row.show_unit!==false,decimals:row.decimals==null||row.decimals===''?null:Math.round(entityTabClamp(row.decimals,2,0,maxDecimals))};
  })};
 });
}

function entityTabReading(row,hass){
 const entity=hass?.states?.[row.entity];
 if(!entity||entity.state==null||['','unknown','unavailable'].includes(String(entity.state).trim()))return '—';
 const raw=row.attribute?entity.attributes?.[row.attribute]:entity.state;
 if(raw==null||typeof raw==='object')return '—';
 const unit=row.show_unit===false?'':row.unit||(row.attribute?'':entity.attributes?.unit_of_measurement);
 let value=String(raw);
 if(value.trim()!==''&&Number.isFinite(Number(value))){
  try{value=new Intl.NumberFormat(hass?.locale?.language??hass?.language??'en',{maximumFractionDigits:row.decimals??2,...(row.decimals!=null?{minimumFractionDigits:row.decimals}:{})}).format(Number(value));}catch{value=String(Number(value));}
 }else if(!row.attribute&&typeof hass?.formatEntityState==='function')return hass.formatEntityState(entity);
 return value+(unit?' '+unit:'');
}
function entityTabContent(tab,hass,nl){
 const rows=tab.entities.filter(row=>row.entity);
 if(!rows.length)return '<p class="energy-detail-note">'+(nl?'Voeg entiteiten toe aan dit tabblad in de kaartconfiguratie.':'Add entities to this tab in the card configuration.')+'</p>';
 return '<dl class="energy-grid-metrics">'+rows.map(row=>{
  const label=row.name||hass?.states?.[row.entity]?.attributes?.friendly_name||row.entity;
  return '<div><dt>'+uiEscape(label)+'</dt><dd><button type="button" class="energy-entity-value" data-entity="'+uiEscape(row.entity)+'">'+uiEscape(entityTabReading(row,hass))+'</button></dd></div>';
 }).join('')+'</dl>';
}

// Adapter supplies _config, _hass and _setCustomTabs().
const customTabsEditor=Base=>class extends Base{
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

// Decorative header layers; all paint inherits the weather state's --tone.
function observeCardMotion(host,onVisibility=()=>{}){
 if(typeof document==='undefined'||typeof host.toggleAttribute!=='function')return ()=>{};
 let visible=true;
 const update=()=>{host.toggleAttribute('data-motion-paused',document.hidden||!visible);onVisibility();};
 const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);update();}):null;
 observer?.observe(host);document.addEventListener('visibilitychange',update);update();
 return ()=>{observer?.disconnect();document.removeEventListener('visibilitychange',update);};
}
function headerAtmosphere(background){
 if(background==='terrain')return '<div class="header-pattern" aria-hidden="true">'+Array.from({length:10},(_,n)=>`<i style="--n:${n}"></i>`).join('')+'</div>';
 if(background==='hologram'||background==='ink')return '<div class="header-pattern" aria-hidden="true">'+'<i></i>'.repeat(background==='ink'?3:2)+'</div>';

 if(!['aurora','clouds','isobars'].includes(background))return '';
 let body='';
 if(background==='aurora')body=Array.from({length:32},(_,i)=>`<i style="--star-x:${i*37%100}%;--star-y:${i*19%72}%;--star-duration:${2+i%5}s;--star-delay:${-i*.37}s"></i>`).join('');
 if(background==='isobars')body='<svg class="weather-isobars" viewBox="0 0 600 340" preserveAspectRatio="none" focusable="false">'+Array.from({length:10},(_,i)=>`<path d="M-40 ${40+i*27}C100 ${-90+i*27} 235 ${270+i*10} 370 ${105+i*15}S580 ${-20+i*28} 650 ${85+i*29}"/>`).join('')+Array.from({length:4},(_,i)=>`<path class="weather-front" d="M-40 ${67+i*54}C100 ${-63+i*54} 235 ${280+i*20} 370 ${120+i*30}S580 ${8+i*56} 650 ${114+i*58}"/>`).join('')+'</svg>';
 return `<div class="header-atmosphere" aria-hidden="true">${body}</div>`;
}

const headerAtmosphereStyles=`
.header-atmosphere{position:absolute;inset:0;overflow:hidden;pointer-events:none;--sky-light:color-mix(in srgb,var(--tone) 42%,transparent)}
.content:is([data-background=aurora],[data-background=clouds],[data-background=isobars]) :is(.scene-background,.header-background)::after{display:none}
.content[data-background=aurora] :is(.scene-background,.header-background)::before{inset:0;background:radial-gradient(ellipse at 60% 20%,color-mix(in srgb,var(--tone) 32%,transparent),transparent 80%)}
[data-background=aurora] .header-atmosphere::before,[data-background=aurora] .header-atmosphere::after{content:'';position:absolute;width:170%;height:72%;left:-35%;top:0;border-radius:50%;background:conic-gradient(from 75deg at 50% 100%,transparent,color-mix(in srgb,var(--tone) 70%,#58ddb6) 10deg,transparent 42deg);filter:blur(13px);animation:weather-aurora 13s ease-in-out infinite alternate;transform:rotate(-18deg)}
[data-background=aurora] .header-atmosphere::after{top:20%;opacity:.7;animation-delay:-7s;animation-duration:17s;transform:rotate(15deg);background:conic-gradient(from 260deg at 50% 0%,transparent,color-mix(in srgb,var(--tone) 75%,#e1a0d9) 15deg,transparent 55deg)}
[data-background=aurora] .header-atmosphere i{position:absolute;left:var(--star-x);top:var(--star-y);width:2px;height:2px;border-radius:50%;background:var(--tone);box-shadow:0 0 8px var(--tone);opacity:.55;animation:weather-star var(--star-duration) ease-in-out infinite alternate;animation-delay:var(--star-delay)}
.content[data-background=clouds] :is(.scene-background,.header-background)::before{inset:0;background:radial-gradient(ellipse at 65% 20%,color-mix(in srgb,var(--tone) 42%,transparent),transparent 76%)}
[data-background=clouds] .header-atmosphere::before,[data-background=clouds] .header-atmosphere::after{content:'';position:absolute;left:-40%;top:32%;width:180%;height:75%;background:radial-gradient(ellipse at 18% 53%,color-mix(in srgb,var(--tone) 42%,transparent),transparent 28%),radial-gradient(ellipse at 46% 40%,color-mix(in srgb,var(--tone) 33%,transparent),transparent 38%),radial-gradient(ellipse at 82% 62%,color-mix(in srgb,var(--tone) 44%,transparent),transparent 31%);animation:weather-clouds 8s ease-in-out infinite alternate}
[data-background=clouds] .header-atmosphere::after{top:12%;opacity:.55;animation-duration:13s;animation-delay:-5s;animation-direction:alternate-reverse}
.content[data-background=isobars] :is(.scene-background,.header-background)::before{inset:0;background:radial-gradient(ellipse at 50% 35%,color-mix(in srgb,var(--tone) 42%,transparent),transparent 70%)}
.weather-isobars{position:absolute;width:155%;height:135%;left:-28%;top:-10%;fill:none;stroke:var(--tone);stroke-width:.8;opacity:.36}
.weather-isobars .weather-front{stroke-width:2;stroke-dasharray:38 540;opacity:1;animation:weather-front 9s linear infinite}
.weather-isobars .weather-front:nth-child(2n){animation-duration:13s;animation-delay:-5s}
@keyframes weather-aurora{to{transform:translate(9%,20%) rotate(9deg) scale(1.16)}}
@keyframes weather-star{from{opacity:.2}to{opacity:.9;transform:scale(1.4)}}
@keyframes weather-clouds{0%{transform:translate(-16%,6%) scale(1);opacity:.6}50%{opacity:1}100%{transform:translate(22%,-16%) scale(1.16);opacity:.85}}
@keyframes weather-front{to{stroke-dashoffset:-578}}
.content:is([data-background-animated=false],[data-animated=false]:not([data-background-animated])) .header-atmosphere,.content:is([data-background-animated=false],[data-animated=false]:not([data-background-animated])) .header-atmosphere *,.content:is([data-background-animated=false],[data-animated=false]:not([data-background-animated])) .header-atmosphere::before,.content:is([data-background-animated=false],[data-animated=false]:not([data-background-animated])) .header-atmosphere::after{animation:none!important}
:host([data-motion-paused]) *,:host([data-motion-paused]) *::before,:host([data-motion-paused]) *::after{animation-play-state:paused!important}
@media(prefers-reduced-motion:reduce){.header-atmosphere,.header-atmosphere *,.header-atmosphere::before,.header-atmosphere::after{animation:none!important}}

.header-pattern{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.header-pattern i{position:absolute;display:block;pointer-events:none}
.content:is([data-background=hologram],[data-background=ink],[data-background=terrain]) :is(.scene-background,.header-background)::before,.content:is([data-background=hologram],[data-background=ink],[data-background=terrain]) :is(.scene-background,.header-background)::after{display:none}
[data-background=hologram] .header-pattern{perspective:380px;background:radial-gradient(ellipse at 50% 60%,color-mix(in srgb,var(--tone) 15%,transparent),transparent 70%)}
[data-background=hologram] .header-pattern i:first-child{inset:-25%;background:repeating-linear-gradient(0deg,transparent 0 35px,color-mix(in srgb,var(--tone) 17%,transparent) 36px,transparent 37px),repeating-linear-gradient(90deg,transparent 0 35px,color-mix(in srgb,var(--tone) 17%,transparent) 36px,transparent 37px);transform:rotateX(52deg);transform-origin:50% 80%;animation:energy-background-grid 26s linear infinite}
[data-background=hologram] .header-pattern i:last-child{inset:0;background:linear-gradient(180deg,transparent 25%,color-mix(in srgb,var(--tone) 14%,transparent) 48%,transparent 65%);animation:energy-background-scan 16s ease-in-out infinite alternate}
[data-background=ink] .header-pattern i{width:100%;height:100%;left:-20%;top:-35%;border-radius:36% 64% 55% 45% / 65% 45% 55% 35%;background:radial-gradient(ellipse,color-mix(in srgb,var(--tone) 25%,transparent),transparent 70%);filter:blur(15px);animation:energy-background-ink 29s ease-in-out infinite alternate}
[data-background=ink] .header-pattern i:nth-child(2){left:35%;top:-20%;opacity:.75;animation-delay:-14s;animation-duration:37s}
[data-background=ink] .header-pattern i:nth-child(3){left:5%;top:25%;opacity:.45;animation-delay:-24s;animation-duration:41s}
[data-background=terrain] .header-pattern i{width:calc(130px + var(--n)*38px);height:calc(80px + var(--n)*25px);left:65%;top:20%;border:1px solid color-mix(in srgb,var(--tone) 20%,transparent);border-radius:42% 58% 63% 37% / 52% 37% 63% 48%;transform:translate(-50%,-50%) rotate(-18deg);animation:energy-background-terrain 24s ease-in-out infinite alternate;animation-delay:calc(var(--n)*-1.5s)}
@keyframes energy-background-grid{to{background-position:0 72px,0 72px}}
@keyframes energy-background-scan{from{transform:translateY(-25%)}to{transform:translateY(25%)}}
@keyframes energy-background-ink{from{transform:rotate(-12deg) scale(.9)}to{transform:translate(10%,8%) rotate(25deg) scale(1.15)}}
@keyframes energy-background-terrain{from{translate:-2% -2%;rotate:-2deg}to{translate:3% 5%;rotate:5deg}}
.content:is([data-background-animated=false],[data-animated=false]:not([data-background-animated])) .header-pattern i{animation:none!important}
:host([data-motion-paused]) .header-pattern i{animation-play-state:paused!important}
@media(prefers-reduced-motion:reduce){.header-pattern i{animation:none!important}}
`;

// Shared designs; each card supplies its own state color through --tone.
const HEADER_BACKGROUNDS = [
 {
  "value": "lanes",
  "label": "Energy Lanes"
 },
 {
  "value": "halo",
  "label": "Halo"
 },
 {
  "value": "ribbon",
  "label": "Silk Flow"
 },
 {
  "value": "prism-glass",
  "label": "Prism Glass"
 },
 {
  "value": "eclipse",
  "label": "Eclipse"
 },
 {
  "value": "aurora",
  "label": "Aurora sky"
 },
 {
  "value": "clouds",
  "label": "Cloud layers"
 },
 {
  "value": "isobars",
  "label": "Atmospheric flow"
 },
 {value:'hologram',label:'Holographic grid',labelNl:'Holografisch raster'},
 {value:'ink',label:'Liquid ink',labelNl:'Vloeibare inkt'},
 {value:'terrain',label:'Relief map',labelNl:'Reliëfkaart'}
].map(item=>({...item,animated:['aurora','clouds','isobars','hologram','ink','terrain'].includes(item.value)}));
function headerBackgroundOptions(nl){
 return HEADER_BACKGROUNDS.map(item=>({value:item.value,label:`${nl?(item.labelNl??item.label):item.label} · ${nl?(item.animated?'Geanimeerd':'Statisch'):(item.animated?'Animated':'Static')}`}));
}


const headerBackgroundStyles = `
:is(.scene-background,.header-background)::before,:is(.scene-background,.header-background)::after{content:"";position:absolute;z-index:-1;pointer-events:none;inset:auto;transform:none;border:0;box-shadow:none;border-radius:0;width:auto;height:auto}
:where(.content[data-background="lanes"]) :is(.scene-background,.header-background)::before{inset:0;background:linear-gradient(143deg,transparent 0 43%,color-mix(in srgb,var(--tone) 19%,transparent) 43.2% 70%,color-mix(in srgb,var(--tone) 5%,transparent) 70.2% 88%,transparent 88.2%),linear-gradient(180deg,color-mix(in srgb,var(--tone) 11%,transparent),transparent 75%)}:where(.content[data-background="lanes"]) :is(.scene-background,.header-background)::after{inset:20% -16% -30% 24%;transform:skewY(-36deg);background:repeating-linear-gradient(0deg,transparent 0 25px,color-mix(in srgb,var(--tone) 13%,transparent) 26px,transparent 27px 58px)}
:where(.content[data-background="halo"]) :is(.scene-background,.header-background)::before{inset:0;background:radial-gradient(ellipse at 75% 68%,color-mix(in srgb,var(--tone) 20%,transparent),transparent 61%),linear-gradient(180deg,color-mix(in srgb,var(--tone) 11%,transparent),transparent 65%)}:where(.content[data-background="halo"]) :is(.scene-background,.header-background)::after{width:88%;height:60%;right:-11%;bottom:20%;border:1px solid color-mix(in srgb,var(--tone) 39%,transparent);border-radius:50%;transform:rotate(-16deg);box-shadow:0 0 0 19px color-mix(in srgb,var(--tone) 4%,transparent),0 0 0 39px color-mix(in srgb,var(--tone) 3%,transparent),inset 0 0 45px color-mix(in srgb,var(--tone) 8%,transparent);background:radial-gradient(ellipse at 50% 50%,color-mix(in srgb,var(--tone) 7%,transparent),transparent 70%)}
:where(.content[data-background="ribbon"]) :is(.scene-background,.header-background)::before{inset:0;background:radial-gradient(ellipse at 95% 32%,color-mix(in srgb,var(--tone) 24%,transparent),transparent 59%),linear-gradient(155deg,color-mix(in srgb,var(--tone) 10%,transparent),transparent 65%)}:where(.content[data-background="ribbon"]) :is(.scene-background,.header-background)::after{width:145%;height:60%;right:-32%;top:22%;border-radius:50%;transform:rotate(-21deg);border-top:1px solid color-mix(in srgb,var(--tone) 49%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--tone) 25%,transparent),color-mix(in srgb,var(--tone) 3%,transparent) 65%,transparent);box-shadow:0 -16px 0 color-mix(in srgb,var(--tone) 5%,transparent),0 -35px 0 color-mix(in srgb,var(--tone) 3%,transparent)}
:where(.content[data-background="prism-glass"]) :is(.scene-background,.header-background)::before{inset:0;background:linear-gradient(119deg,transparent 37%,color-mix(in srgb,var(--tone) 12%,transparent) 37.3%,color-mix(in srgb,var(--tone) 3%,transparent) 76%,transparent 76.3%),linear-gradient(34deg,transparent 42%,color-mix(in srgb,var(--tone) 11%,transparent) 42.3%,transparent 83%),radial-gradient(ellipse at 82% 30%,color-mix(in srgb,var(--tone) 20%,transparent),transparent 63%)}:where(.content[data-background="prism-glass"]) :is(.scene-background,.header-background)::after{inset:0;background:linear-gradient(119deg,transparent 37%,color-mix(in srgb,var(--tone) 23%,transparent) 37.2%,transparent 37.5%),linear-gradient(34deg,transparent 42%,color-mix(in srgb,var(--tone) 19%,transparent) 42.2%,transparent 42.5%)}
:where(.content[data-background="eclipse"]) :is(.scene-background,.header-background)::before{inset:0;background:radial-gradient(ellipse at 82% 24%,color-mix(in srgb,var(--tone) 28%,transparent),transparent 57%),linear-gradient(180deg,color-mix(in srgb,var(--tone) 5%,transparent),transparent 78%)}:where(.content[data-background="eclipse"]) :is(.scene-background,.header-background)::after{width:76%;height:auto;aspect-ratio:1;right:-5%;top:-12%;border-radius:50%;background:radial-gradient(circle at 47% 46%,color-mix(in srgb,var(--ha-card-background,var(--card-background-color,#fff)) 95%,transparent) 0 55%,color-mix(in srgb,var(--tone) 58%,transparent) 57%,color-mix(in srgb,var(--tone) 12%,transparent) 61%,transparent 70%)}
`;

// The backdrop belongs to the header region, never to the entire card or a tab.
// Relative stops follow the header's intrinsic height, including wrapped content.
const headerSceneStyles=`
.header-region{position:relative;isolation:isolate;margin:calc(-1 * var(--eleven-card-padding,16px)) calc(-1 * var(--eleven-card-padding,16px)) 0;padding:var(--eleven-card-padding,16px) var(--eleven-card-padding,16px) 0}
.header-region>.header-scene,.header-region>.scene{margin:0;padding-left:0;padding-right:0;padding-top:0;padding-bottom:12px;isolation:auto;overflow:visible}
.header-region>.header-background,.header-region>.scene-background{position:absolute;inset:0;z-index:-1;overflow:hidden;pointer-events:none;opacity:var(--header-background-opacity,1);
--header-fade:linear-gradient(180deg,#000 0%,#000 25%,rgba(0,0,0,.9) 40%,rgba(0,0,0,.65) 55%,rgba(0,0,0,.32) 72%,rgba(0,0,0,.08) 88%,transparent 100%);
-webkit-mask-image:var(--header-fade);mask-image:var(--header-fade)}
`;


// Domain-neutral SVG renderer. Adapters own data, geometry, colors and annotations.
function graphLineStyle(style, width = 3.5) {
  return {style, width, dash: style === 'dashed' ? '8 7' : style === 'dotted' ? '1 7' : 'none', cap: style === 'dashed' ? 'butt' : 'round'};
}
const graphAttribute = value => String(value).replace(/[&"<>]/g, c => ({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]));
class SharedGraph {
  static hoverGroup(host) {
    return host._config?.sync_hover === false ? null : (host._config?.hover_sync_group?.trim() || 'default');
  }
  static hoverState() {
    const key = Symbol.for('eleven-cards.hover-sync.v1');
    const target = globalThis.window ?? globalThis;
    return target[key] ??= new Map();
  }
  static connectHover(host, receive) {
    this.disconnectHover(host);
    host._receiveSharedHover = receive;
    host._sharedHoverListener = event => {
      const {source, group, timestamp} = event.detail;
      if (source !== host && host.isConnected && group === this.hoverGroup(host)) receive(timestamp);
    };
    window.addEventListener('eleven-cards:hover-sync', host._sharedHoverListener);
    // Scroll does not cross shadow roots: listen in every enclosing tree.
    host._sharedScrollTargets = [window];
    for (let root = host.getRootNode?.(); root && root !== window; root = root.host?.getRootNode()) {
      host._sharedScrollTargets.push(root);
    }
    host._sharedScrollListener = event => {
      if (event?.composedPath?.().some(node => node?.classList?.contains('tooltip'))) return;
      host._hideTooltip();
    };
    for (const target of host._sharedScrollTargets) target.addEventListener('scroll', host._sharedScrollListener, true);
    window.addEventListener('resize', host._sharedScrollListener);
  }
  static tooltipInView(host) {
    const chart = host.shadowRoot?.querySelector('.chart');
    const box = chart?.getBoundingClientRect?.();
    if (!box) return true;
    const bottom = box.bottom ?? box.top + box.height, right = box.right ?? box.left + box.width;
    if (bottom <= 0 || right <= 0 || box.top >= (window.innerHeight ?? Infinity) || box.left >= (window.innerWidth ?? Infinity)) return false;
    // Respect nested scrolling/clipping containers, including HA's shadow trees.
    for (let node = host; node; node = node.parentElement ?? node.getRootNode?.().host) {
      if (!node.getBoundingClientRect || !globalThis.getComputedStyle) continue;
      const style = getComputedStyle(node), clipX = /auto|scroll|hidden|clip/.test(style.overflowX), clipY = /auto|scroll|hidden|clip/.test(style.overflowY);
      if (!clipX && !clipY) continue;
      const bounds = node.getBoundingClientRect();
      if ((clipY && (bottom <= bounds.top || box.top >= bounds.bottom)) || (clipX && (right <= bounds.left || box.left >= bounds.right))) return false;
    }
    return true;
  }
  static tooltipStyles() {
    return uiSurfaceStyles('.tooltip')+`.tooltip{position:absolute;z-index:4;box-sizing:border-box;min-width:0;max-width:calc(100% - 8px);padding:12px;border:0;border-radius:8px;color:var(--primary-text-color,#20252b);background:var(--ha-card-background,var(--card-background-color,#fff));font-size:12px;line-height:1.5;font-variant-numeric:tabular-nums;overflow:auto;overflow-wrap:anywhere;pointer-events:none}.tooltip[hidden]{display:none}.tooltip strong{display:block;margin-bottom:10px;font-size:12px;font-weight:600;white-space:normal}.tooltip span{display:grid;grid-template-columns:7px minmax(0,1fr);column-gap:7px;padding:5px 0;white-space:normal;align-items:baseline}.tooltip i{display:block;width:7px;height:7px;border:0;border-radius:2px;background:var(--series-color)}.tooltip b{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;font-weight:400;min-width:0;overflow-wrap:anywhere}.tooltip .tooltip-label{font-style:normal;color:var(--secondary-text-color,#9ca3af)}.tooltip .tooltip-value{font-weight:600;color:var(--primary-text-color,#20252b);font-style:normal;text-align:right;white-space:normal;overflow-wrap:anywhere}.tooltip small{display:block;grid-column:2;color:var(--secondary-text-color,#666);font-size:10px;white-space:normal;font-variant-numeric:tabular-nums}`;
  }
  static yGrid(axes, height = 300, width = 1000) {
    const positions = new Map();
    for (const axis of axes) for (const value of axis.ticks) {
      const y = Number(((axis.max - value) / (axis.max - axis.min) * height).toFixed(6));
      positions.set(y, positions.get(y) || value === 0);
    }
    return `<g class="y-grid" aria-hidden="true" pointer-events="none">${[...positions].map(([y,zero])=>`<line class="y-grid-line" x1="0" x2="${width}" y1="${y}" y2="${y}" stroke="var(--divider-color,#ddd)" stroke-width="0.8" stroke-opacity="${zero ? 1 : .65}" vector-effect="non-scaling-stroke"/>`).join('')}</g>`;
  }
  static publishHover(host, timestamp) {
    const group = this.hoverGroup(host);
    if (!group || !host.isConnected || !Number.isFinite(timestamp)) return;
    this.hoverState().set(group, {source: host, timestamp});
    window.dispatchEvent(new CustomEvent('eleven-cards:hover-sync', {detail: {source: host, group, timestamp}}));
  }
  static clearHover(host) {
    for (const [group, active] of this.hoverState()) {
      if (active.source !== host) continue;
      this.hoverState().delete(group);
      window.dispatchEvent(new CustomEvent('eleven-cards:hover-sync', {detail: {source: host, group, timestamp: null}}));
    }
  }
  static hoverSourceInEvent(host, event) {
    const active = this.hoverState().get(this.hoverGroup(host));
    return Boolean(active && event.composedPath().includes(active.source));
  }
  static restoreHover(host) {
    if (!host.isConnected) return;
    const active = this.hoverState().get(this.hoverGroup(host));
    if (active && host.isConnected) host._receiveSharedHover?.(active.timestamp);
  }
  static disconnectHover(host) {
    this.clearHover(host);
    if (host._sharedHoverListener) globalThis.window?.removeEventListener('eleven-cards:hover-sync', host._sharedHoverListener);
    for (const target of host._sharedScrollTargets ?? []) target.removeEventListener('scroll', host._sharedScrollListener, true);
    globalThis.window?.removeEventListener('resize', host._sharedScrollListener);
    host._sharedScrollTargets = [];
    host._sharedScrollListener = null;
    host._sharedHoverListener = null;
    host._receiveSharedHover = null;
  }
  static interpolation(value, fallback = 'smooth') {
    const mode = value == null || value === '' ? fallback : value;
    if (!['smooth', 'linear', 'step'].includes(mode)) throw new Error('line_interpolation');
    return mode;
  }
  static path(points, mode = 'smooth', end) {
    mode = this.interpolation(mode);
    let path = '', previous = null;
    for (const [x, y] of points) {
      if (!Number.isFinite(y)) {
        if (previous && end !== undefined) path += ` H ${x}`;
        previous = null;
        continue;
      }
      if (!previous) path += `${path ? ' ' : ''}M ${x} ${y}`;
      else if (mode === 'linear') path += ` L ${x} ${y}`;
      else if (mode === 'step') path += ` H ${x} V ${y}`;
      else {
        const middle = (previous[0] + x) / 2;
        path += ` C ${middle} ${previous[1]}, ${middle} ${y}, ${x} ${y}`;
      }
      previous = [x, y];
    }
    if (previous && end !== undefined) path += ` H ${end}`;
    return path;
  }
  render(host, {viewBox, defs = '', before = '', after = '', fills = [], lines = []}) {
    const previous = host.shadowRoot.querySelector('.chart-enter')?.getAnimations?.().find(a => a.animationName === 'chart-reveal' && a.playState !== 'finished' && Number(a.currentTime ?? 0) < 650);
    this.progress = Number(previous?.currentTime ?? 0);
    this.entering = Boolean(host.isConnected && (!this.loaded || previous) && lines.some(p => p.d));
    if (host.isConnected && lines.some(p => p.d)) this.loaded = true;
    const areas = fills.filter(p => p.d).map(p => `<path d="${graphAttribute(p.d)}" class="${graphAttribute(p.className)}"${p.fill ? ` fill="${graphAttribute(p.fill)}"` : ''}${p.opacity != null ? ` fill-opacity="${p.opacity}"` : ''}${p.mask ? ` mask="${graphAttribute(p.mask)}"` : ''}/>`).join('');
    const paths = lines.filter(p => p.d).map(p => {
      const a = p.appearance;
      const stroke = p.inlineStyle ? `style="stroke:${graphAttribute(a.stroke)};stroke-width:${a.width};stroke-dasharray:${a.dash};stroke-linecap:${a.cap}"` : `stroke="${graphAttribute(a.stroke)}" stroke-width="${a.width}" stroke-dasharray="${a.dash}" stroke-linecap="${a.cap}"`;
      return `<path d="${graphAttribute(p.d)}" class="${graphAttribute(p.className)}"${p.entity ? ` data-entity="${graphAttribute(p.entity)}"` : ''} ${stroke}/>`;
    }).join('');
    return `<svg viewBox="${viewBox}" preserveAspectRatio="none" aria-hidden="true">${defs}${before}<g class="chart-series${this.entering ? ' chart-enter' : ''}">${areas}${paths}</g>${after}</svg>`;
  }
  restore(host) {
    if (this.entering && this.progress > 0) {
      const animation = host.shadowRoot.querySelector('.chart-enter')?.getAnimations?.().find(a => a.animationName === 'chart-reveal');
      if (animation) animation.currentTime = this.progress;
    }
  }
}
function graphStyles() {
  return `
      .price-line, .series-line { fill: none; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
      .chart-enter { animation: chart-reveal 650ms cubic-bezier(0.22, 1, 0.36, 1) both; }
      @keyframes chart-reveal {
        from { clip-path: inset(0 100% 0 0); }
        to { clip-path: inset(0 0 0 0); }
      }
      .hover-dot { position: absolute; z-index: 2; width: 12px; height: 12px; box-sizing: border-box; border: 3px solid; border-radius: 50%; transform: translate(-50%, -50%); background: var(--card-background-color); pointer-events: none; }
      @media (prefers-reduced-motion: reduce) { .chart-enter { animation: none; } }
  `;
}




// Selectable header backgrounds; colors describe charging state independently of design.
const EVCC_BACKGROUNDS=HEADER_BACKGROUNDS;
const evccBackgroundStyles = `
 .content{--tone-charging:#896400;--tone-planned:#4455ad;--tone-waiting:#386c9b;--tone-done:#277441;--tone-off:#656975;--tone-disconnected:#616b79;--tone-unknown:#777d87;--tone:var(--tone-unknown);--evcc-glow:var(--tone);--status-accent:var(--tone)}
 .content[data-theme=dark]{--tone-charging:#f2c451;--tone-planned:#8fa5ff;--tone-waiting:#82b8e8;--tone-done:#7ed79c;--tone-off:#a7a9b2;--tone-disconnected:#9199a5;--tone-unknown:#858992}
 .content[data-tone=charging]{--tone:var(--tone-charging)}.content[data-tone=planned]{--tone:var(--tone-planned)}.content[data-tone=waiting]{--tone:var(--tone-waiting)}.content[data-tone=done]{--tone:var(--tone-done)}.content[data-tone=off]{--tone:var(--tone-off)}.content[data-tone=disconnected]{--tone:var(--tone-disconnected)}.content[data-tone=unknown]{--tone:var(--tone-unknown)}
 .content[data-tone]{--evcc-glow:var(--tone);--status-accent:var(--tone)}
 ha-card{overflow:hidden}.header-scene{position:relative;isolation:isolate;overflow:hidden;margin:-16px -16px 0;padding:16px 16px 16px}
 .gallery-top{margin:0;padding:0;background:none;border:0}.header-scene .status-line{position:relative;margin:16px 0 0;background:var(--secondary-background-color,#eee);border:0;box-shadow:none}

 .header-background::before,.header-background::after{content:'';position:absolute;pointer-events:none;z-index:-1}
 header{position:relative;z-index:1}header h2{color:color-mix(in srgb,var(--tone) 88%,#fff)}.hero{background:none}.car-stage::before{background:none}.car-stage::after{content:none}
 .content[data-tone=disconnected] .header-background::before,.content[data-tone=disconnected] .header-background::after{opacity:.38}
 .content[data-tone=unknown] .header-background::before,.content[data-tone=unknown] .header-background::after{opacity:.16}

${headerBackgroundStyles}
:where(.content[data-background="ribbon"]) .car-stage::after{opacity:.3}
:where(.content[data-background="prism-glass"]) .car-stage::after,:where(.content[data-background="eclipse"]) .car-stage::after{opacity:.2}
${headerAtmosphereStyles}
 .content[data-tone=disconnected] .header-atmosphere{opacity:.38}.content[data-tone=unknown] .header-atmosphere{opacity:.16}

${headerSceneStyles}
`;


// Home Assistant remains the source of truth; unknown values are never zero.
const EVCC_FIELDS = {
 connected: ['Aangesloten', 'Connected', 'binary_sensor'],
 charging: ['Laden', 'Charging', 'binary_sensor'],
 vehicle: ['Auto', 'Vehicle', ['select', 'sensor']],
 soc: ['Accu', 'Battery', 'sensor'],
 target_soc: ['Laaddoel', 'Charge target', ['sensor', 'number']],
 range: ['Actieradius', 'Range', 'sensor'],
 mode: ['Laadmodus', 'Charge mode', ['select', 'sensor']],
 power: ['Laadvermogen', 'Charge power', 'sensor'],
 remaining_duration: ['Resterende laadtijd', 'Time remaining', 'sensor'],
 charged_energy: ['Geladen energie', 'Charged energy', 'sensor'],
 remaining_energy: ['Resterende energie', 'Energy remaining', 'sensor'],
 session_price: ['Sessiekosten', 'Session cost', 'sensor'],
 session_price_per_kwh: ['Gemiddelde laadprijs', 'Average charge price', 'sensor'],
 solar_percentage: ['Zonne-aandeel sessie', 'Session solar share', 'sensor'],
 solar_share: ['Solar share', 'Solar share', 'number'],
 charge_duration: ['Laadduur', 'Charge duration', 'sensor'],
 current: ['Laadstroom', 'Charge current', 'sensor'],
 phases: ['Actieve fasen', 'Active phases', 'sensor'],
 pv_action: ['Zonneladen: actie', 'Solar charging: action', 'sensor'],
 pv_remaining: ['Zonneladen: wachttijd', 'Solar charging: delay', 'sensor'],
 vehicle_limit_soc: ['Acculimiet auto', 'Vehicle charge limit', 'sensor'],
 co2: ['CO₂-uitstoot sessie', 'Session CO₂ intensity', 'sensor'],
 enabled: ['Laden vrijgegeven', 'Charging enabled', 'binary_sensor'],
 smart_cost_active: ['Slim laden actief', 'Smart charging active', 'binary_sensor'],
 plan_active: ['Laadplanning actief', 'Charging plan active', 'binary_sensor'],
};

// Stable ha-evcc keys, independent of translated friendly names. Order is
// intentional: effective targets take precedence over configured limits.
const EVCC_KEYS = {
 connected: ['connected'], charging: ['charging'], vehicle: ['vehicle_name'],
 soc: ['vehicle_soc'], target_soc: ['effective_limit_soc', 'limit_soc'],
 range: ['vehicle_range'], mode: ['mode'], power: ['charge_power'],
 remaining_duration: ['charge_remaining_duration'], charged_energy: ['charged_energy'],
 remaining_energy: ['charge_remaining_energy'], session_price: ['session_price'],
 session_price_per_kwh: ['session_price_per_kwh'], solar_percentage: ['session_solar_percentage'],
 solar_share: ['solar_share'],
 charge_duration: ['charge_duration'], current: ['charge_current'], phases: ['phases_active'],
 pv_action: ['pv_action_value', 'pv_action'], pv_remaining: ['pv_remaining'],
 vehicle_limit_soc: ['vehicle_limit_soc'], co2: ['session_co2_per_kwh'],
 enabled: ['enabled'], smart_cost_active: ['smart_cost_active'],
 plan_active: ['plan_active'],
};

function normalizeEvccConfig(input = {}) {
 if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Invalid EVCC configuration / Ongeldige EVCC-configuratie');
 if (input.entities != null && (typeof input.entities !== 'object' || Array.isArray(input.entities))) throw Error('Invalid entities / Ongeldige entiteiten');
 const config = {...input, type: input.type || 'custom:eleven-car-card', entities: {...input.entities}};
 config.compact = (input.compact??(input.density==='compact')) === true;
 config.animate_background = input.animate_background !== false;
 config.background_strength=input.background_strength==null||!Number.isFinite(Number(input.background_strength))?100:Math.max(0,Math.min(100,Number(input.background_strength)));
 config.background = input.background || 'lanes';
 if (!EVCC_BACKGROUNDS.some(option => option.value === config.background)) throw Error('Invalid background / Ongeldige achtergrond');
 for (const key of ['show_plan', 'vehicle_id', 'config_entry_id', 'schedule_script', 'vehicle_name']) delete config[key];
 const imageScale = input.image_scale == null || input.image_scale === '' ? 100 : Number(input.image_scale);
 if (!Number.isFinite(imageScale) || imageScale < 50 || imageScale > 300) throw Error('Image size must be between 50 and 300% / Afbeeldingsgrootte moet tussen 50 en 300% liggen');
 config.image_scale = imageScale;
 const imageOffsetY = input.image_offset_y == null || input.image_offset_y === '' ? 0 : Number(input.image_offset_y);
 if (!Number.isFinite(imageOffsetY) || imageOffsetY < -150 || imageOffsetY > 150) throw Error('Image vertical position must be between -150 and 150 px / Verticale positie moet tussen -150 en 150 px liggen');
 config.image_offset_y = imageOffsetY;
 for (const key of ['plan_time', 'plan_soc', 'plan_start', 'plan_end']) delete config.entities[key];
 for (const [key, domains] of [['entity', 'sensor'], ['image_entity', 'image'], ...Object.entries(EVCC_FIELDS).map(([key, value]) => [key, value[2]])]) {
  const value = ['entity', 'image_entity'].includes(key) ? input[key] : config.entities?.[key];
  if (value != null && value !== '' && (typeof value !== 'string' || !/^[a-z_]+\.[a-z0-9_]+$/.test(value) || ![domains].flat().includes(value.split('.')[0]))) throw Error(`Invalid entity: ${key} / Ongeldige entiteit: ${key}`);
 }
 for (const key of ['show_session', 'show_details', 'show_controls']) config[key] = input[key] !== false;
 return config;
}

const registryKey = entry => entry?.platform === 'evcc_intg' && entry.unique_id?.startsWith('evcc_intg.') ? entry.unique_id.slice('evcc_intg.'.length) : null;
function evccLoadpoints(hass, registry = []) {
 const ids = new Set(registry.filter(entry => !entry.disabled_by && registryKey(entry)?.endsWith('_charge_power')).map(entry => entry.entity_id));
 for (const id of Object.keys(hass?.states ?? {})) if (/^sensor\..*evcc.*_charge_power$/.test(id)) ids.add(id);
 return [...ids].filter(id => id.startsWith('sensor.') && hass?.states?.[id]).sort();
}

function resolveEvccEntities(config, hass, registry = [], {allowFallback = true} = {}) {
 const states = hass?.states ?? {}, anchor = registry.find(entry => entry.entity_id === config.entity);
 const objectId = registryKey(anchor) ?? config.entity?.split('.')[1];
 const prefix = objectId?.endsWith('_charge_power') ? objectId.slice(0, -'_charge_power'.length) : null;
 const result = {};
 for (const [field, definition] of Object.entries(EVCC_FIELDS)) {
  if (config.entities?.[field]) { result[field] = config.entities[field]; continue; }
  if (!prefix) continue;
  for (const suffix of EVCC_KEYS[field]) {
   for (const domain of [definition[2]].flat()) {
    const matches = registry.filter(entry => !entry.disabled_by && registryKey(entry) === `${prefix}_${suffix}` && entry.entity_id.startsWith(domain + '.') && anchor?.config_entry_id && entry.config_entry_id === anchor.config_entry_id);
    // Do not resolve an ambiguous registry key or fall back to another device.
    if (matches.length > 1) continue;
    // Registry data must establish ownership before a conventional ID is used.
    const id = matches[0]?.entity_id ?? (allowFallback && !registry.length ? `${domain}.${prefix}_${suffix}` : null);
    if (states[id]) { result[field] = id; break; }
   }
   if (result[field]) break;
  }
 }
 if (config.entity && !config.entities?.power) result.power = config.entity;
 return result;
}

// Cache one registry read per connection, shared by card and visual editor.
const evccRegistries = new WeakMap();
function loadEvccRegistry(hass) {
 const connection = hass?.connection ?? hass?.callWS;
 if (!connection || typeof hass?.callWS !== 'function') return Promise.resolve([]);
 if (!evccRegistries.has(connection)) {
  const request = Promise.resolve().then(() => hass.callWS({type: 'config/entity_registry/list'})).catch(() => { evccRegistries.delete(connection); return []; });
  evccRegistries.set(connection, request);
 }
 return evccRegistries.get(connection);
}

function evccBoolean(entity) {
 if (!evccAvailable(entity)) return null;
 if (['on', 'true'].includes(entity.state)) return true;
 if (['off', 'false'].includes(entity.state)) return false;
 return null;
}

function evccStatus(entities, states) {
 const connected = evccBoolean(states[entities.connected]), charging = evccBoolean(states[entities.charging]);
 if (charging === true) return 'charging';
 if (connected === false) return 'disconnected';
 if (connected === true && charging === false) return 'connected';
 return 'unknown';
}

function evccPercent(entity) {
 const number = evccNumber(entity), unit = entity?.attributes?.unit_of_measurement;
 return number != null && number >= 0 && number <= 100 && (!unit || unit === '%') ? number : null;
}

function evccVehicleName(entity) {
 if (!evccAvailable(entity)) return null;
 const value = String(entity.state).trim();
 return /^(?:[-_\s]*(?:none|null|unknown|unavailable)[-_\s]*|not available)$/i.test(value) ? null : (entity.attributes?.vehicle?.name || value);
}

function evccModeOptions(entity) {
 return evccAvailable(entity) && Array.isArray(entity.attributes?.options) ? entity.attributes.options.filter(option => typeof option === 'string' && option.length > 0) : [];
}

function evccSolarRange(entity) {
 if (evccPercent(entity) == null) return null;
 const min = Number(entity.attributes?.min ?? 0), max = Number(entity.attributes?.max ?? 100), step = Number(entity.attributes?.step ?? 10);
 return Number.isFinite(min) && Number.isFinite(max) && Number.isFinite(step) && min >= 0 && max <= 100 && min < max && step > 0 && step <= max - min ? {min, max, step} : null;
}

function evccValidSolarValue(entity, value) {
 const range = evccSolarRange(entity);
 return !!range && typeof value === 'number' && Number.isFinite(value) && value >= range.min && value <= range.max && Math.abs((value - range.min) / range.step - Math.round((value - range.min) / range.step)) < 1e-6;
}

function formatEvccValue(field, entity, hass) {
 if (!evccAvailable(entity)) return null;
 const language = hass?.locale?.language ?? hass?.language ?? 'en', dutch = language.startsWith('nl');
 const unit = entity.attributes?.unit_of_measurement;
 if (['remaining_duration', 'charge_duration'].includes(field)) return evccDuration(entity, language) ?? (evccNumber(entity) != null && evccNumber(entity) >= 0 ? `${entity.state}${unit ? ' ' + unit : ''}` : null);
 if (field === 'pv_remaining' && entity.attributes?.device_class === 'timestamp') {
  const time = Date.parse(entity.state);
  if (!Number.isFinite(time) || time <= 0) return null;
  return new Intl.DateTimeFormat(language, {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: hass?.config?.time_zone ?? 'UTC'}).format(time);
 }
 if (['connected', 'charging', 'enabled', 'smart_cost_active', 'plan_active'].includes(field)) {
  const value = evccBoolean(entity);
  return value == null ? null : value ? (dutch ? 'Ja' : 'Yes') : (dutch ? 'Nee' : 'No');
 }
 if (['soc', 'target_soc', 'vehicle_limit_soc', 'solar_percentage', 'solar_share'].includes(field) && evccPercent(entity) == null) return null;
 if (field === 'mode') return ({off: ['Off', 'Off'], pv: ['Zon', 'Solar'], minpv: ['Min + zon', 'Min + solar'], now: ['Snel', 'Fast'], smart: ['Smart', 'Smart']})[entity.state]?.[dutch ? 0 : 1] ?? entity.state;
 const number = evccNumber(entity);
 if (number != null) {
  const converted = field === 'power' && unit === 'W' ? number / 1000 : number;
  const displayUnit = field === 'power' && unit === 'W' ? 'kW' : unit;
  const digits = field === 'session_price_per_kwh' ? 3 : ['soc', 'target_soc', 'solar_percentage', 'solar_share', 'range', 'phases', 'vehicle_limit_soc'].includes(field) ? 0 : 2;
  return new Intl.NumberFormat(language, {maximumFractionDigits: digits, minimumFractionDigits: field === 'session_price' ? 2 : 0}).format(converted) + (displayUnit ? ' ' + displayUnit : '');
 }
 return hass?.formatEntityState?.(entity) ?? entity.state;
}

function evccNumber(entity) {
 const value = entity?.state;
 if (value == null || String(value).trim() === '' || ['unknown', 'unavailable'].includes(value)) return null;
 const number = Number(value);
 return Number.isFinite(number) ? number : null;
}

function evccAvailable(entity) {
 return entity?.state != null && !['unknown', 'unavailable', ''].includes(String(entity.state));
}

function evccDuration(entity, language = 'en') {
 const value = evccNumber(entity);
 if (value == null || value < 0) return null;
 const unit = entity.attributes?.unit_of_measurement;
 const factors = {s: 1, sec: 1, min: 60, h: 3600, ms: .001};
 if (!(unit in factors)) return null;
 const minutes = Math.round(value * factors[unit] / 60);
 const hours = Math.floor(minutes / 60);
 return hours ? `${hours} ${language.startsWith('nl') ? 'u' : 'h'} ${minutes % 60} min` : `${minutes} min`;
}

// Image entities expose a tokenized entity_picture; never embed credentials or
// manufacture an unauthenticated /api/image_proxy URL.
function evccImageUrl(entity, hass) {
 if (!evccAvailable(entity)) return null;
 const picture = entity.attributes?.entity_picture;
 if (typeof picture !== 'string' || !picture.trim()) return null;
 if (picture.startsWith('/') && !picture.startsWith('//')) return hass?.hassUrl ? hass.hassUrl(picture) : picture;
 try {
  const url = new URL(picture);
  return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
 } catch { return null; }
}


function evccSeconds(entity) {
 const number = evccNumber(entity), factor = {s: 1, sec: 1, min: 60, h: 3600, ms: .001}[entity?.attributes?.unit_of_measurement];
 return number != null && number >= 0 && factor != null ? number * factor : null;
}
function evccPvSeconds(entity, now) {
 if (!evccAvailable(entity)) return null;
 if (entity.attributes?.device_class === 'timestamp') {
  const deadline = Date.parse(entity.state);
  return Number.isFinite(deadline) && deadline > 0 ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
 }
 return evccSeconds(entity);
}
function evccChargingView(entities, states, {offline = false, dutch = false, now = Date.now()} = {}) {
 const entity = field => states[entities[field]], status = offline ? 'unknown' : evccStatus(entities, states);
 const text = (nl, en) => dutch ? nl : en;
 const result = (kind, title, reason, icon, tone = ({solar:'charging',countdown:'waiting',connected:'off'}[kind] ?? kind)) => ({kind, title, reason, icon, status, tone});
 if (status === 'unknown') return result('unknown', text('Status onbekend', 'Status unknown'), text('Wacht op actuele gegevens van EVCC', 'Waiting for current EVCC data'), 'mdi:help-circle-outline');
 if (status === 'disconnected') return result('disconnected', text('Niet aangesloten', 'Disconnected'), text('Sluit de laadkabel aan om te laden', 'Connect the cable to charge'), 'mdi:ev-plug-type2');
 const soc = evccPercent(entity('soc')), target = evccPercent(entity('target_soc'));
 const mode = entity('mode')?.state, solar = ['pv', 'minpv'].includes(mode);
 const action = String(entity('pv_action')?.state ?? '').toLowerCase();
 const seconds = evccPvSeconds(entity('pv_remaining'), now);
 const clock = seconds != null ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : '';
 if (status !== 'charging' && soc != null && target > 0 && soc >= target) return result('done', text('Laaddoel bereikt', 'Charge target reached'), text('Auto aangesloten · laden voltooid', 'Vehicle connected · charging complete'), 'mdi:check-circle-outline');
 if (mode === 'off' && status !== 'charging') return result('connected', text('Laden uitgeschakeld', 'Charging switched off'), text('Laadmodus staat op Off', 'Charge mode is Off'), 'mdi:pause-circle-outline');
 // Only the explicit planActive signal identifies a currently active plan slot.
 // effectivePlanTime / planActiveAlt merely indicate that a plan exists.
 if (status === 'charging' && evccBoolean(entity('plan_active')) === true) return result('charging', text('Laden', 'Charging'), text('Volgens laadplanning', 'According to charging plan'), 'mdi:calendar-clock', 'planned');
 if (seconds > 0 && ((action === 'enable' && status !== 'charging') || (action === 'disable' && status === 'charging'))) {
  const enabling = action === 'enable';
  return result(enabling ? 'countdown' : (solar ? 'solar' : 'charging'), text(enabling ? 'Wachten op laden' : 'Laden', enabling ? 'Waiting to charge' : 'Charging'), text(enabling ? `Start over ${clock}` : `Stopt over ${clock}`, enabling ? `Starts in ${clock}` : `Stops in ${clock}`), 'mdi:timer-outline');
 }
 if (status === 'charging') return result(solar ? 'solar' : 'charging', text('Laden', 'Charging'), text('EVCC regelt het laden', 'EVCC controls charging'), 'mdi:lightning-bolt');
 if (['smart','now','pv','minpv'].includes(mode)) return result('waiting', text('Wachten op laden', 'Waiting to charge'), text('Auto aangesloten · laden nog niet gestart', 'Vehicle connected · charging has not started'), 'mdi:timer-sand');
 return result('connected', text('Aangesloten · laadt niet', 'Connected · not charging'), text('Wacht op vrijgave of de auto', 'Waiting for charging permission or the vehicle'), 'mdi:pause-circle-outline');
}
function evccFinishTime(entity, view, hass, observedAt, now) {
 const seconds = evccSeconds(entity);
 if (!['solar', 'charging'].includes(view.kind) || view.status !== 'charging' || seconds == null || seconds <= 0) return null;
 const reported = Date.parse(entity?.last_updated), base = Number.isFinite(reported) ? reported : observedAt;
 const end = base + seconds * 1000;
 if (!Number.isFinite(end) || end <= now) return null;
 return new Intl.DateTimeFormat(hass.locale?.language ?? hass.language ?? 'en', {hour: '2-digit', minute: '2-digit', timeZone: hass.config?.time_zone ?? 'UTC'}).format(end);
}
function evccEnergySplit(energy, percentage) {
 const amount = evccNumber(energy), share = evccPercent(percentage), unit = energy?.attributes?.unit_of_measurement;
 if (amount == null || amount < 0 || share == null || !['Wh', 'kWh'].includes(unit)) return null;
 const total = amount / (unit === 'Wh' ? 1000 : 1), solar = total * share / 100;
 return {solar, other: total - solar};
}



// Close each known interval independently so Recorder gaps remain empty.
function evccHistoryArea(points, baseline) {
 const areas = []; let segment = [];
 const close = () => {
  if (segment.length > 1) areas.push(`${SharedGraph.path(segment, 'step')} L ${segment.at(-1)[0]} ${baseline} H ${segment[0][0]} Z`);
  segment = [];
 };
 for (const point of points) { if (Number.isFinite(point[1])) segment.push(point); else close(); }
 close(); return areas.join(' ');
}

function evccSessionWindow(response, id, now) {
 if (!Array.isArray(response?.[0])) return null;
 const rows = response[0].filter(row => !row.entity_id || row.entity_id === id).map(row => ({time: Date.parse(row.last_changed ?? row.last_updated), state: row.state})).filter(row => Number.isFinite(row.time) && row.time > 0 && row.time <= now).sort((a,b) => a.time-b.time);
 let start = null, end = null, previous;
 for (const row of rows) {
  if (['on','true'].includes(row.state)) {
   if (previous !== true) { start = row.time; end = null; }
   previous = true;
  } else if (['off','false'].includes(row.state)) {
   if (previous === true && start != null) end = row.time;
   previous = false;
  } else { start = null; end = null; previous = undefined; }
 }
 if (start == null) return null;
 const finish = previous === true ? now : end;
 return finish > start ? {start, end: finish, active: previous === true} : null;
}

function evccHistoryPoints(response, id, unit, start, end) {
 if (!['W', 'kW'].includes(unit) || !Array.isArray(response) || !Array.isArray(response[0])) return [];
 const values = response[0].filter(item => !item.entity_id || item.entity_id === id).map(item => {
  const time = Date.parse(item.last_updated ?? item.last_changed), raw = item.state;
  const value = raw != null && String(raw).trim() !== '' && Number.isFinite(Number(raw)) && Number(raw) >= 0 ? Number(raw) / (unit === 'W' ? 1000 : 1) : null;
  return {time, value};
 }).filter(item => Number.isFinite(item.time) && item.time <= end).sort((a, b) => a.time - b.time);
 const previous = values.filter(item => item.time <= start).at(-1), points = values.filter(item => item.time > start);
 if (previous) points.unshift({...previous, time: start});
 if (points.length && points.at(-1).time < end) points.push({...points.at(-1), time: end});
 return points;
}
const evccHistoryMethods = {
 _resetHistory() {
  this._historyVersion = (this._historyVersion || 0) + 1; this._historyKey = null; this._historyConnectionKey = null; this._historySession = null; this._historyMissingSession = false; this._historyData = []; this._historyLoading = false; this._historyError = false; this._historyRequestedAt = 0; this._historyIndex = null;
 },
 _syncHistory() {
  if (!this.isConnected || this._offline() || !this._config?.show_session || this._activeTab !== 'session') return;
  const id = this._entities.power, unit = this._hass.states?.[id]?.attributes?.unit_of_measurement;
  const key = `${id}|${unit}`;
  const connectedId = this._entities.connected, connected = this._hass.states?.[connectedId];
  const connectionKey = `${connectedId}|${connected?.state}|${connected?.last_changed}`;
  if (this._historyKey !== key || this._historyConnectionKey !== connectionKey) { this._resetHistory(); this._historyKey = key; this._historyConnectionKey = connectionKey; }
  if (!id || !['W', 'kW'].includes(unit) || typeof this._hass.callApi !== 'function' || this._historyLoading || Date.now() - this._historyRequestedAt < 60000) return;
  const version = this._historyVersion, now = Date.now();
  this._historyRequestedAt = now; this._historyLoading = true; this._historyRevision = (this._historyRevision || 0) + 1;
  const request = (entity, start, end, significant = '0') => {
   const params = new URLSearchParams({filter_entity_id: entity, end_time: new Date(end).toISOString(), minimal_response: '', no_attributes: '', significant_changes_only: significant});
   return this._hass.callApi('GET', `history/period/${encodeURIComponent(new Date(start).toISOString())}?${params}`);
  };
  let timeout;
  const load = async () => {
   let session = this._historySession;
   if (!session && connectedId) {
    // Connection history includes pauses and survives reopening the dashboard.
    session = evccSessionWindow(await request(connectedId, 0, now, '1'), connectedId, now);
    if (version !== this._historyVersion) return;
    const changed = Date.parse(connected?.last_changed);
    // Recorder can lag behind the current connection state. Do not cache a
    // previous session as the new one, or extend an unplugged session to now.
    let recorderCurrent = true;
    if (['on','true'].includes(connected?.state) && session && (!session.active || changed > session.start)) { session = null; recorderCurrent = false; }
    if (!session) recorderCurrent = false;
    if (!session && ['on','true'].includes(connected?.state) && changed > 0 && changed < now) session = {start: changed, end: now, active: true};
    // A newer live disconnect means Recorder has not stored the latest cycle.
    // Its start is unknown: wait for discovery instead of caching an older end.
    if (['off','false'].includes(connected?.state) && session && !session.active && changed > session.end && changed <= now) {
     session = null; recorderCurrent = false;
    }
    if (['off','false'].includes(connected?.state) && session?.active) {
     session = changed > session.start && changed <= now ? {...session, end: changed, active: false} : null;
     recorderCurrent = false;
    }
    // Provisional live-state windows must retry Recorder discovery.
    this._historySession = recorderCurrent ? session : null;
   }
   if (!session) return {points: [], range: null};
   const start = session.start, end = session.active ? now : session.end;
   const response = await request(id, start, end);
   return {points: evccHistoryPoints(response, id, unit, start, end), range: {start, end}};
  };
  Promise.race([Promise.resolve().then(load), new Promise((_, reject) => { timeout = setTimeout(() => reject(Error('history timeout')), 10000); })]).then(result => {
   if (version !== this._historyVersion) return;
   this._historyData = result.points; this._historyRange = result.range; this._historyMissingSession = !result.range; this._historyError = false;
  }).catch(() => { if (version === this._historyVersion) { this._historyError = true; this._historyData = []; } }).finally(() => {
   clearTimeout(timeout);
   if (version !== this._historyVersion) return;
   this._historyLoading = false; this._historyRevision++; this._render();
  });
  this._render();
 },
 _historyMarkup(dutch) {
  if (!this._entities.power) return '';
  const title = dutch ? 'Laadverloop' : 'Charging power';
  const points = this._historyData ?? [];
  if (!points.some(point => point.value != null)) return `<div class="history"><div class="chart-head"><span>${title}</span><span>kW</span></div><p class="notice">${this._historyLoading ? (dutch ? 'Laadverloop laden…' : 'Loading charge history…') : this._historyMissingSession ? (dutch ? 'Sessiebegin niet beschikbaar. Controleer de historie van de aangesloten-sensor.' : 'Session start unavailable. Check the connection sensor history.') : (dutch ? 'Geen vermogenshistorie beschikbaar.' : 'No power history available.')}</p></div>`;
  const {start, end} = this._historyRange, max = Math.max(2, Math.ceil(points.reduce((maximum, p) => Math.max(maximum, p.value ?? 0), 0) / 2) * 2);
  const x = time => 38 + (time - start) / (end - start) * 256, y = value => value == null ? NaN : 100 - value / max * 88;
  const graph = this._historyGraph ??= new SharedGraph();
  const coordinates = points.map(p => [x(p.time), y(p.value)]);
  const svg = graph.render({shadowRoot: this.shadowRoot, isConnected: false}, {viewBox: '0 0 300 120', defs: '<defs><linearGradient id="evcc-power-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--primary-color,#2196f3)" stop-opacity=".22"/><stop offset="100%" stop-color="var(--primary-color,#2196f3)" stop-opacity="0"/></linearGradient></defs>', before: '<path class="grid-line" d="M38 12H294M38 56H294"/><path class="grid-line grid-zero" d="M38 100H294"/>', fills: [{d: evccHistoryArea(coordinates, 100), className: 'power-area', fill: 'url(#evcc-power-fade)'}], lines: [{d: SharedGraph.path(coordinates, 'step'), className: 'series-line', appearance: {...graphLineStyle('solid', 2), stroke: 'var(--primary-color,#2196f3)'}}], after: '<path class="cursor" hidden/>'});
  const format = time => new Intl.DateTimeFormat(this._hass.locale?.language ?? this._hass.language ?? 'en', {...(end-start >= 86400000 ? {day:'numeric',month:'short'} : {}),hour: '2-digit', minute: '2-digit', timeZone: this._hass.config?.time_zone ?? 'UTC'}).format(time);
  this._historyGeometry = {x, y, points};
  return `<div class="history"><div class="chart-head"><span>${title}</span><span>kW</span></div><div class="plot" tabindex="0" role="group" aria-label="${dutch ? 'Laadvermogen. Gebruik links en rechts voor meetpunten.' : 'Charging power. Use left and right for readings.'}">${svg}<span class="point hover-dot" aria-hidden="true" hidden></span>${[max, max / 2, 0].map((value, index) => `<span class="axis-y" style="top:${10 + index * 36.6667}%">${value}</span>`).join('')}<div class="tooltip" hidden><strong></strong><span><i style="--series-color:var(--primary-color)"></i><b>${dutch ? 'Laadvermogen' : 'Charging power'} <em class="tooltip-value"></em></b></span></div></div><div class="chart-axis">${[start, (start + end) / 2, end].map(time => `<span>${uiEscape(format(time))}</span>`).join('')}</div><p class="sr-only chart-readout" aria-live="polite"></p></div>`;
 },
 _bindHistory() {
  const plot = this.shadowRoot.querySelector('.plot');
  if (!plot) return;
  const {points, x, y} = this._historyGeometry, tooltip = plot.querySelector('.tooltip');
  const hide = () => { tooltip.hidden = true; plot.querySelector('.cursor').setAttribute('hidden', ''); plot.querySelector('.point').setAttribute('hidden', ''); };
  const select = index => {
   this._historyIndex = Math.max(0, Math.min(points.length - 1, index));
   const point = points[this._historyIndex];
   if (point.value == null) { hide(); return; }
   const cursor = plot.querySelector('.cursor'), dot = plot.querySelector('.point');
   cursor.removeAttribute('hidden'); dot.removeAttribute('hidden'); cursor.setAttribute('d', `M${x(point.time)} 12V100`); dot.style.left = `${x(point.time) / 300 * 100}%`; dot.style.top = `${y(point.value) / 120 * 100}%`;
   const language = this._hass.locale?.language ?? this._hass.language ?? 'en';
   tooltip.hidden = false; tooltip.querySelector('strong').textContent = new Intl.DateTimeFormat(language, {...(this._historyRange.end-this._historyRange.start >= 86400000 ? {day:'numeric',month:'short'} : {}),hour: '2-digit', minute: '2-digit', timeZone: this._hass.config?.time_zone ?? 'UTC'}).format(point.time);
   tooltip.querySelector('.tooltip-value').textContent = new Intl.NumberFormat(language, {maximumFractionDigits: 2}).format(point.value) + ' kW';
   tooltip.style.left = x(point.time) < 166 ? 'auto' : '38px'; tooltip.style.right = x(point.time) < 166 ? '6px' : 'auto';
   this.shadowRoot.querySelector('.chart-readout').textContent = tooltip.textContent;
  };
  plot.addEventListener('pointermove', event => {
   const rect = plot.getBoundingClientRect(), position = (event.clientX - rect.left) / rect.width * 300;
   select(points.reduce((best, point, index) => Math.abs(x(point.time) - position) < Math.abs(x(points[best].time) - position) ? index : best, 0));
  });
  plot.addEventListener('pointerleave', hide); plot.addEventListener('blur', hide);
  plot.addEventListener('focus', () => select(this._historyIndex ?? points.length - 1));
  plot.addEventListener('keydown', event => {
   const index = this._historyIndex ?? points.length - 1;
   const next = {ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: points.length - 1}[event.key];
   if (event.key === 'Escape') hide();
   if (next != null) { event.preventDefault(); select(next); }
  });
 },
};



const solarDutch = hass => String(hass?.locale?.language ?? hass?.language ?? 'en').startsWith('nl');
function evccSolarHint(value, dutch) {
 if (value == null) return dutch ? 'Instelling niet beschikbaar.' : 'Setting unavailable.';
 if (value === 0) return dutch ? 'Start zodra er zonne-overschot is.' : 'Start as soon as solar surplus is available.';
 if (value === 100) return dutch ? 'Start bij voldoende zonne-overschot voor het minimale laadvermogen.' : 'Start when solar surplus covers the minimum charging power.';
 return dutch ? `Minimaal ${value}% van het minimale laadvermogen uit zonne-overschot.` : `At least ${value}% of the minimum charging power from solar surplus.`;
}

const evccSolarMethods = {
 _cancelSolar() {
  clearTimeout(this._solarTimer); this._solarVersion = (this._solarVersion || 0) + 1;
  this._pendingSolar = null; this._solarDraft = null; this._solarEditing = false;
 },
 _solarValue(value) { return value==null?'\u2014':uiEscape(value)+' <span class="ui-metric-unit">%</span>'; },
 _solarMarkup(dutch) {
  const id = this._entities.solar_share;
  if (!id || !['pv', 'minpv', 'smart'].includes(this._hass.states?.[this._entities.mode]?.state)) return '';
  const entity = this._hass.states?.[id], range = evccSolarRange(entity), current = evccPercent(entity);
  const value = this._pendingSolar?.value ?? this._solarDraft ?? current;
  const disabled = !range || this._offline() || !!this._pendingSolar || typeof this._hass.callService !== 'function';
  const label = dutch ? 'Zonnevoorkeur' : 'Solar preference';
  return `<div class="solar-setting"><dl class="metrics solar-metric"><div><dt><label for="solar-share">${label}</label></dt><dd><output for="solar-share" data-solar-output>${this._config.show_controls ? this._solarValue(value) : this._reading('solar_share', dutch)}</output>${this._config.show_controls ? `<input id="solar-share" type="range" data-solar-share min="${range?.min ?? 0}" max="${range?.max ?? 100}" step="${range?.step ?? 10}" value="${value ?? 0}" aria-label="${label}" aria-valuetext="${uiEscape(value == null ? (dutch ? 'Niet beschikbaar' : 'Unavailable') : value + '%')}" aria-describedby="solar-preference-description"${disabled ? ' disabled' : ''}>` : ''}</dd></div></dl><span id="solar-preference-description" class="sr-only">${dutch ? 'Minimum aandeel zon' : 'Minimum solar share'}</span><p id="solar-hint" class="solar-hint" hidden>${uiEscape(evccSolarHint(value, dutch))}</p>${this._pendingSolar ? `<p class="notice" role="status">${dutch ? 'Solar share instellen…' : 'Setting solar share…'}</p>` : ''}${this._solarError ? `<p class="notice error" role="alert">${uiEscape(this._solarError)}</p>` : ''}</div>`;
 },
 _bindSolar() {
  const input = this.shadowRoot.querySelector('[data-solar-share]');
  if (!input) return;
  const progress = () => input.style.setProperty('--solar-position', ((Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100) + '%');
  progress();
  input.addEventListener('input', progress);
  input.addEventListener('pointerdown', () => { if (!input.disabled) this._solarEditing = true; });
  input.addEventListener('input', () => {
   this._solarDraft = Number(input.value);
   this.shadowRoot.querySelector('[data-solar-output]').innerHTML = this._solarValue(input.value);
   this.shadowRoot.querySelector('.solar-hint').textContent = evccSolarHint(this._solarDraft, solarDutch(this._hass));
   input.setAttribute('aria-valuetext', input.value + '%');
  });
  input.addEventListener('change', () => { this._solarEditing = false; this._changeSolar(Number(input.value)); });
  const release = () => { if (this._solarEditing) { this._solarEditing = false; this._solarDraft = null; this._solarVersion++; this._render(); } };
  input.addEventListener('pointercancel', release);
  input.addEventListener('blur', release);
  // A click without changing the value must also release deferred telemetry.
  input.addEventListener('pointerup', () => { setTimeout(release, 0); });
 },
 async _changeSolar(value) {
  const id = this._entities.solar_share, entity = this._hass.states?.[id];
  if (this._pendingSolar) return;
  this._solarDraft = null;
  if (!this._config.show_controls || this._offline() || !id?.startsWith('number.') || !evccValidSolarValue(entity, value) || typeof this._hass.callService !== 'function') { this._solarVersion++; this._render(); return; }
  if (evccPercent(entity) === value) { this._solarVersion++; this._render(); return; }
  const version = ++this._solarVersion;
  this._pendingSolar = {entity: id, value}; this._solarError = null; this._render();
  this._solarTimer = setTimeout(() => {
   if (this._solarVersion !== version) return;
   this._cancelSolar(); this._solarError = solarDutch(this._hass) ? 'Geen bevestiging van solar share ontvangen. Controleer EVCC voordat je opnieuw probeert.' : 'No solar share confirmation received. Check EVCC before retrying.'; this._render();
  }, 15000);
  try { await this._hass.callService('number', 'set_value', {entity_id: id, value}); }
  catch (error) {
   if (this._solarVersion !== version) return;
   this._cancelSolar(); this._solarError = (solarDutch(this._hass) ? 'Solar share wijzigen mislukt: ' : 'Could not change solar share: ') + (error?.message || error); this._render();
  }
 },
};

// State symbols and battery charging motion shared by the dashboard card and preview.
const paths={
 solar:'<g class="sun-rays"><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></g><circle cx="12" cy="12" r="4"/>',
 charging:'<path d="m13 2-8 12h6l-1 8 9-13h-6z"/>',
 waiting:'<path d="M7 3h10M7 21h10M8 3v5l8 8v5M16 3v5l-8 8v5"/><path d="M10 6h4m-4 12h4"/>',
 countdown:'<circle cx="12" cy="13" r="8"/><path d="M10 2h4m-2 0v3"/><path class="clock-hand" d="M12 13V8"/>',
 connected:'<path d="M8 3v5m8-5v5M6 8h12v4a6 6 0 0 1-12 0zM12 18v4"/>',
 disconnected:'<g class="plug-top"><path d="M8 2v4m8-4v4M6 6h12v3a6 6 0 0 1-12 0z"/></g><g class="plug-bottom"><path d="M9 19h6m-3 0v3"/></g>',
 done:'<path class="check-mark" d="m5 12 4.5 4.5L19 7"/>',
 unknown:'<circle class="dot dot-one" cx="5" cy="12" r="1"/><circle class="dot dot-two" cx="12" cy="12" r="1"/><circle class="dot dot-three" cx="19" cy="12" r="1"/>',
};
function statusSymbol(state){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[state]??paths.unknown}</svg>`;}
function powerMotion(entity,{maxKw=11,speed=1}={}){
 maxKw=Number.isFinite(maxKw)&&maxKw>0?maxKw:11;speed=Number.isFinite(speed)&&speed>0?speed:1;
 const raw=entity?.state,unit=entity?.attributes?.unit_of_measurement;
 const valid=raw!=null&&String(raw).trim()!==''&&Number.isFinite(Number(raw))&&['W','kW'].includes(unit);
 const kw=valid?Math.max(0,Math.min(maxKw,Number(raw)/(unit==='W'?1000:1))):null;
 return {kw,seconds:(12-10*(kw??0)/maxKw)/speed,moving:kw!=null&&kw>0};
}
const galleryStatusStyles=`
 .content{--status-accent:var(--primary-color)}
 .content[data-view=solar],.content[data-view=done]{--status-accent:var(--success-color,#6aaa63)}
 .content[data-view=waiting],.content[data-view=countdown],.content[data-view=unknown]{--status-accent:var(--warning-color,var(--primary-color))}
 .content[data-view=connected]{--status-accent:var(--info-color,#579dd1)}
 .content[data-view=disconnected]{--status-accent:var(--secondary-text-color)}
 .status-line{gap:12px;min-height:0;padding:12px;box-sizing:border-box;align-items:center}.status-line>div:not(.status-symbol){min-width:0}.status-line strong{font-size:13px;line-height:1.4}.status-line p{font-size:11px;line-height:1.4;margin-top:2px}
 .status-symbol{display:grid;place-items:center;position:relative;isolation:isolate;overflow:hidden;flex:0 0 38px;width:38px;height:38px;box-sizing:border-box;border-radius:10px;background:color-mix(in srgb,var(--status-accent) 13%,transparent);color:var(--status-accent)}
 .status-symbol svg{display:block;width:22px;height:22px;position:relative;z-index:1}.status-symbol::after{content:none}
 .car-stage::before{animation:none!important}
 .live-readings{align-items:stretch}.live-readings>div{display:grid;grid-template-rows:auto auto auto;gap:2px;align-content:start;box-sizing:border-box;min-height:0;padding:12px}
 .live-readings .eyebrow{font-size:11px;line-height:1.4;margin:0}.live-readings .live-value{font-size:24px;line-height:1.25;font-weight:650;margin:0;letter-spacing:-.03em}.live-readings .live-sub{font-size:11px;line-height:24px;align-self:stretch;min-height:24px;margin:0}
 @supports(grid-template-rows:subgrid){.live-readings{grid-template-rows:auto auto auto;row-gap:2px}.live-readings>div{grid-row:span 3;grid-template-rows:subgrid}}
 .battery-track{height:12px;border-radius:7px;background:color-mix(in srgb,var(--secondary-background-color) 80%,var(--ha-card-background,var(--card-background-color,#fff)));isolation:isolate}
 .battery-fill{position:relative;overflow:hidden;isolation:isolate;border-radius:7px;background:linear-gradient(180deg,color-mix(in srgb,var(--primary-color,#2196f3) 85%,#fff),var(--primary-color,#2196f3))}
 .target-marker{top:-3px;height:18px;z-index:3;pointer-events:none}
 .battery-fill::before{content:none;position:absolute;inset:0 auto 0 0;width:42%;border-radius:inherit;pointer-events:none;background:linear-gradient(105deg,transparent 0%,#ffffff22 20%,#ffffffbb 43%,#fffffff2 52%,#ffffff88 63%,transparent 100%)}
 @media(prefers-reduced-motion:no-preference){
  .content:is([data-tone=charging],[data-tone=planned]) .battery-fill::before{content:'';animation:battery-sweep var(--power-duration,6s) linear infinite;animation-play-state:var(--power-motion,paused);animation-delay:var(--power-delay,0s)}
 }
 @keyframes battery-sweep{0%{transform:translateX(-110%);opacity:0}8%{opacity:1}90%{opacity:1}100%{transform:translateX(250%);opacity:0}}
 :host([data-motion=paused]) *,:host([data-motion=paused]) ::before,:host([data-motion=paused]) ::after{animation-play-state:paused!important}
`;

const evccGalleryStyles=`
 .gallery-top{position:relative;isolation:isolate;margin:-16px -16px 16px;padding:16px 16px 0;background:linear-gradient(150deg,color-mix(in srgb,var(--evcc-glow) 5%,transparent),color-mix(in srgb,var(--evcc-glow) 5%,transparent) 36%,color-mix(in srgb,var(--evcc-glow) 14%,transparent) 36.2%,color-mix(in srgb,var(--evcc-glow) 4%,transparent) 78%,transparent 78.2%)}
 .hero{position:relative;isolation:isolate;padding:6px 16px 0;margin:0 -16px;background:none}
 .car-name{font-size:11px;text-transform:uppercase;letter-spacing:.12em}.car-stage{display:block;min-height:268px;padding:0}.car-stage::before{inset:50px -16px 0;background:radial-gradient(ellipse at 65% 65%,color-mix(in srgb,var(--evcc-glow) 23%,transparent),transparent 69%)}.car-stage::after{bottom:18px;left:10%;right:2%}
 .battery-row{position:relative;z-index:1;gap:0;pointer-events:none}.battery-row button{pointer-events:auto}.battery-value{font-size:76px;font-weight:500;letter-spacing:-.065em;line-height:1.15}.battery-meta{margin-top:1px}.range,.target{font-size:11px}
 .picture{position:absolute;right:-12px;bottom:0;width:86%;height:145px;min-height:0}.picture img{width:112%;height:145px;margin-left:-12%}.battery-track{height:3px}.hero>.battery-track{margin-top:0}
 .status-line{padding:10px 12px;background:var(--secondary-background-color);border:0;border-radius:7px;margin-bottom:8px}
 .live-readings{gap:16px;border:0;padding:0}.live-readings>div{padding:10px 12px;background:var(--secondary-background-color);border:0;border-radius:7px}.live-value{font-size:24px}
 .mode-options{margin-top:0}.solar-setting{margin-top:16px;padding:12px;background:var(--secondary-background-color);border-radius:7px}.solar-setting-head{gap:10px;align-items:center}.solar-setting-head label{display:flex;align-items:center;gap:9px;min-width:0;font-size:11px}.solar-setting-head ha-icon{--mdc-icon-size:18px;flex:none;padding:7px;border-radius:50%;background:color-mix(in srgb,var(--primary-color) 12%,transparent);color:var(--primary-color)}.solar-title{display:flex;flex-direction:column;gap:1px}.solar-title strong{font-size:11px;font-weight:600;line-height:1.4;color:var(--primary-text-color)}.solar-title small{font-size:10px;line-height:1.4;color:var(--secondary-text-color)}.solar-setting-head output{flex:none;color:var(--primary-color);font-size:18px;font-weight:600;letter-spacing:-.02em;padding:5px 8px;border-radius:6px;background:var(--ha-card-background)}
 input[data-solar-share]{appearance:none;-webkit-appearance:none;height:36px;margin:6px 0 0;background:transparent;--solar-position:60%;--solar-track:color-mix(in srgb,var(--secondary-background-color) 80%,var(--ha-card-background,var(--card-background-color,#fff)));touch-action:pan-y}
 input[data-solar-share]::-webkit-slider-runnable-track{height:12px;border-radius:7px;background:linear-gradient(180deg,color-mix(in srgb,var(--primary-color) 85%,#fff),var(--primary-color)) left / var(--solar-position) 100% no-repeat,var(--solar-track)}
 input[data-solar-share]::-moz-range-track{height:12px;border-radius:7px;background:var(--solar-track)}input[data-solar-share]::-moz-range-progress{height:12px;border-radius:7px;background:linear-gradient(180deg,color-mix(in srgb,var(--primary-color) 85%,#fff),var(--primary-color))}
 input[data-solar-share]::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;box-sizing:border-box;width:16px;height:22px;border-radius:5px;background:var(--ha-card-background,var(--card-background-color,#fff));border:2px solid var(--primary-color);box-shadow:0 1px 3px #0002;margin-top:-5px}
 input[data-solar-share]::-moz-range-thumb{box-sizing:border-box;width:16px;height:22px;border-radius:5px;background:var(--ha-card-background,var(--card-background-color,#fff));border:2px solid var(--primary-color);box-shadow:0 1px 3px #0002}
 .solar-setting-head output{padding:0;border-radius:0;background:transparent;font-variant-numeric:tabular-nums}
 .solar-scale{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:10px;color:var(--secondary-text-color);margin:0 1px 10px;font-variant-numeric:tabular-nums}.solar-scale span:first-child,.solar-scale span:last-child{display:flex;flex-direction:column;gap:1px}.solar-scale span:last-child{text-align:right}.solar-scale b{font-size:10px;font-weight:400;color:var(--primary-text-color)}.solar-hint{line-height:1.5;padding-top:10px;border-top:1px solid var(--divider-color)}
 .solar-setting{padding:0;background:transparent;border:0;border-radius:0}.solar-scale{margin-bottom:0}
 .car-stage{min-height:264px}.session-summary [data-field=solar_percentage]{grid-column:1;grid-row:3}
 @container(max-width:320px){.battery-value{font-size:65px}.car-stage{min-height:246px}.picture{width:94%;height:125px}.picture img{height:125px}}

.plot{height:112px}.solar-title{display:flex;flex-direction:column}.solar-setting [data-solar-output]{color:inherit;flex:none;min-width:52px}.solar-metric{grid-template-columns:minmax(0,1fr)}.solar-metric dd{display:flex;align-items:center;gap:16px}.solar-metric input[data-solar-share]{flex:1;min-width:0;width:0;margin:0}
 /* Zoom the image inside a fixed viewport; scaling must not resize the header. */
 .car-stage{min-height:240px}
 .picture{width:100%;height:auto;top:0;left:0;right:0;bottom:8px;overflow:hidden;z-index:2;pointer-events:none}
 .picture img{position:absolute;inset:auto auto 0 50%;left:calc(50% + var(--evcc-image-offset-x,0px));bottom:calc(-1 * var(--evcc-image-offset-y,0px));margin:0;width:86%;height:145px;max-width:none;max-height:none;min-width:0;min-height:0;object-fit:contain;transform:translateX(-50%) scale(var(--evcc-image-scale,1));transform-origin:center bottom}
 @container(max-width:320px){.car-stage{min-height:222px}.picture img{width:94%;height:125px}}
 /* Share the top row so title and SOC stay aligned, including offline notices. */
 .car-stage{display:grid;grid-template-columns:max-content minmax(0,1fr);column-gap:12px;align-content:start;align-items:start}
 .car-stage .battery-row{grid-column:1;grid-row:1;margin-top:-20px}
 .car-stage header{grid-column:2;grid-row:1;align-self:start;flex-direction:column;align-items:flex-end;justify-content:flex-start;gap:2px;min-width:0;margin:-20px 0 0;padding-top:17px;text-align:right}
 .car-stage header h2{max-width:100%}
 .car-stage header .range{justify-content:flex-end;text-align:right;max-width:100%}
 /* Optical alignment compensates for the larger SOC font's space above its digits. */
 @container(max-width:320px){.car-stage .battery-row,.car-stage header{margin-top:-17px}.car-stage header{padding-top:14px}}
`;





function evccCardStyles() { return `
:host{display:block;min-width:0;height:100%;min-height:0;container-type:inline-size}
ha-card{display:block;height:100%;min-height:0;color:var(--primary-text-color,#20252b);background:var(--ha-card-background,var(--card-background-color,#fff));border-radius:var(--ha-card-border-radius,12px);font:inherit}
.content{height:100%;box-sizing:border-box;padding:var(--eleven-card-padding,16px);overflow:auto;min-height:0;scrollbar-width:thin;--evcc-glow:var(--primary-color,#2196f3);--evcc-glow-strength:20%}
.content[data-view=solar]{--evcc-glow:var(--success-color,#4f8a3c);--evcc-glow-strength:30%}.content[data-view=done]{--evcc-glow:var(--success-color,#4f8a3c);--evcc-glow-strength:12%}.content[data-view=unknown],.content[data-view=disconnected]{--evcc-glow:var(--secondary-text-color,#666);--evcc-glow-strength:5%}
header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px}h2{font-size:18px;line-height:1.25;font-weight:650;margin:0;overflow-wrap:anywhere}
.status{font-size:10px;display:flex;align-items:center;gap:6px;color:var(--secondary-text-color,#666);padding:4px 7px;border-radius:5px;background:var(--secondary-background-color,#eee)}.status::before{content:'';width:5px;height:5px;border-radius:50%;background:currentColor;flex:none}.status[data-state=charging]{color:var(--success-color,#2e7d32)}
.hero{margin:0 0 16px}.car-stage{position:relative;isolation:isolate;display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);align-items:center;min-height:138px;padding:4px 0 12px}.car-stage::before{content:'';position:absolute;z-index:-1;inset:0;background:radial-gradient(ellipse at 66% 60%,color-mix(in srgb,var(--evcc-glow) var(--evcc-glow-strength),transparent),transparent 69%);pointer-events:none}.car-stage::after{content:'';position:absolute;z-index:-1;height:1px;left:38%;right:8%;bottom:12px;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--evcc-glow) 40%,transparent),transparent);pointer-events:none}
.car-name{font-size:12px;font-weight:600;overflow-wrap:anywhere;margin-bottom:2px;line-height:1.4;color:var(--secondary-text-color,#666)}.picture{min-width:0;display:grid;place-items:center;min-height:120px}.picture img{width:112%;max-width:460px;height:132px;margin-left:-10%;object-fit:contain;display:block;filter:drop-shadow(0 10px 7px #0002)}.picture ha-icon{--mdc-icon-size:86px;color:var(--secondary-text-color,#666)}.picture small{text-align:center;color:var(--secondary-text-color,#666);font-size:11px;overflow-wrap:anywhere}
button{font:inherit;color:inherit;cursor:pointer;background:transparent;border:0;padding:0;text-align:start;min-height:24px;max-width:100%;overflow-wrap:anywhere}button:not(:disabled):hover{color:var(--primary-color,#2196f3)}button:focus-visible,.plot:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:2px;border-radius:3px}button:disabled{cursor:default}
.eyebrow{display:block;color:var(--secondary-text-color,#666);font-size:11px;line-height:1.4}.battery-row{display:flex;flex-direction:column;align-items:flex-start;gap:4px;margin:0;min-width:0}.battery-value{font-size:44px;line-height:1.15;font-weight:650;font-variant-numeric:tabular-nums;letter-spacing:-.035em;min-width:0}.battery-meta{min-width:0;max-width:100%;text-align:start}.target,.range{display:flex;align-items:baseline;justify-content:flex-start;flex-wrap:wrap;gap:0 5px;font-size:11px;color:var(--secondary-text-color,#666)}.range>button{font-size:12px;font-weight:600;color:var(--primary-text-color,#20252b)}
.battery-track,.solar-strip{height:5px;background:var(--secondary-background-color,#eee);border-radius:5px;position:relative;margin-right:1px}.battery-fill,.solar-strip span{height:100%;background:var(--primary-color,#2196f3);border-radius:inherit;display:block}.target-marker{position:absolute;top:-3px;height:11px;width:2px;background:var(--primary-text-color,#20252b);transform:translateX(-1px)}
.status-line{display:flex;align-items:center;gap:8px;padding:10px 12px;border-left:2px solid var(--evcc-glow);border-radius:7px;background:linear-gradient(100deg,color-mix(in srgb,var(--evcc-glow) 10%,transparent),transparent);margin-bottom:12px}.status-line ha-icon{--mdc-icon-size:18px;flex:none;color:var(--evcc-glow)}.status-line strong{font-size:14px;font-weight:600}.status-line p{font-size:11px;line-height:1.4;margin:2px 0 0;color:var(--secondary-text-color,#666)}
.live-readings{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.live-readings>div{padding:10px 12px;background:var(--secondary-background-color,#eee);border-radius:7px;min-width:0}.live-value{font-size:24px;font-weight:650;line-height:1.35;font-variant-numeric:tabular-nums;letter-spacing:-.03em}.live-sub{font-size:11px;line-height:1.4;color:var(--secondary-text-color,#666);display:block;overflow-wrap:anywhere}
dl{margin:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.metrics>div{min-width:0}.metrics dt{font-size:11px;color:var(--secondary-text-color,#666);overflow-wrap:anywhere;line-height:1.4;margin-bottom:2px}.metrics dd{margin:0;min-width:0;font-size:18px;font-weight:600;line-height:1.35;letter-spacing:-.02em;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.evcc-tabs{margin-top:16px}.evcc-panel{margin:0;padding:16px 0 0;border:0;min-width:0}.charging-controls{margin:0;padding:0;border:0}.mode-options{display:flex;gap:4px;margin-top:6px}.mode-options [data-ui-button]{flex:1 1 0;min-width:0;width:auto;justify-content:center;text-align:center;padding:6px 3px;min-height:34px;font-size:12px}.mode-options [data-ui-button]:disabled{opacity:.65}.mode-reading{font-size:18px;font-weight:600}
.solar-setting{padding:16px 0 0}.solar-setting-head,.solar-session-head{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:25px;font-size:11px;color:var(--secondary-text-color,#666)}.solar-setting-head output,.solar-session-head>button{font-size:18px;font-weight:600;line-height:1.35;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:var(--primary-text-color,#20252b)}
input[data-solar-share]{display:block;box-sizing:border-box;width:100%;height:28px;margin:4px 0;accent-color:var(--primary-color,#2196f3);cursor:pointer}input[data-solar-share]:disabled{opacity:.45;cursor:default}input[data-solar-share]:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:2px;border-radius:3px}.solar-hint{font-size:11px;line-height:1.4;color:var(--secondary-text-color,#666);margin:0;overflow-wrap:anywhere}
.session{margin:0;padding:0;background:transparent;border:0}.session-summary [data-field=charged_energy]{grid-column:1;grid-row:1}.session-summary [data-field=session_price]{grid-column:2;grid-row:1}.session-summary [data-field=charge_duration]{grid-column:1;grid-row:2}.session-summary [data-field=session_price_per_kwh]{grid-column:2;grid-row:2}.session-details{margin-top:16px;padding-top:12px;border-top:1px solid var(--divider-color,#ddd)}.solar-session{margin:16px 0 0;padding:12px 0 0;border-top:1px solid var(--divider-color,#ddd)}.solar-strip{margin-top:9px;overflow:hidden}.energy-split{margin-top:12px}
.history{margin-top:16px;padding-top:12px;border-top:1px solid var(--divider-color,#ddd)}.chart-head{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11px;line-height:1.4;color:var(--secondary-text-color,#666);margin-bottom:8px}.plot{height:138px;position:relative;touch-action:pan-y;cursor:crosshair}.plot svg{display:block;width:100%;height:100%;overflow:visible}.grid-line{stroke:var(--history-grid-color,var(--divider-color,#ddd));stroke-width:.8;vector-effect:non-scaling-stroke}.grid-zero{stroke-width:1.2}.plot .cursor{stroke:var(--secondary-text-color,#666);stroke-width:1;stroke-dasharray:3 3;vector-effect:non-scaling-stroke}.plot .point{width:10px;height:10px;border:2px solid var(--primary-color,#2196f3);border-radius:50%;background:var(--ha-card-background,var(--card-background-color,#fff))}.plot .tooltip i{border-radius:50%}.axis-y{position:absolute;left:0;transform:translateY(-50%);font-size:11px;line-height:1.2;color:var(--secondary-text-color,#666);font-variant-numeric:tabular-nums;pointer-events:none}.chart-axis{display:flex;justify-content:space-between;padding-left:12.667%;padding-right:2%;margin-top:3px;color:var(--secondary-text-color,#666);font-size:11px;font-variant-numeric:tabular-nums}.history .tooltip{top:4px;max-width:calc(100% - 42px)}
.notice{font-size:12px;line-height:1.5;color:var(--secondary-text-color,#666);margin:8px 0;overflow-wrap:anywhere}.notice.warning{color:var(--warning-color,#9a6700)}.notice.error{color:var(--error-color,#db4437)}.empty{padding:12px 0;line-height:1.5;font-size:13px;color:var(--secondary-text-color,#666)}.sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}[hidden]{display:none!important}
@container(max-width:320px){.picture img{height:112px}.battery-value{font-size:36px}.battery-row{gap:6px}.live-value{font-size:21px}.mode-options [data-ui-button]{font-size:11px}.status-line strong{font-size:12px}}
${evccGalleryStyles}${galleryStatusStyles}${evccBackgroundStyles}
/* Compact density keeps the charging essentials and mode controls. */
.content[data-density=compact] .car-stage{min-height:160px}
.content[data-density=compact] .battery-value{font-size:64px}
.content[data-density=compact] .car-stage .battery-row,.content[data-density=compact] .car-stage header{margin-top:-16px}
.content[data-density=compact] .car-stage header{padding-top:14px}
.content[data-density=compact] .picture img{height:108px}
.content[data-density=compact] .header-scene{padding-bottom:12px}
.content[data-density=compact] .status-line{padding:10px;gap:10px;margin:12px 0 0}
.content[data-density=compact] .status-symbol{flex-basis:32px;width:32px;height:32px;border-radius:8px}
.content[data-density=compact] .live-readings{column-gap:12px}
.content[data-density=compact] .live-readings>div{padding:10px}
.content[data-density=compact] .live-readings .live-value{font-size:22px}
.content[data-density=compact] .live-readings{grid-template-rows:auto auto}
.content[data-density=compact] .live-readings>div{grid-row:span 2;grid-template-rows:auto auto}
.content[data-density=compact] .compact-controls{margin-top:12px}
.content[data-density=compact] .evcc-panel{padding-top:12px}
.content[data-density=compact] .solar-setting{margin-top:12px}
.content[data-density=compact] .metrics{row-gap:12px}
.content[data-density=compact] .history{margin-top:12px;padding-top:10px}
.content[data-density=compact] .plot{height:88px}
@container(max-width:320px){.content[data-density=compact] .car-stage{min-height:150px}.content[data-density=compact] .battery-value{font-size:56px}.content[data-density=compact] .car-stage .battery-row,.content[data-density=compact] .car-stage header{margin-top:-14px}.content[data-density=compact] .car-stage header{padding-top:12px}.content[data-density=compact] .picture img{height:96px}}
${uiPrimaryValueStyles()}${uiMetricStyles()}
.content{--ui-metric-tone:var(--tone)}.charging-status{margin-top:16px}.content[data-density=compact] .charging-status{margin-top:12px}
.charging-readings{margin:0}.car-stage .battery-row{margin-top:0}.car-stage header{margin-top:0;padding-top:8px}.content[data-density=compact] .car-stage .battery-row,.content[data-density=compact] .car-stage header{margin-top:0}.content[data-density=compact] .car-stage header{padding-top:6px}
.header-region .ui-metric-value button{font:inherit;line-height:inherit;letter-spacing:inherit;min-height:0}.header-region .ui-metric-info button{font:inherit;line-height:inherit;min-height:0;vertical-align:baseline}
.hero{padding-top:0}.battery-track,.battery-fill{border-radius:var(--ui-metric-radius,8px)}
.battery-row [data-ui-primary-value]{max-width:160px}
`; }













const evccDutch = hass => String(hass?.locale?.language ?? hass?.language ?? 'en').startsWith('nl');
const evccLabel = (field, dutch) => EVCC_FIELDS[field][dutch ? 0 : 1];
const EVCC_SESSION = ['charged_energy', 'session_price', 'charge_duration', 'session_price_per_kwh', 'solar_percentage'];
const EVCC_DETAILS = ['current', 'phases', 'vehicle_limit_soc', 'connected', 'charging', 'enabled', 'smart_cost_active', 'pv_action', 'pv_remaining'];
// Registry loading shared by the Car editor; public configuration belongs to Car.
class EvccEditor extends HTMLElement {
 constructor(){super();this.attachShadow({mode:'open'});this._registry=[];}
 set hass(hass){
  this._hass=hass;
  const connection=hass?.connection??hass?.callWS;
  if(connection&&connection!==this._connection){
   this._connection=connection;this._registry=[];
   loadEvccRegistry(hass).then(registry=>{if(this._connection===connection){this._registry=registry;this._render();}});
  }
  this._render();
 }
 get hass(){return this._hass;}
}

class EvccCard extends HTMLElement {
 constructor() { super(); this.attachShadow({mode: 'open'}); this._registry = []; this._actionVersion = 0; this._solarVersion = 0; }
 setConfig(config) { this._cancelMode(); this._cancelSolar(); this._actionError = null; this._solarError = null; this._config = normalizeEvccConfig(config); this._signature = null; this._render(); }
 connectedCallback() { this._observeMotion(); this._ensureClock(); this._render(); }
 _observeMotion() { this._motionCleanup?.(); this._motionCleanup=observeCardMotion(this); }
 _ensureClock() {
  if (!this.isConnected || this._clockTimer) return;
  this._clockTimer = setInterval(() => { this._render(); this._syncHistory(); }, 1000);
 }
 set hass(hass) {
  this._hass = hass;
  const connection = hass?.connection ?? hass?.callWS;
  if (connection && connection !== this._connection) {
   this._cancelMode(); this._cancelSolar(); this._resetHistory(); this._connection = connection; this._registry = []; this._registryLoading = true;
   loadEvccRegistry(hass).then(registry => { if (this._connection === connection) { this._registry = registry; this._registryLoading = false; this._render(); } });
  }
  if (this._pendingMode && hass.states?.[this._pendingMode.entity]?.state === this._pendingMode.option) this._cancelMode();
  if (this._pendingSolar && evccPercent(hass.states?.[this._pendingSolar.entity]) === this._pendingSolar.value) this._cancelSolar();
  this._render();
 }
 get hass() { return this._hass; }
 disconnectedCallback() { this._motionCleanup?.(); this._motionCleanup=null; this._cancelMode(); this._cancelSolar(); this._tabController?.disconnect(); clearInterval(this._clockTimer); this._clockTimer = null; this._resetHistory(); this._signature = null; }
 _cancelMode() { clearTimeout(this._modeTimer); this._pendingMode = null; this._actionVersion++; }
 getCardSize() { return this._config?.compact ? 8 : 12; }
 getGridOptions() { return {columns: 12, min_columns: 6, rows: this._config?.compact ? 10 : 12, min_rows: 3}; }
 _value(field) { return formatEvccValue(field, this._hass.states?.[this._entities[field]], this._hass); }
 _metrics(fields, dutch, primary = false) {
  const rows = fields.filter(field => this._entities[field]);
  return rows.length ? `<dl class="metrics${primary ? ' primary' : ''}">${rows.map(field => `<div data-field="${field}"><dt>${uiEscape(evccLabel(field, dutch))}</dt><dd>${this._reading(field, dutch)}</dd></div>`).join('')}</dl>` : '';
 }
 _reading(field, dutch, interactive=true) {
  const value = this._value(field), id = this._entities[field];
  const unavailable = dutch ? 'Niet beschikbaar' : 'Unavailable';
  const entity=this._hass.states?.[id],sourceUnit=entity?.attributes?.unit_of_measurement;
  const unit=field==='power'&&sourceUnit==='W'?'kW':sourceUnit;
  let markup=uiEscape(value??'\u2014');
  if(value!=null&&['remaining_duration','charge_duration'].includes(field)&&evccDuration(entity,dutch?'nl':'en')){
   markup=markup.replace(/(\d+) (u|h|min)\b/g,'$1 <span class="ui-metric-unit">$2</span>');
  }else if(value!=null&&evccNumber(entity)!=null&&unit&&value.endsWith(' '+unit)){
   markup=uiEscape(value.slice(0,-unit.length).trimEnd())+' <span class="ui-metric-unit">'+uiEscape(unit)+'</span>';
  }
  if(!interactive)return id?markup:'\u2014';
  return id ? `<button type="button" data-entity="${uiEscape(id)}" title="${uiEscape(id)}" aria-label="${uiEscape(evccLabel(field, dutch) + ': ' + (value ?? unavailable))}">${markup}${value == null ? `<span class="sr-only"> ${unavailable}</span>` : ''}</button>` : '—';
 }
 _offline() { return this._hass?.connected === false || this._hass?.connection?.connected === false; }
 _modeMarkup(dutch) {
  const id = this._entities.mode, entity = this._hass.states?.[id];
  if (!id) return '';
  const options = id.startsWith('select.') && this._config.show_controls ? evccModeOptions(entity) : [];
  const disabled = this._offline() || !!this._pendingMode || typeof this._hass.callService !== 'function';
  return `<div class="mode">${options.length ? `<div class="mode-options" role="group" aria-label="${evccLabel('mode', dutch)}">${options.filter(option => option !== (entity.state === 'minpv' ? 'pv' : 'minpv') || !options.includes(entity.state === 'minpv' ? 'minpv' : 'pv')).map(option => uiButton({text: ['pv','minpv'].includes(option) ? (dutch ? 'Slim' : 'Smart') : formatEvccValue('mode', {...entity, state: option}, this._hass), variant: 'surface', disabled, attrs: {'data-mode': option, 'aria-pressed': entity.state === option}})).join('')}</div>` : `<div class="mode-reading">${this._reading('mode', dutch)}</div>`}</div>`;
 }
 async _changeMode(option) {
  const id = this._entities.mode, entity = this._hass.states?.[id];
  if (!this._config.show_controls || this._offline() || this._pendingMode || !id?.startsWith('select.') || !evccModeOptions(entity).includes(option) || entity.state === option || typeof this._hass.callService !== 'function') return;
  const version = ++this._actionVersion;
  this._pendingMode = {entity: id, option}; this._actionError = null; this._render();
  this._modeTimer = setTimeout(() => {
   if (this._actionVersion !== version) return;
   this._cancelMode(); this._actionError = evccDutch(this._hass) ? 'Nog geen bevestiging van de laadmodus ontvangen. Controleer EVCC en probeer opnieuw.' : 'No charge mode confirmation received yet. Check EVCC and try again.'; this._render();
  }, 15000);
  try { await this._hass.callService('select', 'select_option', {entity_id: id, option}); }
  catch (error) {
   if (this._actionVersion !== version) return;
   this._cancelMode(); this._actionError = (evccDutch(this._hass) ? 'Laadmodus wijzigen mislukt: ' : 'Could not change charge mode: ') + (error?.message || error); this._render();
  }
 }
 _tabItems(dutch) {
  const items = [];
  const controls = this._config.show_controls ? this._modeMarkup(dutch) + this._solarMarkup(dutch) : '';
  if (controls) items.push({value: 'controls', label: dutch ? 'Bediening' : 'Controls', content: `<div class="charging-controls">${controls}</div>${this._pendingMode ? `<p class="notice" role="status">${dutch ? 'Laadmodus wijzigen…' : 'Changing charge mode…'}</p>` : ''}${this._actionError ? `<p class="notice error" role="alert">${uiEscape(this._actionError)}</p>` : ''}`});

  const session = this._config.show_session ? this._sessionMarkup(dutch) : '';
  if (session) items.push({value: 'session', label: dutch ? 'Laadsessie' : 'Session', content: session});
  if (this._config.show_details && EVCC_DETAILS.some(field => this._entities[field])) items.push({value: 'technical', label: 'EVCC', content: this._metrics(EVCC_DETAILS, dutch)});
  return items;
 }
 _tabsMarkup(dutch) {
  const items = this._tabItems(dutch);
  if (!items.length) return '';
  // Keep the requested tab while uiTabs displays a temporary fallback.
  if (!this._registryLoading && !items.some(item => item.value === this._activeTab)) this._activeTab = items[0].value;
  if(items.length===1)return `<section class="evcc-tabs evcc-panel" aria-label="${uiEscape(items[0].label)}">${items[0].content}</section>`;
  return uiTabs({variant:'card',id: 'evcc', label: dutch ? 'Laadinformatie' : 'Charging information', items, selected: this._activeTab, className: 'evcc-tabs', panelClassName: 'evcc-panel'});
 }
 _sessionMarkup(dutch) {
  const metrics = this._metrics(EVCC_SESSION, dutch);
  if (!metrics && !this._entities.power) return '';
  return `<div class="session" aria-label="${dutch ? 'Laadsessie' : 'Charging session'}"><div class="session-summary">${metrics}</div>${this._historyMarkup(dutch)}</div>`;
 }
 _title(dutch) { return this._config.title || (dutch ? 'Auto laden' : 'EV charging'); }
 _statusMarkup(view) {
  return uiMetric({title:'Status',value:view.title,info:view.reason,iconContent:statusSymbol(view.kind),compact:this._config.compact,attrs:{class:'charging-status',role:'status'}});
 }
 _liveMarkup(dutch, view, now) {
  const duration = this._hass.states?.[this._entities.remaining_duration];
  if (!this._durationObserved || this._durationObserved.entity !== duration) this._durationObserved = {entity: duration, time: now};
  const finish = evccFinishTime(duration, view, this._hass, this._durationObserved.time, now);
  const charging = view.status === 'charging';
  const time = view.kind === 'done' ? (dutch ? 'Bereikt' : 'Reached') : charging ? this._reading('remaining_duration', dutch, false) : '—';
  const hint = finish ? (dutch ? 'Geschat klaar ±' : 'Estimated finish ±') + finish : (view.kind === 'done' ? (dutch ? 'Geen resterende laadtijd' : 'No remaining charge time') : view.status === 'disconnected' ? (dutch ? 'Geen actieve laadsessie' : 'No active charging session') : (dutch ? 'Geen betrouwbare schatting' : 'No reliable estimate'));
  const technical = (this._config.compact ? [] : ['phases', 'current']).filter(field => this._entities[field]).map(field => this._reading(field, dutch) + (field === 'phases' ? (dutch ? ' fasen' : ' phases') : ''));
  return '<div class="charging-readings" data-ui-metric-grid>'+uiMetric({title:evccLabel('power',dutch),valueContent:this._reading('power',dutch,technical.length>0),action:!technical.length&&!!this._entities.power,attrs:!technical.length?{'data-entity':this._entities.power||''}:{},infoContent:technical.join(' &middot; '),icon:'mdi:lightning-bolt-outline',compact:this._config.compact})+uiMetric({title:view.kind==='done'?(dutch?'Laaddoel':'Charge target'):evccLabel('remaining_duration',dutch),valueContent:time,action:charging&&!!this._entities.remaining_duration,attrs:charging?{'data-entity':this._entities.remaining_duration||''}:{},info:this._config.compact?'':hint,icon:'mdi:timer-outline',compact:this._config.compact})+'</div>';
 }

 _render() {
  if (!this._config) return;
  if (!this._hass) { this.shadowRoot.innerHTML = `<style>${evccCardStyles()}</style><ha-card aria-label="${uiEscape(this._title(false))}"><div class="content"><p class="notice">EVCC…</p></div></ha-card>`; return; }
  const hass = this._hass, states = hass.states ?? {}, dutch = evccDutch(hass), config = this._config;
  this._ensureClock();
  const previousSolar = this._entities?.solar_share, previousPower = this._entities?.power;
  this._entities = resolveEvccEntities(config, hass, this._registry, {allowFallback: !this._registryLoading});
  if (previousPower !== this._entities.power) this._resetHistory();
  if (this._historyKey && this._historyKey !== `${this._entities.power}|${states[this._entities.power]?.attributes?.unit_of_measurement}`) this._resetHistory();
  const now = Date.now(), view = evccChargingView(this._entities, states, {offline: this._offline(), dutch, now});
  const offline = hass.connected === false || hass.connection?.connected === false;
  if (previousSolar !== this._entities.solar_share) { this._cancelSolar(); this._solarError = null; }
  if (this._solarEditing) {
   if (!offline && evccSolarRange(states[this._entities.solar_share])) return;
   this._cancelSolar();
  }
  const signature = JSON.stringify([view, this._registryLoading, hass.themes?.darkMode, Math.floor(now / 30000), this._historyRevision, config, this._entities, Object.values(this._entities).map(id => states[id]), states[config.image_entity], hass.locale?.language ?? hass.language, hass.config?.time_zone, offline, this._actionVersion, this._pendingMode, this._actionError, this._solarVersion, this._pendingSolar, this._solarError, typeof hass.callService === 'function', this._extraSignature?.()]);
  if (signature === this._signature) return;
  this._signature = signature;
  const scrollTop = this.shadowRoot.querySelector('.content')?.scrollTop ?? 0;
  const focus = this.shadowRoot.activeElement, focusedEntity = focus?.dataset?.entity, focusedMode = focus?.dataset?.mode, focusedTab = focus?.dataset?.uiTab;
  const focusedSolar = focus?.hasAttribute('data-solar-share'), focusedGraph = focus?.classList?.contains('plot');
  const configured = Object.values(this._entities).some(Boolean), status = offline ? 'unknown' : evccStatus(this._entities, states);
  const vehicle = evccVehicleName(states[this._entities.vehicle]) || (dutch ? 'Elektrische auto' : 'Electric vehicle');
  const soc = evccPercent(states[this._entities.soc]), target = evccPercent(states[this._entities.target_soc]);
  const image = this._vehicleImage ? this._vehicleImage() : evccImageUrl(states[config.image_entity], hass);
  const imageWarning = dutch ? 'Autoafbeelding niet beschikbaar' : 'Vehicle image unavailable';
  this.shadowRoot.innerHTML = `<style>${uiButtonStyles()}${uiTabsStyles()}${graphStyles()}${SharedGraph.tooltipStyles()}${evccCardStyles()}${this._extraStyles?.()??''}</style><ha-card aria-label="${uiEscape(this._title(dutch))}"><div class="content" style="--header-background-opacity:${config.background_strength/100}" data-density="${config.compact ? 'compact' : 'standard'}" data-state="${status}" data-view="${view.kind}" data-tone="${view.tone}" data-theme="${hass.themes?.darkMode ? 'dark' : 'light'}" data-background="${config.background}" data-animated="${config.animate_background&&!offline&&configured&&!['disconnected','unknown'].includes(view.tone)}">
   <div class="header-region"><div class="header-background" aria-hidden="true">${headerAtmosphere(config.background)}</div><div class="header-scene"><div class="gallery-top">${!configured ? `<header><h2>${uiEscape(this._title(dutch))}</h2></header>` : ''}
   ${offline ? `<p class="notice warning" role="status">${dutch ? 'Geen verbinding met Home Assistant. Getoonde waarden zijn de laatst ontvangen gegevens.' : 'Disconnected from Home Assistant. Values shown are the last received readings.'}</p>` : ''}
   ${configured ? `<div class="hero"><div class="car-stage"><div class="battery-row">${uiPrimaryValue({value:soc==null?null:formatEvccValue('soc',states[this._entities.soc],hass).replace(/\s*%$/,''),unit:'%',subtitle:this._entities.range?(this._value('range')??'\u2014')+' '+(dutch?'actieradius':'range'):'',subtitleEntity:this._entities.range||'',entity:this._entities.soc,compact:config.compact,attrs:{class:'battery-value'}})}<div class="battery-meta"></div></div><div class="picture">${image ? `<img src="${uiEscape(image)}" alt="${uiEscape(vehicle)}"><small hidden>${imageWarning}</small>` : `<ha-icon icon="mdi:car-electric" aria-hidden="true"></ha-icon>${(this._hasVehicleImage?.()??config.image_entity) ? `<small>${imageWarning}</small>` : ''}`}</div></div>${soc != null ? `<div class="battery-track" role="progressbar" aria-label="${dutch ? 'Accuniveau' : 'Battery level'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${soc}"><div class="battery-fill" style="width:${soc}%"></div>${target != null ? `<span class="target-marker" style="left:${target}%"></span>` : ''}</div>` : ''}</div>
    </div>${this._statusMarkup(view)}</div>${this._liveMarkup(dutch, view, now)}</div>
    ${this._tabsMarkup(dutch)}` : `<p class="empty">${dutch ? 'Kies de EVCC-laadvermogensensor van je laadpunt in de configuratie. Je kunt ook afzonderlijke entiteiten opgeven.' : 'Select your loadpoint’s EVCC charge power sensor in the editor, or configure individual entities.'}</p>`}
   ${configured ? '' : '</div></div></div>'}</div></ha-card>`;
  const content = this.shadowRoot.querySelector('.content');
  content.style.setProperty('--evcc-image-scale', String(config.image_scale / 100));
  content.style.setProperty('--evcc-image-offset-y', `${config.image_offset_y}px`);
  if (this._motionState !== view.kind || this._motionEntity !== this._entities.power) {
   this._motionState = view.kind; this._motionEntity = this._entities.power; this._powerClock = null;
  }
  const speed = powerMotion(states[this._entities.power], {maxKw: config.animation_max_kw, speed: config.animation_speed}), previous = this._powerClock;
  const moving = !offline && speed.moving && ['solar', 'charging'].includes(view.kind);
  const phase = previous ? previous.phase + (previous.moving ? (now - previous.time) / 1000 / previous.seconds : 0) : 0;
  this._powerClock = {phase, time: now, seconds: speed.seconds, moving};
  content.style.setProperty('--power-duration', speed.seconds + 's');
  content.style.setProperty('--power-delay', -phase * speed.seconds + 's');
  content.style.setProperty('--power-motion', moving ? 'running' : 'paused');
  this.shadowRoot.querySelectorAll('[data-entity]').forEach(button => button.addEventListener('click', () => this.dispatchEvent(new CustomEvent('hass-more-info', {detail: {entityId: button.dataset.entity}, bubbles: true, composed: true}))));
  this.shadowRoot.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => this._changeMode(button.dataset.mode)));
  this._bindSolar(); this._bindHistory();
  this._tabController?.disconnect();
  this._tabController = bindUITabs({tabs: this.shadowRoot.querySelectorAll('[data-ui-tab]'), panels: this.shadowRoot.querySelectorAll('[data-ui-tab-panel]'), onSelect: value => { this._activeTab = value; this._syncHistory(); }});
  const img = this.shadowRoot.querySelector('img');
  if (img) img.onerror = () => { img.hidden = true; img.nextElementSibling.hidden = false; };
  this.shadowRoot.querySelector('.content').scrollTop = scrollTop;
  if (focusedGraph) this.shadowRoot.querySelector('.plot')?.focus({preventScroll: true});
  else if (focusedSolar) this.shadowRoot.querySelector('[data-solar-share]')?.focus({preventScroll: true});
  else if (focusedEntity) [...this.shadowRoot.querySelectorAll('[data-entity]')].find(button => button.dataset.entity === focusedEntity)?.focus({preventScroll: true});
  else if (focusedMode) [...this.shadowRoot.querySelectorAll('[data-mode]')].find(button => button.dataset.mode === focusedMode)?.focus({preventScroll: true});
  else if (focusedTab) ([...this.shadowRoot.querySelectorAll('[data-ui-tab]')].find(tab => tab.dataset.uiTab === focusedTab) ?? this.shadowRoot.querySelector('[role="tab"][aria-selected="true"]'))?.focus({preventScroll: true});
  this._syncHistory();
 }
}
Object.assign(EvccCard.prototype, evccSolarMethods, evccHistoryMethods);




const CAR_COLORS = [
 {value:'charging',label:'Goud / Gold'}, {value:'waiting',label:'Blauw / Blue'},
 {value:'done',label:'Groen / Green'}, {value:'planned',label:'Paars / Purple'}, {value:'off',label:'Grijs / Gray'},
];
const carText = value => typeof value === 'string' ? value.trim() : '';
const carClamp = (value, fallback, min, max) => value !== '' && value != null && Number.isFinite(Number(value)) ? Math.max(min,Math.min(max,Number(value))) : fallback;
const normalizeCarTabs=input=>normalizeEntityTabs(input);
function normalizeCarConfig(config={}) {
 const evcc=config.evcc_enabled===true;
 const tabs=Array.isArray(config.tabs)?['controls','session','technical'].filter(tab=>config.tabs.includes(tab)):['controls','session','technical'].filter((tab,i)=>config[['show_controls','show_session','show_details'][i]]!==false);
 const normalized=evcc?normalizeEvccConfig(config):config;
 const custom_tabs=normalizeCarTabs(config.custom_tabs),availableTabs=[...(evcc?tabs:[]),...custom_tabs.filter(tab=>tab.show).map(tab=>tab.id)];
 const fields={};for(let i=1;i<=3;i++)Object.assign(fields,{
  ['show_field_'+i]:config['show_field_'+i]!==false,['field_'+i+'_attribute']:carText(config['field_'+i+'_attribute']),
  ['field_'+i+'_icon']:carText(config['field_'+i+'_icon']),['field_'+i+'_unit']:carText(config['field_'+i+'_unit']),['field_'+i+'_show_unit']:config['field_'+i+'_show_unit']!==false,
  ['field_'+i+'_decimals']:config['field_'+i+'_decimals']==null||config['field_'+i+'_decimals']===''?null:Math.round(carClamp(config['field_'+i+'_decimals'],2,0,6)),
 });
 return {...normalized,...fields,type:config.type||'custom:eleven-car-card',evcc_enabled:evcc,tabs,custom_tabs,default_tab:availableTabs.includes(config.default_tab)?config.default_tab:(availableTabs[0]??'controls'),show_controls:tabs.includes('controls'),show_session:tabs.includes('session'),show_details:tabs.includes('technical'),title:carText(config.title),percentage_entity:carText(config.percentage_entity),
  percentage:carClamp(config.percentage,0,0,100),image_entity:carText(config.image_entity),
  image_source:['entity','media'].includes(config.image_source)?config.image_source:(config.image_media?'media':'entity'),
  image_media:typeof config.image_media==='string'?{media_content_id:carText(config.image_media),media_content_type:'image/*'}:config.image_media&&typeof config.image_media==='object'&&!Array.isArray(config.image_media)?{...config.image_media,media_content_id:carText(config.image_media.media_content_id)}:undefined,
  range_source:['none','entity','calculated'].includes(config.range_source)?config.range_source:(config.range_entity?'entity':config.range_full>0?'calculated':'none'),
  range_entity:carText(config.range_entity),range_full:carClamp(config.range_full,null,0,100000),range_unit:config.range_unit==='mi'?'mi':'km',
  image_scale:carClamp(config.image_scale,100,50,300),image_offset_y:carClamp(config.image_offset_y,0,-150,150),
  image_offset_x:carClamp(config.image_offset_x,0,-150,150),animation_speed:carClamp(config.animation_speed,1,0.25,3),animation_max_kw:carClamp(config.animation_max_kw,11,0.1,500),
  battery_style:['classic','slim','soft','line'].includes(config.battery_style)?config.battery_style:'soft',
  animate_background:config.animate_background!==false,background_strength:carClamp(config.background_strength,100,0,100),
  background:HEADER_BACKGROUNDS.some(item=>item.value===config.background)?config.background:'lanes',
  color:CAR_COLORS.some(item=>item.value===config.color)?config.color:'charging',compact:(config.compact??(config.density==='compact'))===true,
  field_1_entity:carText(config.field_1_entity),field_1_label:carText(config.field_1_label),field_1_icon:carText(config.field_1_icon)||'mdi:car',
  field_2_entity:carText(config.field_2_entity),field_2_label:carText(config.field_2_label),
  field_3_entity:carText(config.field_3_entity),field_3_label:carText(config.field_3_label)};
}
function carAvailable(entity){return entity?.state!=null&&!['','unknown','unavailable'].includes(String(entity.state).trim());}
function carPercentage(config,states={}) {
 const entity=states[config.percentage_entity];
 if(config.percentage_entity&&(!carAvailable(entity)||!Number.isFinite(Number(entity.state))))return null;
 return Math.max(0,Math.min(100,config.percentage_entity?Number(entity.state):config.percentage));
}
function carRange(config,states={}){
 if(config.range_source==='none')return null;
 if(config.range_source==='calculated'){
  const percent=carPercentage(config,states),full=config.range_full;
  return {value:percent==null||full==null||full<=0?null:full*percent/100,unit:config.range_unit,estimated:true,entity:null};
 }
 const entity=states[config.range_entity],raw=entity?.state;
 return {value:carAvailable(entity)&&Number.isFinite(Number(raw))&&Number(raw)>=0?Number(raw):null,
  unit:entity?.attributes?.unit_of_measurement||'km',estimated:false,entity:config.range_entity};
}
function carReading(entity,hass,decimals=null) {
 if(!carAvailable(entity))return '\u2014';
 const raw=String(entity.state), unit=entity.attributes?.unit_of_measurement;
 if(!Number.isFinite(Number(raw)))return typeof hass?.formatEntityState==='function'?hass.formatEntityState(entity):raw;
 const locale=hass?.locale?.language??hass?.language??'en';
 let value;try{value=new Intl.NumberFormat(locale,{maximumFractionDigits:decimals??2,...(decimals!=null?{minimumFractionDigits:decimals}:{})}).format(Number(raw));}catch{value=String(Number(raw));}
 return value+(unit?' '+unit:'');
}
function carFieldReading(entity,hass,config,index){
 const attribute=config['field_'+index+'_attribute'];
 if(!carAvailable(entity))return '\u2014';
 const state=attribute?entity.attributes?.[attribute]:entity.state;
 if(state==null||typeof state==='object')return '\u2014';
 const unit=config['field_'+index+'_show_unit']===false?'':config['field_'+index+'_unit']||(attribute?'':entity.attributes?.unit_of_measurement);
 return carReading({...entity,state:String(state),attributes:{...entity.attributes,unit_of_measurement:unit}},attribute?{...hass,formatEntityState:undefined}:hass,config['field_'+index+'_decimals']);
}
function carImageUrl(entity,hass) {
 if(!carAvailable(entity))return null;
 const picture=entity.attributes?.entity_picture;
 if(typeof picture!=='string'||!picture.trim())return null;
 if(picture.startsWith('/')&&!picture.startsWith('//'))return hass?.hassUrl?hass.hassUrl(picture):picture;
 try{const url=new URL(picture);return ['http:','https:'].includes(url.protocol)?url.href:null;}catch{return null;}
}


// Media URLs are authenticated, expiring URLs, not the persisted media-source ID.
class CarMediaImage {
 constructor(onChange){this.onChange=onChange;this.version=0;}
 reset(){
  this.version++;clearTimeout(this.timer);clearTimeout(this.timeout);
  this.timer=null;this.timeout=null;this.pending=false;this.url=null;this.id=null;this.connection=null;this.expires=0;this.retry=0;
 }
 update(hass,media){
  const id=media?.media_content_id||'',connection=hass?.connection??hass?.callWS;
  if(id!==this.id||connection!==this.connection){this.reset();this.id=id;this.connection=connection;}
  this.hass=hass;this.media=media;
  if(!id)return;
  if(!id.startsWith('media-source://')){this.url=carImageUrl({state:'available',attributes:{entity_picture:id}},hass);return;}
  if(!hass?.callWS)return;
  if(hass.connected===false||hass.connection?.connected===false){
   clearTimeout(this.timer);this.timer=null;
   if(this.pending){this.version++;clearTimeout(this.timeout);this.pending=false;}
   return;
  }
  if(this.pending||Date.now()<this.retry)return;
  if(this.url&&Date.now()<this.expires){if(!this.timer)this._schedule(this.expires-Date.now());return;}
  this._resolve(hass,id);
 }
 _schedule(delay){
  clearTimeout(this.timer);this.timer=setTimeout(()=>{this.timer=null;this.update(this.hass,this.media);},delay);
  this.timer.unref?.();
 }
 async _resolve(hass,id){
  const version=++this.version;this.pending=true;
  try{
   const result=await Promise.race([
    Promise.resolve().then(()=>hass.callWS({type:'media_source/resolve_media',media_content_id:id})),
    new Promise((_,reject)=>{this.timeout=setTimeout(()=>reject(new Error('Media timeout')),10000);this.timeout.unref?.();}),
   ]);
   if(version!==this.version)return;
   const url=carImageUrl({state:'available',attributes:{entity_picture:result?.url}},hass);
   if(!url||(result.mime_type&&!result.mime_type.startsWith('image/')))throw new Error('Invalid media image');
   this.url=url;this.expires=Date.now()+23*60*60*1000;this.retry=0;this._schedule(this.expires-Date.now());
  }catch{
   if(version!==this.version)return;
   this.url=null;this.expires=0;this.retry=Date.now()+60000;this._schedule(60000);
  }finally{
   if(version===this.version){clearTimeout(this.timeout);this.timeout=null;this.pending=false;this.onChange();}
  }
 }
}







const carEditorDutch=hass=>String(hass?.locale?.language??hass?.language??'en').startsWith('nl');
const CAR_EDITOR_LABELS={
 title:['Kaartnaam (toegankelijkheid)','Card name (accessibility)'],evcc_enabled:['EVCC-koppeling gebruiken','Use EVCC integration'],entity:['Laadvermogensensor van het laadpunt','Loadpoint charge power sensor'],
 percentage_entity:['Percentage-entiteit (optioneel)','Percentage entity (optional)'],percentage:['Vast percentage','Fixed percentage'],
 range_source:['Actieradius tonen','Show range'],range_entity:['Resterende actieradius-entiteit','Remaining range entity'],range_full:['Totaal bereik bij 100%','Total range at 100%'],range_unit:['Afstandseenheid','Distance unit'],
 image_source:['Afbeeldingsbron','Image source'],image_media:['Afbeelding uit Media','Image from Media'],image_entity:['Afbeeldingsentiteit auto (optioneel)','Vehicle image entity (optional)'],image_scale:['Grootte autoafbeelding','Vehicle image size'],image_offset_y:['Verticale positie auto','Vehicle vertical position'],
 image_offset_x:['Horizontale positie auto','Vehicle horizontal position'],battery_style:['Stijl percentagebalk','Percentage bar style'],animation_speed:['Animatiesnelheid','Animation speed'],animation_max_kw:['Maximaal laadvermogen voor animatie','Maximum charge power for animation'],
 background_strength:['Achtergrondsterkte','Background intensity'],background:['Achtergrond','Background'],color:['Accentkleur','Accent color'],animate_background:['Achtergrond animeren','Animate background'],compact:['Compacte weergave','Compact layout'],tabs:['Zichtbare tabbladen','Visible tabs'],default_tab:['Standaardtabblad','Default tab'],
};
for(let i=1;i<=3;i++)Object.assign(CAR_EDITOR_LABELS,{
 ['show_field_'+i]:['Gegevensveld tonen','Show data field'],['field_'+i+'_entity']:['Entiteit','Entity'],['field_'+i+'_label']:['Label (optioneel)','Label (optional)'],
 ['field_'+i+'_attribute']:['Attribuut (optioneel)','Attribute (optional)'],['field_'+i+'_unit']:['Eigen eenheid (optioneel)','Custom unit (optional)'],
 ['field_'+i+'_decimals']:['Decimalen (optioneel)','Decimal places (optional)'],['field_'+i+'_show_unit']:['Eenheid tonen','Show unit'],
});
for(let i=1;i<=3;i++)CAR_EDITOR_LABELS['field_'+i+'_icon']=['Icoon','Icon'];
const CAR_EDITOR_HELPERS={
 title:['Naam voor toegankelijkheid en de afbeeldingsbeschrijving; verschijnt niet als zichtbare titel.','Name for accessibility and the image description; not shown as a visible title.'],
 animate_background:['Bewegende lichtsluiers, wolken en weerlijnen. Animatie stopt bij geen verbinding en de voorkeur voor minder beweging.','Moving light ribbons, clouds and contours. Animation stops when offline or reduced motion is preferred.'],
 evcc_enabled:['Aan: laadgegevens en bediening via EVCC. Uit: een eigen percentage en drie vrije gegevensvelden. Instellingen blijven bewaard bij omschakelen.','On: EVCC charging data and controls. Off: your own percentage and three custom fields. Switching preserves both sets of settings.'],
 entity:['Kies de vermogenssensor van één laadpunt. De overige EVCC-entiteiten worden automatisch binnen dat laadpunt herkend.','Choose the power sensor of one loadpoint. Other EVCC entities are detected within that loadpoint.'],
 percentage_entity:['Gebruik een entiteit met een waarde van 0 tot 100. Laat leeg voor een vast percentage.','Use an entity with a value from 0 to 100. Leave empty for a fixed percentage.'],
 percentage:['Alleen voor de weergave; dit wijzigt geen sensor.','Display only; this does not change a sensor.'],
 range_source:['Toont de resterende actieradius onder het percentage, net als bij EVCC. Kies een sensor of een schatting op basis van het percentage.','Shows remaining range below the percentage, as with EVCC. Choose a sensor or an estimate based on the percentage.'],
 range_entity:['Gebruik een sensor met de resterende afstand. De sensoreenheid wordt overgenomen; zonder eenheid wordt km gebruikt.','Use a sensor with the remaining distance. The sensor unit is retained; km is used if no unit is provided.'],
 range_full:['Schatting = totaal bereik × huidig percentage / 100. Bijvoorbeeld: 800 km bij 100% en 50% resterend geeft circa 400 km.','Estimate = total range × current percentage / 100. For example: 800 km at 100% and 50% remaining gives approximately 400 km.'],
 image_entity:['Kies een image-entiteit met de afbeelding van je auto. Zonder afbeelding verschijnt een auto-icoon.','Choose an image entity with your vehicle picture. Without an image a car icon is shown.'],
 image_source:['Kies een afbeelding-entiteit of een afbeelding uit Home Assistant Media. Beide keuzes blijven bewaard bij omschakelen.','Choose an image entity or a picture from Home Assistant Media. Switching preserves both selections.'],
 image_media:['Kies een afbeelding in je Home Assistant-mediabibliotheek.','Choose an image in your Home Assistant media library.'],
 image_scale:['Vergroot de auto binnen de vaste headerhoogte. Een grote afbeelding kan vóór het percentage komen.','Scale the car within the fixed header height. A large image may overlap the percentage.'],
 image_offset_y:['Negatief = omhoog, positief = omlaag. De headerhoogte blijft gelijk.','Negative moves up, positive moves down. Header height stays fixed.'],
 image_offset_x:['Negatief = naar links, positief = naar rechts. Nul plaatst de afbeelding horizontaal in het midden van de kaart.','Negative moves left, positive moves right. Zero centers the image horizontally in the card.'],
 battery_style:['Kies een klassieke balk, slanke capsule, zacht licht (standaard) of fijne lijn.','Choose a classic bar, slim capsule, soft light (default) or fine line.'],
 animation_speed:['Snelheidsfactor: 0,5× is half zo snel, 2× is dubbel zo snel. Bij nul of onbekend laadvermogen pauzeert de animatie.','Speed factor: 0.5× is half speed, 2× is double speed. Zero or unknown charge power pauses animation.'],
 animation_max_kw:['Vermogen waarbij de animatie de hoogste snelheid bereikt. Dit verandert geen EVCC-laadlimiet.','Power at which animation reaches its maximum speed. This does not change EVCC charge limits.'],
 color:['Vaste accentkleur voor eigen gegevens. Met EVCC volgt de kleur de laadstatus.','Fixed accent for custom data. With EVCC the color follows charging state.'],
 compact:['Kleinere afbeeldingruimte en gegevensvlakken. Je tabkeuze blijft behouden.','Smaller image area and data panels. Your tab selection is preserved.'],
 tabs:['Kies welke tabbladen zichtbaar zijn, ook in compact. Leeg = geen tabbladen. Een tab zonder beschikbare entiteiten wordt niet getoond.','Choose visible tabs, including in compact. Empty means no tabs. Tabs without source entities are omitted.'],
 default_tab:['Dit tabblad opent bij het laden van de kaart. Een handmatige tabkeuze blijft behouden bij sensorupdates.','Opens when the card loads. Manual tab selection is preserved during sensor updates.'],
};
class CarEditor extends customTabsEditor(EvccEditor) {
 setConfig(config){this._config=normalizeCarConfig(config);if(this._hass&&this._config.evcc_enabled)this.hass=this._hass;else this._render();}
 set hass(hass){if(this._config?.evcc_enabled)super.hass=hass;else{this._hass=hass;this._render();}}get hass(){return this._hass;}
 _schema(nl){
  const text=name=>({name,selector:{text:{}}}),boolean=name=>({name,selector:{boolean:{}}});
  const entity=(name,domain)=>({name,selector:{entity:domain?{domain}:{}}});
  const group=(name,title,schema,expanded=false)=>({type:'expandable',name,title,flatten:true,expanded,schema});
  const select=(name,options,multiple=false)=>({name,selector:{select:{mode:multiple?'list':'dropdown',multiple,options}}});
  const number=(name,min,max,step,unit,mode='slider')=>({name,selector:{number:{min,max,step,mode,...(unit?{unit_of_measurement:unit}:{})}}});
  const config=this._config,evcc=config.evcc_enabled;
  const schema=[group('general',nl?'Algemeen':'General',[text('title'),boolean('evcc_enabled')],true),
   group('vehicle_image',nl?'Autoafbeelding':'Vehicle image',[select('image_source',[{value:'entity',label:nl?'Afbeelding-entiteit':'Image entity'},{value:'media',label:'Media'}]),...(config.image_source==='media'?[{name:'image_media',selector:{media:{accept:['image/*']}}}]:[entity('image_entity','image')]),number('image_scale',50,300,5,'%'),number('image_offset_x',-150,150,1,'px'),number('image_offset_y',-150,150,1,'px')]),
   group('appearance',nl?'Weergave':'Appearance',[boolean('compact'),select('background',headerBackgroundOptions(nl)),number('background_strength',0,100,5,'%'),boolean('animate_background'),select('battery_style',[{value:'classic',label:nl?'Klassiek · 12 px':'Classic · 12 px'},{value:'slim',label:nl?'Slanke capsule · 8 px':'Slim capsule · 8 px'},{value:'soft',label:nl?'Zacht licht · 8 px (standaard)':'Soft light · 8 px (default)'},{value:'line',label:nl?'Fijne lijn · 4 px':'Fine line · 4 px'}]),...(!evcc?[select('color',CAR_COLORS.map(item=>({...item,label:item.label.split(' / ')[nl?0:1]})))]:[]),...(evcc?[number('animation_speed',0.25,3,0.25,'×'),number('animation_max_kw',0.1,500,0.1,'kW','box')]:[])])];
  if(!evcc){
   schema.push(group('percentage_settings',nl?'Percentage':'Percentage',[entity('percentage_entity'),...(!config.percentage_entity?[number('percentage',0,100,1,'%')]:[])],true));
   schema.push(group('range_settings',nl?'Actieradius':'Range',[
    select('range_source',[{value:'none',label:nl?'Niet tonen':'Hide'},{value:'entity',label:nl?'Van een entiteit':'From an entity'},{value:'calculated',label:nl?'Berekenen uit percentage':'Calculate from percentage'}]),
    ...(config.range_source==='entity'?[entity('range_entity','sensor')]:[]),
    ...(config.range_source==='calculated'?[select('range_unit',[{value:'km',label:'km'},{value:'mi',label:'mi'}]),number('range_full',1,100000,1,config.range_unit,'box')]:[]),
   ]));
   for(let i=1;i<=3;i++){
    const fields=[boolean('show_field_'+i)];
    if(config['show_field_'+i])fields.push(entity('field_'+i+'_entity'),text('field_'+i+'_label'),{name:'field_'+i+'_icon',selector:{icon:{}}},text('field_'+i+'_attribute'),boolean('field_'+i+'_show_unit'),...(config['field_'+i+'_show_unit']?[text('field_'+i+'_unit')]:[]),number('field_'+i+'_decimals',0,6,1,null,'box'));
    schema.push(group('field_'+i,nl?['Breed gegevensveld','Gegevensveld links','Gegevensveld rechts'][i-1]:['Wide data field','Left data field','Right data field'][i-1],fields));
   }
  }else{
   schema.push(group('evcc_connection',nl?'EVCC-koppeling':'EVCC integration',[{...entity('entity','sensor'),selector:{entity:{domain:'sensor',device_class:'power'}}}],true));
   const tabs=[{value:'controls',label:nl?'Bediening':'Controls'},{value:'session',label:nl?'Laadsessie':'Session'},{value:'technical',label:'EVCC'}];
   const defaults=[...tabs.filter(tab=>config.tabs.includes(tab.value)),...config.custom_tabs.filter(tab=>tab.show).map((tab,i)=>({value:tab.id,label:tab.title||(nl?'Eigen tabblad ':'Custom tab ')+(i+1)}))];
   schema.push(group('tab_settings',nl?'Tabbladen':'Tabs',[select('tabs',tabs,true),...(defaults.length?[select('default_tab',defaults)]:[])],true));
   const override=(name,title,fields)=>group(name,title,fields.map(field=>entity(field,EVCC_FIELDS[field][2])));
   schema.push(group('overrides',nl?'EVCC-entiteiten aanpassen (optioneel)':'Override EVCC entities (optional)',[
    override('evcc_vehicle',nl?'Auto en laadstatus':'Vehicle and charging state',['vehicle','soc','target_soc','range','connected','charging','enabled','plan_active']),
    override('evcc_live',nl?'Actuele laadgegevens':'Live charging data',['power','remaining_duration','current','phases']),
    override('evcc_controls',nl?'Bediening':'Controls',['mode','solar_share']),
    override('evcc_session',nl?'Laadsessie':'Session',['charged_energy','session_price','charge_duration','session_price_per_kwh','solar_percentage']),
    override('evcc_details','EVCC',['vehicle_limit_soc','smart_cost_active','pv_action','pv_remaining']),
   ]));
  }
  if(!evcc&&config.custom_tabs.some(tab=>tab.show))schema.push(group('tab_settings',nl?'Tabbladen':'Tabs',[select('default_tab',config.custom_tabs.filter(tab=>tab.show).map((tab,i)=>({value:tab.id,label:tab.title||(nl?'Eigen tabblad ':'Custom tab ')+(i+1)})))],true));
  return schema;
 }
 _helper(item,nl,resolved){
  const name=item.name;if(CAR_EDITOR_HELPERS[name])return CAR_EDITOR_HELPERS[name][nl?0:1];
  if(Object.hasOwn(EVCC_FIELDS,name)){
   const auto=resolved[name];return (nl?'Leeg = automatische herkenning.':'Empty uses automatic detection.')+(auto?' '+(nl?'Herkend: ':'Detected: ')+auto:'');
  }
  if(/^field_\d_label$/.test(name))return nl?'Leeg = de naam van de entiteit.':'Empty uses the entity name.';
  if(/^field_\d_attribute$/.test(name))return nl?'Leeg = de entiteitwaarde. Vul anders de exacte attribuutnaam in.':'Empty uses the entity state. Otherwise enter the exact attribute name.';
  if(/^field_\d_unit$/.test(name))return nl?'Leeg = de sensoreenheid. Bij een attribuut wordt geen eenheid aangenomen.':'Empty uses the sensor unit. Attribute values have no assumed unit.';
  if(/^field_\d_decimals$/.test(name))return nl?'Leeg = automatisch, maximaal 2 decimalen. Alleen voor numerieke waarden.':'Empty uses automatic formatting, up to 2 decimals. Numeric values only.';
 }
 _changed(event){
  event.stopPropagation();const next={...this._config,entities:{...this._config.entities}};
  for(const [key,value] of Object.entries(event.detail.value)){
   if(Object.hasOwn(EVCC_FIELDS,key)){if(value)next.entities[key]=value;else delete next.entities[key];}
   else if(Object.hasOwn(CAR_EDITOR_LABELS,key))next[key]=value;
  }
  this._config=normalizeCarConfig(next);if(this._config.evcc_enabled)this.hass=this._hass;else this._render();
  this._emitConfig();
 }
 _emitConfig(){this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._config,entities:{...this._config.entities},custom_tabs:this._config.custom_tabs.map(tab=>({...tab,entities:tab.entities.map(row=>({...row}))}))}},bubbles:true,composed:true}));}
 _setCustomTabs(tabs){this._config=normalizeCarConfig({...this._config,custom_tabs:tabs});this._render();this._emitConfig();}

 _render(){
  if(!this._config||!this._hass)return;
  if(!this._form){
   this.shadowRoot.innerHTML='<style>:host,ha-form{display:block;min-width:0}p{font-size:12px;line-height:1.5;color:var(--secondary-text-color);margin:0 0 12px}h3{font-size:16px;margin:24px 0 12px}details{border:1px solid var(--divider-color);border-radius:12px;margin:12px 0;min-width:0}summary{padding:12px;min-height:44px;box-sizing:border-box;cursor:pointer;overflow-wrap:anywhere}.tab-body{padding:0 12px 12px}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}button{font:inherit;min-height:44px;border:1px solid var(--divider-color);border-radius:6px;padding:8px 12px;background:var(--card-background-color);color:var(--primary-text-color);cursor:pointer}button:disabled{opacity:.4}button:focus-visible,summary:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}</style><p></p><ha-form></ha-form><h3></h3><p class="tabs-help"></p><div class="custom-tabs"></div><button type="button" data-action="tab-add"></button>';
   this._form=this.shadowRoot.querySelector('ha-form');this._form.addEventListener('value-changed',event=>this._changed(event));
   this.shadowRoot.querySelector('[data-action=tab-add]').onclick=()=>this._customAction('tab-add');
  }
  const nl=carEditorDutch(this._hass),automatic=resolveEvccEntities({...this._config,entities:{}},this._hass,this._registry);
  this.shadowRoot.querySelector('p').textContent=nl?'Stel je auto, afbeelding en weergave in. Kies EVCC voor laadgegevens of gebruik je eigen sensoren.':'Configure your car, image and appearance. Choose EVCC for charging data or use your own sensors.';
  Object.assign(this._form,{hass:this._hass,data:{...this._config,...this._config.entities},schema:this._schema(nl),computeLabel:item=>(CAR_EDITOR_LABELS[item.name]??EVCC_FIELDS[item.name])?.[nl?0:1]??item.name,computeHelper:item=>this._helper(item,nl,automatic)});
  this._renderCustomTabs(nl);
 }
}












const carDutch=hass=>String(hass?.locale?.language??hass?.language??'en').startsWith('nl');

class CarCard extends EvccCard {
 constructor(){super();this._mediaImage=new CarMediaImage(()=>{this._signature=null;this._render();});}
 disconnectedCallback(){this._mediaImage.reset();super.disconnectedCallback();}
 _hasVehicleImage(){return this._config.image_source==='media'?!!this._config.image_media?.media_content_id:!!this._config.image_entity;}
 _vehicleImage(){return this._config.image_source==='media'?this._mediaImage.url:carImageUrl(this._hass?.states?.[this._config.image_entity],this._hass);}
 static async getConfigElement(){
  if(!customElements.get('ha-form')){const helpers=await window.loadCardHelpers();const card=await helpers.createCardElement({type:'entities',entities:[]});await card.constructor.getConfigElement();await customElements.whenDefined('ha-form');}
  if(!customElements.get('eleven-car-editor'))customElements.define('eleven-car-editor',CarEditor);
  return document.createElement('eleven-car-editor');
 }
 static getStubConfig(){return {title:'',percentage:50,field_1_entity:'',field_2_entity:'',field_3_entity:''};}
 setConfig(config){
  const next=normalizeCarConfig(config),switching=this._config?.evcc_enabled!==next.evcc_enabled,defaultChanged=this._config?.default_tab!==next.default_tab;
  this._cancelMode();this._cancelSolar();this._actionError=null;this._solarError=null;this._tabController?.disconnect();
  if(switching){clearInterval(this._clockTimer);this._clockTimer=null;this._resetHistory();this._connection=null;this._registry=[];this._activeTab=null;}
  if(switching||defaultChanged)this._activeTab=next.default_tab;
  this._config=next;this._signature=null;
  if(next.evcc_enabled&&this._hass)super.hass=this._hass;else this._render();
 }
 set hass(hass){if(this._config?.evcc_enabled)super.hass=hass;else{this._hass=hass;this._render();}}get hass(){return this._hass;}
 connectedCallback(){this._signature=null;if(this._config?.evcc_enabled)super.connectedCallback();else{this._observeMotion();this._render();}}
 getCardSize(){return this._config?.evcc_enabled?super.getCardSize():(this._config?.compact?6:8);}
 getGridOptions(){return this._config?.evcc_enabled?super.getGridOptions():{columns:12,min_columns:6,rows:this._config?.compact?7:9,min_rows:3};}
 _title(dutch){return this._config.title||(dutch?'Mijn auto':'My car');}
 _carReading(id,value,label,unit=''){
  const markup=unit&&value.endsWith(' '+unit)?uiEscape(value.slice(0,-unit.length).trimEnd())+' <span class="ui-metric-unit">'+uiEscape(unit)+'</span>':uiEscape(value);
  return id?`<button type="button" data-entity="${uiEscape(id)}" aria-label="${uiEscape(label+': '+value)}">${markup}</button>`:markup;}
 _extraSignature(){return this._config.custom_tabs.flatMap(tab=>tab.entities.map(row=>this._hass?.states?.[row.entity]));}
 _extraStyles(){return `
  .content[data-battery-style=slim] .battery-track,.content[data-battery-style=soft] .battery-track{height:8px}
  .content[data-battery-style=line] .battery-track{height:4px}
  .content:is([data-battery-style=slim],[data-battery-style=soft],[data-battery-style=line]) .target-marker{top:-2px;height:calc(100% + 4px);width:1px}
  .content[data-battery-style=soft] .battery-fill{background:color-mix(in srgb,var(--primary-color) 65%,var(--secondary-background-color));box-shadow:0 0 8px color-mix(in srgb,var(--primary-color) 18%,transparent)}
  .content[data-battery-style=soft] .battery-fill::before{filter:opacity(.45)}
  .content[data-battery-style=line] .battery-fill::before{background:linear-gradient(100deg,transparent,#ffffff99,transparent)}
 `;}
 _applyPresentation(){
  const content=this.shadowRoot.querySelector('.content');if(!content)return;
  content.dataset.batteryStyle=this._config.battery_style;
  content.style.setProperty('--evcc-image-offset-x',this._config.image_offset_x+'px');
 }
 _tabItems(nl){
  const items=this._config.evcc_enabled?super._tabItems(nl):[];
  for(const [index,tab] of this._config.custom_tabs.entries()){
   if(!tab.show)continue;
   const label=tab.title||(nl?'Eigen tabblad ':'Custom tab ')+(index+1);
   const rows=tab.entities.filter(row=>row.entity);
   const content=rows.length?`<dl class="metrics">${rows.map(row=>{
    const entity=this._hass?.states?.[row.entity],name=row.name||entity?.attributes?.friendly_name||row.entity;
    const value=carFieldReading(entity,this._hass,{field_1_attribute:row.attribute,field_1_unit:row.unit,field_1_show_unit:row.show_unit,field_1_decimals:row.decimals},1);
    const plain=carFieldReading(entity,this._hass,{field_1_attribute:row.attribute,field_1_show_unit:false,field_1_decimals:row.decimals},1);
    const unit=value.startsWith(plain)?value.slice(plain.length).trim():'';
    return `<div><dt>${uiEscape(name)}</dt><dd>${this._carReading(row.entity,value,name,unit)}</dd></div>`;
   }).join('')}</dl>`:`<p class="notice">${nl?'Voeg entiteiten toe aan dit tabblad in de kaartconfiguratie.':'Add entities to this tab in the card configuration.'}</p>`;
   items.push({value:tab.id,label,content,tabAttrs:{title:label}});
  }
  return items;
 }
 _rangePrimary(config,states,nl){
  const range=carRange(config,states);if(!range)return {};
  const label=range.estimated?(nl?'geschat bereik':'estimated range'):(nl?'actieradius':'range');
  const value=range.value==null?'\u2014':carReading({state:String(range.value),attributes:{unit_of_measurement:range.unit}},this._hass,0);
  return {subtitle:value+' '+label,subtitleEntity:range.entity||''};
 }
 _field(i,nl){
  const config=this._config,id=config['field_'+i+'_entity'],entity=this._hass?.states?.[id];
  const label=config['field_'+i+'_label']||entity?.attributes?.friendly_name||id||(nl?'Gegevensveld '+i:'Data field '+i);
  const value=carFieldReading(entity,this._hass,config,i);
  const plain=carFieldReading(entity,this._hass,{...config,['field_'+i+'_show_unit']:false},i),split=value.startsWith(plain);
  return uiMetric({title:label,value:plain==='\u2014'?null:split?plain:value,unit:split?value.slice(plain.length).trim():'',icon:config['field_'+i+'_icon']||(i===2?'mdi:map-marker-distance':'mdi:counter'),compact:config.compact,action:!!id,attrs:{class:i===1?'car-status':'car-field','data-entity':id||'','data-car-field':String(i)}});
 }
 _render(){
  if(!this._config)return;
  if(this.isConnected)this._mediaImage.update(this._hass,this._config.image_source==='media'?this._config.image_media:null);
  if(this._config.evcc_enabled){super._render();this._applyPresentation();return;}
  const config=this._config,hass=this._hass,states=hass?.states??{},nl=carDutch(hass),percent=carPercentage(config,states);
  const offline=hass?.connected===false||hass?.connection?.connected===false;
  const signature=JSON.stringify([config,hass?.themes?.darkMode,hass?.locale,hass?.language,offline,...[config.percentage_entity,config.range_entity,config.image_entity,config.field_1_entity,config.field_2_entity,config.field_3_entity].map(id=>states[id]),this._extraSignature()]);
  if(signature===this._signature)return;this._signature=signature;
  const scroll=this.shadowRoot.querySelector('.content')?.scrollTop??0,focused=this.shadowRoot.activeElement?.dataset.entity,focusedTab=this.shadowRoot.activeElement?.dataset.uiTab;
  const title=config.title||(nl?'Mijn auto':'My car'),image=this._vehicleImage(),percentage=percent==null?'\u2014':carReading({state:String(percent),attributes:{unit_of_measurement:'%'}},hass);
  const fields=[2,3].filter(i=>config['show_field_'+i]);
  this.shadowRoot.innerHTML=`<style>${uiButtonStyles()}${uiTabsStyles()}${evccCardStyles()}${this._extraStyles()}
   .car-status{margin-top:16px}.car-readings{margin:0}.content{--ui-metric-tone:var(--tone)}
   .content[data-density=compact] .car-status{margin-top:12px}
   .content .header-scene[data-no-readings]{padding-bottom:0}
   .range-value{font-size:12px;font-weight:600;color:var(--primary-text-color,#20252b)}
  </style><ha-card aria-label="${uiEscape(title)}"><div class="content" style="--header-background-opacity:${config.background_strength/100}" data-density="${config.compact?'compact':'standard'}" data-theme="${hass?.themes?.darkMode?'dark':'light'}" data-tone="${config.color}" data-background="${config.background}" data-animated="${config.animate_background&&!offline&&percent!=null}">
   <div class="header-region"><div class="header-background" aria-hidden="true">${headerAtmosphere(config.background)}</div><div class="header-scene" ${fields.length?'':'data-no-readings'}><div class="gallery-top">
    ${offline?`<p class="notice warning" role="status">${nl?'Geen verbinding met Home Assistant. Getoonde waarden zijn de laatst ontvangen gegevens.':'Disconnected from Home Assistant. Values shown are the last received readings.'}</p>`:''}
    <div class="hero"><div class="car-stage"><div class="battery-row">${uiPrimaryValue({value:percent==null?null:percentage.replace(/\s*%$/,''),unit:'%',...this._rangePrimary(config,states,nl),entity:config.percentage_entity,compact:config.compact,attrs:{class:'battery-value'}})}</div>
     <div class="picture">${image?`<img src="${uiEscape(image)}" alt="${uiEscape(title)}"><small hidden>${nl?'Autoafbeelding niet beschikbaar':'Vehicle image unavailable'}</small>`:`<ha-icon icon="mdi:car" aria-hidden="true"></ha-icon>${this._hasVehicleImage()?`<small>${nl?'Autoafbeelding niet beschikbaar':'Vehicle image unavailable'}</small>`:''}`}</div>
    </div><div class="battery-track" ${percent==null?`aria-label="${nl?'Percentage niet beschikbaar':'Percentage unavailable'}"`:`role="progressbar" aria-label="Percentage" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"`}><div class="battery-fill" style="width:${percent??0}%"></div></div></div>
   </div>${config.show_field_1?`${this._field(1,nl)}`:''}</div>
   ${fields.length?`<div class="car-readings" data-ui-metric-grid style="--ui-metric-columns:${fields.length}">${fields.map(i=>this._field(i,nl)).join('')}</div>`:''}</div>${this._tabsMarkup(nl)}</div></ha-card>`;
  const content=this.shadowRoot.querySelector('.content');content.style.setProperty('--evcc-image-scale',String(config.image_scale/100));content.style.setProperty('--evcc-image-offset-y',config.image_offset_y+'px');content.scrollTop=scroll;
  for(const button of this.shadowRoot.querySelectorAll('[data-entity]'))button.addEventListener('click',()=>this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:button.dataset.entity},bubbles:true,composed:true})));
  if(focused)Array.from(this.shadowRoot.querySelectorAll('[data-entity]')).find(button=>button.dataset.entity===focused)?.focus({preventScroll:true});
  this._tabController?.disconnect();
  this._tabController=bindUITabs({tabs:this.shadowRoot.querySelectorAll('[data-ui-tab]'),panels:this.shadowRoot.querySelectorAll('[data-ui-tab-panel]'),onSelect:value=>{this._activeTab=value;}});
  if(focusedTab)(Array.from(this.shadowRoot.querySelectorAll('[data-ui-tab]')).find(tab=>tab.dataset.uiTab===focusedTab)??this.shadowRoot.querySelector('[role=tab][aria-selected=true]'))?.focus({preventScroll:true});
  this._applyPresentation();
  const img=this.shadowRoot.querySelector('img');if(img)img.addEventListener('error',()=>{img.hidden=true;const hint=this.shadowRoot.querySelector('.picture small');if(hint)hint.hidden=false;},{once:true});
 }
}

if(!customElements.get('eleven-car-card'))customElements.define('eleven-car-card',CarCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(card=>card.type==='eleven-car-card'))window.customCards.push({type:'eleven-car-card',name:'Eleven Car (beta)',description:'Vehicle image, percentage and configurable readings, with optional EVCC charging integration.',preview:true});
})();
