// Eleven Energy Flow (beta) - self-contained module
(()=>{

// Explicit current-price sensors override Energy only in the selected direction.
// Never substitute another tariff when the chosen sensor is unavailable.
function energyFlowSelectedPrice(host,direction){
 const id=host._config?.[direction==='import'?'price_entity':'export_price_entity'];
 return id?{configured:true,price:energyFlowCurrentPrice({priceEntity:id},host._hass)}:{configured:false,price:null};
}

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



// Informational detail surface. Callers format/translate text and compute percentages.
// All content is escaped; this component deliberately accepts no trusted HTML.
function uiDetailSurface({title='',metrics=[],percent=null,entity='',actionLabel='',attrs={}}={}){
 const progress=Number.isFinite(percent)?Math.max(0,Math.min(100,percent)):null;
 return `<section${uiAttributes({...attrs,'data-ui-detail-surface':'','aria-label':title})}>
  <h3 class="ui-detail-surface-title">${entity?`<button type="button" class="ui-detail-surface-action" data-entity="${uiEscape(entity)}" aria-label="${uiEscape(actionLabel||title)}">${uiEscape(title)} <span aria-hidden="true">›</span></button>`:uiEscape(title)}</h3>
  <dl class="ui-detail-surface-metrics">${metrics.map(({label='',value,unit='',hint=''})=>{
   const missing=value==null||value==='';
   return `<div><dt>${uiEscape(label)}</dt><dd>${uiEscape(missing?'—':value)}${!missing&&unit?' '+uiEscape(unit):''}${hint?`<small class="ui-detail-surface-hint">${uiEscape(hint)}</small>`:''}</dd></div>`;
  }).join('')}</dl>
  ${progress==null?'':`<div class="ui-detail-surface-track" aria-hidden="true"><i style="width:${progress}%"></i></div>`}
 </section>`;
}

function uiDetailSurfaceStyles(){return uiSurfaceStyles('[data-ui-detail-surface]')+`
[data-ui-detail-surface]{box-sizing:border-box;min-width:0;padding:12px;border-radius:8px;color:var(--primary-text-color,#20252b);background:color-mix(in srgb,var(--ui-detail-tone,var(--primary-color,#2196f3)) 5%,transparent)}
[data-ui-detail-surface] .ui-detail-surface-title{font-family:inherit;font-size:12px;font-weight:600;line-height:1.4;color:inherit;margin:0 0 8px;overflow-wrap:anywhere}
[data-ui-detail-surface] .ui-detail-surface-action{font:inherit;line-height:1.4;color:inherit;background:none;border:0;border-radius:4px;padding:4px 0;margin:-4px 0;text-align:start;cursor:pointer}
[data-ui-detail-surface] .ui-detail-surface-action:hover{text-decoration:underline}[data-ui-detail-surface] .ui-detail-surface-action:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px}
[data-ui-detail-surface] .ui-detail-surface-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,68px),1fr));gap:8px 12px;margin:0}
[data-ui-detail-surface] .ui-detail-surface-metrics>div{min-width:0}
[data-ui-detail-surface] dt{font-size:10px;font-weight:400;line-height:1.4;color:var(--secondary-text-color,#626a78);overflow-wrap:anywhere;margin:0 0 2px}
[data-ui-detail-surface] dd{margin:0;font-size:18px;font-weight:600;line-height:1.35;letter-spacing:-.02em;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
[data-ui-detail-surface] .ui-detail-surface-hint{display:block;margin-top:3px;font-size:10px;font-weight:400;line-height:1.4;letter-spacing:normal;color:var(--secondary-text-color,#626a78)}
[data-ui-detail-surface] .ui-detail-surface-track{height:8px;border-radius:8px;background:var(--divider-color,#ddd);overflow:hidden;margin-top:8px}
[data-ui-detail-surface] .ui-detail-surface-track>i{display:block;height:100%;background:var(--ui-detail-tone,var(--primary-color,#2196f3))}
@container(max-width:360px){[data-ui-detail-surface] dd{font-size:15px}}
@media(forced-colors:active){[data-ui-detail-surface]{border:1px solid CanvasText}[data-ui-detail-surface] .ui-detail-surface-track{background:Canvas;border:1px solid CanvasText}[data-ui-detail-surface] .ui-detail-surface-track>i{background:Highlight;forced-color-adjust:none}}
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



function uiPopup({id,title,label=title,closeLabel='Close',content='',className='',attrs={},closeAttrs={}}){
 return `<div${uiAttributes({id,class:className||null,'data-ui-popup':'',popover:'auto',role:'dialog','aria-label':label,...attrs})}><div class="ui-popup-heading"><strong>${uiEscape(title)}</strong>${uiButton({variant:'close',content:'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>',label:closeLabel,attrs:{'data-ui-popup-close':'',...closeAttrs}})}</div>${content}</div>`;
}
function bindUIPopupPosition({trigger,popup,isRequested,onShow,ready,width=380,maxHeight=560,topBoundary=()=>8,align='end'}){
 let active=true;
 const position=()=>{
  if(!active||!isRequested())return;
  const box=trigger.getBoundingClientRect();
  if(!box.width||!box.height){popup.style.visibility='hidden';return;}
  const actualWidth=Math.min(width,window.innerWidth-16),minimumTop=Math.max(8,Math.min(topBoundary(),window.innerHeight-80));
  popup.style.width=actualWidth+'px';popup.style.maxHeight=Math.min(maxHeight,window.innerHeight-minimumTop-8)+'px';
  popup.style.visibility='';onShow?.();
  const height=popup.getBoundingClientRect().height,below=window.innerHeight-box.bottom-8,above=box.top-8;
  const left=align==='center'?(box.left+box.right-actualWidth)/2:box.right-actualWidth;
  popup.style.left=Math.max(8,Math.min(left,window.innerWidth-actualWidth-8))+'px';
  popup.style.top=Math.max(minimumTop,Math.min(below>=height||below>=above?box.bottom+6:box.top-height-6,window.innerHeight-height-8))+'px';
 };
 if(ready?.then)ready.then(position,()=>{});
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(position):null;
 observer?.observe(trigger);
 return {position,disconnect(){active=false;observer?.disconnect();}};
}
// Domain state lives in callbacks; this controller also works without a card host.
function bindUIPopup({trigger,popup,container=popup,ready,isRequested,isCurrent=()=>true,beforeOpen=()=>{},onOpen=()=>{},onClose=()=>{},onShown=()=>{},onToggle=()=>{},focusTarget,closeWhenAnchorHidden=false,keepOpenOnOutside=()=>false,topBoundary,align}){
 let requested=false,pending=false,focusPending=false,pointerWasOpen;
 const wantsOpen=isRequested??(()=>requested),native=typeof popup.showPopover==='function';
 const isOpen=()=>native?popup.matches(':popover-open'):popup.hasAttribute('data-fallback-open');
 trigger.setAttribute('aria-haspopup','dialog');if(popup.id)trigger.setAttribute('aria-controls',popup.id);trigger.setAttribute('aria-expanded',String(isOpen()));
 const cleanups=[],listen=(target,type,handler,capture=false)=>{target?.addEventListener?.(type,handler,capture);cleanups.push(()=>target?.removeEventListener?.(type,handler,capture));};
 const property=(target,key,handler)=>{if(!target)return;target[key]=handler;cleanups.push(()=>{if(target[key]===handler)target[key]=null;});};
 const closeButton=popup.querySelector('[data-ui-popup-close]');
 const placement=bindUIPopupPosition({trigger,popup,ready,topBoundary,align,isRequested:wantsOpen,onShow:()=>{
  pending=false;if(native){if(!isOpen())popup.showPopover();}else popup.setAttribute('data-fallback-open','');
  if(focusPending){(focusTarget?.()??closeButton)?.focus({preventScroll:true});focusPending=false;}
  onShown();
 }});
 const close=(focus=false)=>{
  requested=false;pending=false;focusPending=false;onClose();trigger.setAttribute('aria-expanded','false');
  if(native){if(isOpen())popup.hidePopover();}else popup.removeAttribute('data-fallback-open');
  if(focus)trigger.focus({preventScroll:true});
 };
 const open=(focus=true)=>{beforeOpen();requested=true;pending=true;focusPending=focus;onOpen(focus);trigger.setAttribute('aria-expanded','true');placement.position();};
 property(trigger,'onpointerdown',()=>{pointerWasOpen=wantsOpen();});
 property(trigger,'onpointercancel',()=>{pointerWasOpen=undefined;});
 property(trigger,'onclick',()=>{const wasOpen=pointerWasOpen??wantsOpen();pointerWasOpen=undefined;wasOpen?close(true):open();});
 property(closeButton,'onclick',()=>close(true));
 listen(popup,'keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);}});
 listen(popup,'toggle',e=>{if(!isCurrent())return;const opened=e.newState==='open';if(!opened){if(wantsOpen())onClose();pending=false;focusPending=false;}requested=opened;trigger.setAttribute('aria-expanded',String(opened));onToggle(opened);});
 listen(window,'resize',()=>{if(wantsOpen()){if(closeWhenAnchorHidden&&trigger.getClientRects?.().length===0)close();else placement.position();}});
 listen(window,'scroll',e=>{if(isOpen()&&!e.composedPath().includes(popup))close();},true);
 listen(document,'pointerdown',e=>{if((!native||popup.getAttribute?.('popover')==='manual'||pending)&&(isOpen()||wantsOpen())&&!e.composedPath().includes(container)&&!keepOpenOnOutside(e))close();});
 return {open,close,isOpen,position:placement.position,disconnect(){placement.disconnect();cleanups.splice(0).forEach(remove=>remove());}};
}
function uiPopupStyles(){return uiSurfaceStyles('[data-ui-popup]')+`
[data-ui-popup]{display:none;position:fixed;inset:auto;margin:0;padding:12px;box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain;z-index:20;max-width:calc(100vw - 16px);border:0;border-radius:8px;background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#20252b);font:inherit;font-size:12px;line-height:1.35}
[data-ui-popup]:popover-open,[data-ui-popup][data-fallback-open]{display:block}
[data-ui-popup] [hidden]{display:none!important}
[data-ui-popup]>:last-child{margin-block-end:0}
.ui-popup-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:30px}
.ui-popup-heading>strong{font-size:14px;font-weight:600}
.ui-popup-heading [data-ui-popup-close]{display:grid;place-items:center;width:30px;height:30px;min-height:30px;padding:0;line-height:1;flex:none}
.ui-popup-heading [data-ui-popup-close] svg{display:block;width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
`;}




// Shared markup stays in each card's shadow root: native links and existing
// data-zoom handlers work without cross-bundle custom-element registration.
const headerEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function bindCardPopupPosition(host,trigger,popup,isRequested,show){
 return bindUIPopupPosition({trigger,popup,isRequested,onShow:show,ready:host.shadowRoot.querySelector('ha-card')?.updateComplete});
}
// Native toggle events are asynchronous. Clear the other popup's restore
// state synchronously, also for browsers using the attribute fallback.
function closeOtherCardPopups(host,kind){
 const period=kind==='period',root=host.shadowRoot;
 if(period){host._insightOpen=null;host._insightPending=null;host._insightFocus=null;}
 else{host._periodMenuOpen=false;host._periodMenuPending=false;host._periodFocus=null;}
 for(const panel of root.querySelectorAll?.(period?'.insight-popup':'.period-menu')??[]){
  if(typeof panel.showPopover==='function'){if(panel.matches(':popover-open'))panel.hidePopover();}
  else panel.removeAttribute('data-fallback-open');
 }
 for(const trigger of root.querySelectorAll?.(period?'[data-insight]':'[data-period="menu"]')??[])trigger.setAttribute('aria-expanded','false');
}
function cardHeaderIcon(name){
 const paths={in:'M5 12h14M12 5v14',out:'M5 12h14',reset:'M3 10a9 9 0 1 1 2.6 8.4M3 4v6h6',previous:'m15 6-6 6 6 6',next:'m9 6 6 6-6 6',info:'M12 17v-5M12 8h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',history:'M14 3h7v7M21 3 10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5',calendar:'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',down:'m6 9 6 6 6-6'};
 return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${paths[name]}"/></svg>`;
}
function cardHeader({title,showTitle=true,ready=false,historyUrl,language='en',periods={},zoomState={in:true,out:true,reset:true,zoomed:false},information=''}){
 const nl=language.startsWith('nl'),label=nl?['Inzoomen','Uitzoomen','Zoom herstellen','Open in Home Assistant Geschiedenis']:['Zoom in','Zoom out','Reset zoom','Open in Home Assistant History'];
 const zoom=ready?`<div class="zoom-controls" role="group" aria-label="Zoom">${['out','in','reset'].map(action=>uiButton({content:cardHeaderIcon(action),disabled:!zoomState[action],title:label[['in','out','reset'].indexOf(action)],label:label[['in','out','reset'].indexOf(action)],attrs:{'data-zoom':action}})).join('')}</div>`:'';
 const group=periods.picker||periods.navigation?`<div class="chart-controls" role="group" aria-label="${nl?'Tijdvak':'Timeframe'}">${periods.picker??''}${periods.navigation??''}</div>`:'';
 const showZoomStatus=zoomState.zoomed&&!periods.picker;
 return `<header class="card-header">${showTitle&&title?`<h2>${headerEscape(title)}</h2>`:''}<div class="header-actions">${group}${zoom}<div class="chart-links" role="group" aria-label="${nl?'Geschiedenis en informatie':'History and information'}">${uiButton({href:historyUrl??'',className:'history-link',content:cardHeaderIcon('history'),title:label[3],label:label[3]})}${information}</div></div></header>${showZoomStatus?`<div class="chart-context"><div class="chart-range"><span class="zoom-status">${nl?'Ingezoomd':'Zoomed in'}</span></div></div>`:''}`;
}
function cardHeaderStyles(){return uiButtonStyles()+uiPopupStyles()+uiSurfaceStyles('.chart-controls,.zoom-controls,.chart-links')+`
.card-header{display:flex;align-items:flex-start;flex-wrap:wrap;gap:8px;min-height:32px;flex:none;margin:-6px -4px 10px 0}
.card-header h2{flex:1 1 110px;min-width:0;margin:4.75px 0 0;font-size:18px;line-height:1.25;font-weight:650;letter-spacing:-.01em;overflow-wrap:anywhere}
.header-actions{--chart-action-gap:8px;display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:var(--chart-action-gap);flex:0 1 auto;min-width:0;max-width:100%;margin-inline-start:auto}
.chart-controls{display:flex;align-items:center;gap:0;min-width:0;max-width:100%}
.chart-links{display:flex;align-items:center;gap:0;flex:none}
.zoom-controls{display:flex;gap:0;position:relative}
.chart-controls,.zoom-controls,.chart-links{background:var(--secondary-background-color,#eee);border:0;border-radius:8px}
.chart-controls>[data-period="now"]{width:36px}
.chart-controls>.period-controls{position:relative;margin-inline-end:8px;padding-inline-end:8px}
.chart-controls>.period-controls::after{content:"";position:absolute;inset-inline-end:0;top:8px;height:16px;width:1px;background:var(--divider-color,#ddd)}
.header-actions svg{display:block;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}
`;}

// Calendar periods use the Home Assistant timezone, including DST boundaries.
const periodZoneFormats=new Map();
function periodLocalParts(t,zone){
 let format=periodZoneFormats.get(zone);
 if(!format){format=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});periodZoneFormats.set(zone,format);}
 return Object.fromEntries(format.formatToParts(t).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
}
function periodLocalEpoch(t,zone){const p=periodLocalParts(t,zone);return Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);}
function periodMidnight(nominal,zone){
 let t=nominal;for(let i=0;i<6;i++){const next=nominal-(periodLocalEpoch(t,zone)-t);if(next===t)return t;t=next;}
 // Midnight can be skipped by a timezone transition. Use the first valid
 // instant of that local date rather than oscillating across the transition.
 let low=nominal-36*3600000,high=nominal+36*3600000;
 while(high-low>1000){const mid=Math.floor((low+high)/2000)*1000,p=periodLocalParts(mid,zone);if(Date.UTC(p.year,p.month-1,p.day)>=nominal)high=mid;else low=mid;}
 return high;
}
function calendarDayStart(key,zone='UTC'){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(key))return NaN;
 const nominal=Date.parse(`${key}T00:00:00Z`);
 return Number.isFinite(nominal)&&new Date(nominal).toISOString().slice(0,10)===key?periodMidnight(nominal,zone||'UTC'):NaN;
}
function graphPeriodBounds(t,period,zone='UTC'){
 zone ||= 'UTC';const p=periodLocalParts(t,zone),size={minute:60000,quarter_hour:900000,hour:3600000}[period];
 if(size){const local=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second),a=t-(local%size)-(t%1000);return [a,a+size];}
 let nominal=Date.UTC(p.year,p.month-1,period==='month'?1:p.day);let next;
 if(period==='week'){const day=new Date(nominal).getUTCDay();nominal-=((day+6)%7)*86400000;next=nominal+7*86400000;}
 else if(period==='month')next=Date.UTC(p.year,p.month,1);
 else next=nominal+86400000;
 return [periodMidnight(nominal,zone),periodMidnight(next,zone)];
}
const periodCalendarModes=['today','week','month','quarter','year'];
const periodPresetHours={'1h':1,'6h':6,'12h':12,'24h':24,'48h':48,'7d':168,'14d':336,'30d':720,'90d':2160,'365d':8760};
function periodDateTime(t,zone='UTC'){
 const p=periodLocalParts(t,zone),pad=n=>String(n).padStart(2,'0');
 return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}
function parsePeriodDateTime(value,zone='UTC',edge='start',previous){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))return NaN;
 if(Number.isFinite(previous)&&periodDateTime(previous,zone)===value)return previous;
 const nominal=Date.parse(value+'Z');if(!Number.isFinite(nominal)||periodDateTime(nominal,'UTC')!==value)return NaN;
 // Collect the offsets on both sides of a transition. Reject skipped local
 // times; repeated times include both occurrences unless editing an existing bound.
 const candidates=new Set();
 for(let h=-48;h<=48;h+=6){const sample=nominal+h*3600000,offset=periodLocalEpoch(sample,zone)-sample,candidate=nominal-offset;if(periodDateTime(candidate,zone)===value)candidates.add(candidate);}
 const times=[...candidates].sort((a,b)=>a-b);return times.length?(edge==='end'?times.at(-1):times[0]):NaN;
}
function chooseCustomGraphPeriod(host,start,end){
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>366*86400000)return false;
 resetGraphPeriod(host);host._periodMode='custom';host._periodHours=(end-start)/3600000;host._periodEnd=end;
 publishTimeframe(host);host._reloadPeriod();return true;
}
function timeframeSyncConfig(config,{draft=false}={}){
 if(!draft){
  if(config.sync_timeframe!==undefined&&typeof config.sync_timeframe!=='boolean')throw Error('sync_timeframe must be a boolean. / Tijdvak synchroniseren moet aan of uit zijn.');
  for(const key of ['hover_sync_group','timeframe_sync_group'])if(config[key]!=null&&typeof config[key]!=='string')throw Error(`${key} must be text. / De synchronisatiegroep moet tekst zijn.`);
 }
 return {sync_timeframe:config.sync_timeframe??false,hover_sync_group:config.hover_sync_group??config.timeframe_sync_group??''};
}
function timeframeGroup(host){return host._config?.sync_timeframe===true?((host._config.hover_sync_group??host._config.timeframe_sync_group)?.trim()||'default'):null;}
function timeframeGroups(){
 const root=globalThis.window??globalThis,key=Symbol.for('eleven-cards.timeframe-sync.v1');
 return root[key]??=new Map();
}
function applyTimeframe(host,selection){
 // Default is a group-wide reset to each card's own configured range (or
 // native price window), rather than a copy of the sender's hours.
 if(selection.mode==='configured'&&selection.offset===0){resetGraphPeriod(host);return;}
 host._sharedTimeframe=selection;
 Object.assign(host,{_periodMode:selection.mode,_periodHours:selection.hours,_periodEnd:selection.end,_periodOffset:selection.offset,_periodAnchor:selection.anchor});
}
function disconnectTimeframeSync(host){
 host._disconnectTimeframeSync?.();host._disconnectTimeframeSync=null;
}
function connectTimeframeSync(host){
 disconnectTimeframeSync(host);
 const group=timeframeGroup(host);if(group===null||!host._connected)return;
 const groups=timeframeGroups();let entry=groups.get(group);
 if(!entry){entry={selection:null,listeners:new Set()};groups.set(group,entry);}
 const receive=(selection,source)=>{
  if(source===host||host._sharedTimeframe===selection)return;
  applyTimeframe(host,selection);host._reloadPeriod();
 };
 entry.listeners.add(receive);
 host._disconnectTimeframeSync=()=>entry.listeners.delete(receive);
 // Joining never publishes this card's default over an existing selection.
 if(entry.selection)applyTimeframe(host,entry.selection);
}
function publishTimeframe(host){
 const group=timeframeGroup(host);if(group===null||!host._connected)return;
 const entry=timeframeGroups().get(group);if(!entry)return;
 const selection={group,mode:host._periodMode,hours:host._periodHours??host._config.hours_to_show,
  end:host._periodEnd,offset:host._periodOffset,anchor:host._periodAnchor,zone:host._hass?.config?.time_zone||'UTC',at:Date.now()};
 selection.range=localGraphPeriodRange(host,selection.at);
 entry.selection=selection;applyTimeframe(host,selection);
 for(const receive of entry.listeners)receive(selection,host);
}
function resetGraphPeriod(host){host._sharedTimeframe=null;host._periodMode='configured';host._periodHours=null;host._periodEnd=null;host._periodOffset=0;host._periodAnchor=null;host._periodMenuOpen=false;host._periodMenuPending=false;host._periodCustomDraft=null;host._periodTab=null;host._insightPending=null;}
function graphPeriodRange(host,now=Date.now()){
 const shared=host._sharedTimeframe;
 if(shared&&timeframeGroup(host)===shared.group){
  // One clock and timezone for the whole group, including separate bundles.
  // Live selections advance together on the minute; historical ranges stay fixed.
  if(shared.offset===0&&shared.end==null&&(Math.floor(now/60000)!==Math.floor(shared.at/60000))){
   shared.at=now;shared.range=localGraphPeriodRange({_periodMode:shared.mode,_periodHours:shared.hours,_periodOffset:0,_hass:{config:{time_zone:shared.zone}}},now);
  }
  return {...shared.range};
 }
 return localGraphPeriodRange(host,now);
}
function localGraphPeriodRange(host,now){
 const mode=host._periodMode,offset=host._periodOffset??0;
 if(periodCalendarModes.includes(mode)){
  const zone=host._hass?.config?.time_zone||'UTC',p=periodLocalParts(host._periodAnchor??now,zone);
  let nominal,finishNominal;
  if(mode==='week'){
   nominal=Date.UTC(p.year,p.month-1,p.day);nominal+=(offset*7-(new Date(nominal).getUTCDay()+6)%7)*86400000;finishNominal=nominal+7*86400000;
  }else if(mode==='month'||mode==='quarter'){
   const size=mode==='quarter'?3:1,month=(mode==='quarter'?Math.floor((p.month-1)/3)*3:p.month-1)+offset*size;
   nominal=Date.UTC(p.year,month,1);finishNominal=Date.UTC(p.year,month+size,1);
  }else if(mode==='year'){nominal=Date.UTC(p.year+offset,0,1);finishNominal=Date.UTC(p.year+offset+1,0,1);}
  else{nominal=Date.UTC(p.year,p.month-1,p.day+offset);finishNominal=nominal+86400000;}
  const start=periodMidnight(nominal,zone),finish=periodMidnight(finishNominal,zone);
  return {start,end:Math.max(start+1,Math.min(now,finish))};
 }
 const end=host._periodEnd??now;
 return {start:end-(host._periodHours??host._config.hours_to_show)*3600000,end};
}
function chooseGraphPeriod(host,value){
 const calendar=value==='configured'||periodCalendarModes.includes(value),hours=periodPresetHours[value]??Number(value);
 if(!calendar&&(!Number.isFinite(hours)||hours<1||hours>8760))return;
 resetGraphPeriod(host);
 host._periodMode=calendar?value:Object.entries(periodPresetHours).find(([,h])=>h===hours)?.[0]??String(value);
 if(!calendar)host._periodHours=hours;
 publishTimeframe(host);
 return host._reloadPeriod();
}
function moveGraphPeriod(host,direction){
 if(![-1,0,1].includes(direction))return;
 if(host._periodMode==='custom'){
  if(direction===0){host._periodEnd=null;host._periodOffset=0;}
  else{const end=(host._periodEnd??Date.now())+direction*host._periodHours*3600000;host._periodEnd=direction>0?Math.min(Date.now(),end):end;host._periodOffset=(host._periodOffset??0)+direction;}
  host._periodCustomDraft=null;host._periodTab=null;host._sharedTimeframe=null;publishTimeframe(host);return host._reloadPeriod();
 }
 if(direction===0){host._periodOffset=0;host._periodEnd=null;host._periodAnchor=null;}
 else{
  const previous=host._periodOffset??0;
  const calendar=periodCalendarModes.includes(host._periodMode);
  if(previous===0)host._periodAnchor=calendar?Date.now():host._status==='ready'?(host._end??Date.now()):Date.now();
  host._periodOffset=Math.min(0,previous+direction);
  if(host._periodOffset===0)host._periodAnchor=null;
  if(!calendar){
   host._periodEnd=host._periodOffset===0?null:host._periodAnchor+host._periodOffset*(host._periodHours??host._config.hours_to_show)*3600000;
  }
 }
 host._sharedTimeframe=null;
 publishTimeframe(host);
 return host._reloadPeriod();
}






const periodEscape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function compactPeriodName({start,end,mode,past,zoomed,hours,name,locale,zone}){
 const format=options=>new Intl.DateTimeFormat(locale,{timeZone:zone,...options});
 const dates=format({year:'numeric',month:'numeric',day:'numeric'});
 const parts=t=>Object.fromEntries(dates.formatToParts(t).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
 const a=parts(start),b=parts(end),currentYear=parts(Date.now()).year;
 const dayMonth=format({day:'numeric',month:'short'}),dayYear=format({day:'numeric',month:'short',year:'numeric'});
 const sameDay=a.year===b.year&&a.month===b.month&&a.day===b.day;
 const dateRange=(from,to)=>{
  const first=parts(from),last=parts(to),year=first.year!==currentYear?` ${first.year}`:'';
  if(first.year!==last.year)return `${dayYear.format(from)}–${dayYear.format(to)}`;
  if(first.month===last.month)return `${first.day===last.day?'':`${first.day}–`}${dayMonth.format(to)}${year}`;
  return `${dayMonth.format(from)}–${dayMonth.format(to)}${year}`;
 };
 if(mode==='custom'||zoomed||(past&&!['today','week','month','quarter','year'].includes(mode)&&hours<24)){
  const time=format({hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  if(sameDay){
   const offsets=format({timeZoneName:'shortOffset'}),offset=t=>offsets.formatToParts(t).find(p=>p.type==='timeZoneName')?.value;
   const clock=offset(start)!==offset(end)?format({hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZoneName:'shortOffset'}):time;
   return `${(a.year===currentYear?dayMonth:dayYear).format(start)} · ${clock.format(start)}–${clock.format(end)}`;
  }
  if(end-start<48*3600000)return `${(a.year===b.year&&a.year===currentYear?dayMonth:dayYear).format(start)} ${time.format(start)}–${(a.year===b.year&&a.year===currentYear?dayMonth:dayYear).format(end)} ${time.format(end)}`;
  return dateRange(start,end);
 }
 if(mode==='month'){const month=format({month:'long',year:'numeric'}).format(start);return month[0].toLocaleUpperCase(locale)+month.slice(1);}
 if(mode==='quarter')return `Q${Math.ceil(a.month/3)} ${a.year}`;
 if(mode==='year')return String(a.year);
 if(mode==='week')return dateRange(start,Math.max(start,end-1));
 if(mode==='today')return past?dateRange(start,Math.max(start,end-1)):name;
 if(past)return `${dateRange(start,end)} · ${hours>=168&&hours%24===0?`${hours/24} ${locale==='nl-NL'?'dagen':'days'}`:`${hours} ${locale==='nl-NL'?'uur':hours===1?'hour':'hours'}`}`;
 return name;
}
function periodControls(host,language='en',{popupNavigation=false,tabVariant=''}={}){
 const active=host.shadowRoot.activeElement;
 if(!host._periodMenuPending)host._periodFocus=null;
 if(active?.closest?.('.header-actions'))host._periodFocus=active.dataset.periodTab!=null?`tab:${active.dataset.periodTab}`:active.dataset.customField!=null?`custom:${active.dataset.customField}`:active.dataset.periodOption!=null?`option:${active.dataset.periodOption}`:active.dataset.zoom!=null?`zoom:${active.dataset.zoom}`:active.classList.contains('history-link')?'history':active.dataset.period;
 if(host._config.show_navigation===false){host._periodMenuOpen=false;host._periodMenuPending=false;return {};}
 const previousMenu=host.shadowRoot.querySelector('.period-menu');
 if(previousMenu){
  if(!host._periodMenuPending)host._periodMenuScroll=previousMenu.scrollTop;
  host._periodMenuOpen=!!host._periodMenuPending||(typeof previousMenu.showPopover==='function'?previousMenu.matches(':popover-open'):previousMenu.hasAttribute('data-fallback-open'));
 }
 const nl=language.startsWith('nl'),label=(en,nlText)=>nl?nlText:en,mode=host._periodMode??'configured',past=(host._periodOffset??0)<0;
 const standard=label(`Default (${host._config.hours_to_show} hours)`,`Standaard (${host._config.hours_to_show} uur)`);
 const rolling=[['1h',1],['6h',6],['12h',12],['24h',24],['48h',48],['7d',168],['14d',336],['30d',720],['90d',2160],['365d',8760]].map(([id,hours])=>[id,hours<168?label(`${hours} ${hours===1?'hour':'hours'}`,`${hours} uur`):label(`${hours/24} days`,`${hours/24} dagen`),hours<168?`${hours} ${nl?'u':'h'}`:`${hours/24} d`]);
 const calendar=[['today',label('Today','Vandaag'),label('Day','Dag')],['week',label('This week','Deze week'),label('Week','Week')],['month',label('This month','Deze maand'),label('Month','Maand')],['quarter',label('This quarter','Dit kwartaal'),label('Quarter','Kwartaal')],['year',label('This year','Dit jaar'),label('Year','Jaar')]];
 const calendarChoice=calendar.find(([id])=>id===mode);
 if(!calendarChoice&&mode!=='configured'&&mode!=='custom'&&host._periodHours!=null&&!rolling.some(([id])=>id===mode))rolling.push([mode,label(`${host._periodHours} hours`,`${host._periodHours} uur`)]);
 const selectedStandard=label(`Default (${host._periodHours??host._config.hours_to_show} hours)`,`Standaard (${host._periodHours??host._config.hours_to_show} uur)`);
 const name=mode==='configured'?selectedStandard:calendarChoice?.[past?2:1]??rolling.find(([id])=>id===mode)?.[1]??standard;
 const tabIds=['rolling','calendar','custom'];
 const selectedTab=host._periodMenuOpen&&tabIds.includes(host._periodTab)?host._periodTab:mode==='custom'?'custom':calendarChoice?'calendar':'rolling';
 host._periodTab=selectedTab;
 const choice=([value,text,compact])=>uiButton({variant:'surface',content:`<span>${periodEscape(compact??text)}</span><span aria-hidden="true">${value===mode?'✓':''}</span>`,attrs:{role:'menuitemradio','aria-checked':value===mode,tabindex:-1,'aria-label':text,title:text,'data-period-option':value}});

 const {start,end}=host._status==='ready'&&Number.isFinite(host._viewStart)&&Number.isFinite(host._viewEnd)?{start:host._viewStart,end:host._viewEnd}:graphPeriodRange(host);
 const locale=nl?'nl-NL':'en-GB',zone=host._hass?.config?.time_zone||'UTC';
 const zoomed=host._status==='ready'&&(start>host._start+1||end<host._end-1);
 const compactName=compactPeriodName({start,end,mode,past,zoomed,hours:host._periodHours??host._config.hours_to_show,name,locale,zone});
 const format=new Intl.DateTimeFormat(locale,{timeZone:zone,day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZoneName:'shortOffset'});
 const range=`${format.format(start)} – ${format.format(end)}`;
 const customRange=graphPeriodRange(host),draft=host._periodCustomDraft??{start:periodDateTime(customRange.start,zone),end:periodDateTime(customRange.end,zone)};
 const canGoNext=mode==='custom'?host._periodEnd!=null&&customRange.end<Date.now():past;
 const custom=`<form data-custom-range><div class="period-custom-fields">${[['start',label('Start','Begin')],['end',label('End','Einde')]].map(([key,text])=>`<label>${text}<input type="datetime-local" name="${key}" data-custom-field="${key}" value="${periodEscape(draft[key])}" step="60" required></label>`).join('')}</div><p class="period-custom-zone">${periodEscape(zone)}</p><p class="period-custom-error" role="alert"${draft.error?'':' hidden'}>${periodEscape(draft.error??'')}</p>${uiButton({variant:'surface',type:'submit',text:label('Apply','Toepassen'),attrs:{'data-custom-field':'apply'}})}</form>`;
 const contents=uiTabs({id:'eleven-period',variant:tabVariant,label:label('Period type','Soort tijdvak'),selected:selectedTab,className:'period-tabs',panelClassName:'period-panel',items:[
  {value:'rolling',label:label('Last','Afgelopen'),content:`<div class="period-options" role="menu" aria-label="${label('Last','Afgelopen')}">${rolling.map(choice).join('')}</div>`},
  {value:'calendar',label:label('Calendar','Kalender'),content:`<div class="period-options period-calendar" role="menu" aria-label="${label('Calendar','Kalender')}">${calendar.map(([id,text])=>choice([id,text])).join('')}</div>`},
  {value:'custom',label:label('Custom range','Eigen bereik'),content:custom,className:'period-custom'}
 ].map(item=>({...item,tabAttrs:{'data-period-tab':item.value},panelAttrs:{'data-period-panel':item.value}}))});
 const navigation=[['previous',label('Previous period','Vorige periode')],['now',label('Return to the current period','Terug naar de huidige periode')],['next',label('Next period','Volgende periode')]].map(([key,title])=>uiButton({text:key==='now'?label('Now','Nu'):'',content:key==='now'?undefined:cardHeaderIcon(key),disabled:key==='next'&&!canGoNext,title,label:title,attrs:{'data-period':key}})).join('');
 const popup=uiPopup({id:'eleven-period-menu',className:'period-menu',title:label('Timeframe','Tijdvak'),label:label('Choose a period','Kies een periode'),closeLabel:label('Close','Sluiten'),closeAttrs:{'data-period':'close'},content:`<div class="period-current-range">${periodEscape(range)}${zoomed?`<span class="zoom-status">${label('Zoomed in','Ingezoomd')}</span>`:''}</div><div class="period-default" role="menu" aria-label="${label('Default','Standaard')}">${choice(['configured',standard])}</div>${contents}${popupNavigation?`<div class="period-menu-navigation" role="group" aria-label="${label('Period navigation','Periode navigeren')}">${navigation}</div>`:''}`});
 const trigger=uiButton({className:'period-trigger',content:`<span>${periodEscape(compactName)}</span>${cardHeaderIcon('down')}`,attrs:{'data-period':'menu','aria-haspopup':'dialog','aria-controls':'eleven-period-menu','aria-expanded':host._periodMenuOpen===true,title:range,'aria-label':label('Timeframe','Tijdvak')+': '+compactName,'aria-description':range+(zoomed?'. '+label('Zoomed in','Ingezoomd'):'')}});

 return {picker:`<div class="period-controls">${trigger}${popup}</div>`,navigation};

}
function restorePeriodFocus(host,items=[]){
 const key=host._periodFocus;if(!key)return;const root=host.shadowRoot;
 const target=key.startsWith('tab:')?root.querySelector(host._periodMenuOpen?'[data-period-tab="'+key.slice(4)+'"]':'[data-period="menu"]'):key.startsWith('custom:')&&host._periodMenuOpen?root.querySelector('[data-custom-field="'+key.slice(7)+'"]'):key==='history'?root.querySelector('.history-link'):key.startsWith('zoom:')?root.querySelector('[data-zoom="'+key.slice(5)+'"]'):key.startsWith('option:')&&host._periodMenuOpen?items.find(item=>item.dataset.periodOption===key.slice(7)):root.querySelector('[data-period="'+(key.startsWith('option:')?'menu':key)+'"]');
 (target?.disabled?root.querySelector('[data-period="now"], [data-zoom="in"]:not(:disabled), .history-link'):target)?.focus?.({preventScroll:true});host._periodFocus=null;
}
function disconnectPeriodControls(host,preserveState=false){host._periodMenuCleanup?.();host._periodMenuCleanup=null;if(!preserveState)host._periodMenuPending=false;}
function bindPeriodControls(host){
 disconnectPeriodControls(host,true);
 const root=host.shadowRoot,nav=root.querySelector('.period-controls');if(!nav){restorePeriodFocus(host);return;}
 const menu=nav.querySelector('.period-menu'),trigger=nav.querySelector('[data-period="menu"]'),items=[...menu.querySelectorAll('[data-period-option]')];
 const nl=(host._hass?.language??'en').startsWith('nl'),label=(en,nlText)=>nl?nlText:en;
 const form=menu.querySelector('form[data-custom-range]'),tabs=[...menu.querySelectorAll('[data-period-tab]')],panels=[...menu.querySelectorAll('[data-period-panel]')];
 const visibleItems=()=>items.filter(item=>!item.closest?.('[data-period-panel]')?.hidden);
 const updateOptionFocus=()=>{
  const visible=visibleItems();for(const item of items)item.tabIndex=-1;
  const standard=visible.find(item=>item.dataset.periodOption==='configured');if(standard)standard.tabIndex=0;
  const options=visible.filter(item=>item!==standard),selected=options.find(item=>item.getAttribute('aria-checked')==='true')??options[0];if(selected)selected.tabIndex=0;
 };
 updateOptionFocus();
 const cleanups=[];
 const listen=(target,event,handler,capture=false)=>{target?.addEventListener?.(event,handler,capture);cleanups.push(()=>target?.removeEventListener?.(event,handler,capture));};
 host._periodMenuCleanup=()=>cleanups.splice(0).forEach(remove=>remove());
 let scrollPending=false;
 const controller=bindUIPopup({trigger,popup:menu,container:nav,ready:root.querySelector('ha-card')?.updateComplete,
  isRequested:()=>host._periodMenuOpen,isCurrent:()=>root.querySelector('.period-menu')===menu,
  beforeOpen:()=>closeOtherCardPopups(host,'period'),
  onOpen:focus=>{host._periodMenuOpen=true;host._periodMenuPending=true;scrollPending=!focus;},
  onClose:()=>{host._periodMenuOpen=false;host._periodMenuPending=false;},
  onToggle:open=>{host._periodMenuOpen=open;},
  focusTarget:()=>visibleItems().find(item=>item.getAttribute('aria-checked')==='true')??tabs.find(tab=>tab.getAttribute('aria-selected')==='true')??items[0],
  onShown:()=>{host._periodMenuPending=false;restorePeriodFocus(host,items);if(scrollPending){menu.scrollTop=host._periodMenuScroll??0;scrollPending=false;}}
 });
 const {open,close,position}=controller;cleanups.push(()=>controller.disconnect());
 trigger.onkeydown=e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();open();if(e.key==='ArrowUp')visibleItems().at(-1)?.focus({preventScroll:true});}};
 for(const item of items)item.onclick=()=>{close(true);chooseGraphPeriod(host,item.dataset.periodOption);};
 const tabController=bindUITabs({tabs,panels,onSelect:value=>{
  host._periodTab=value;updateOptionFocus();host._periodMenuScroll=0;menu.scrollTop=0;position();
 }});cleanups.push(()=>tabController.disconnect());
 if(form?.tagName==='FORM'){
  const fields=Object.fromEntries(['start','end'].map(key=>[key,form.elements.namedItem(key)]));
  const readDraft=()=>host._periodCustomDraft={start:fields.start.value,end:fields.end.value};
  listen(form,'input',()=>{readDraft();const error=form.querySelector('.period-custom-error');error.hidden=true;error.textContent='';});
  listen(form,'submit',e=>{
   e.preventDefault();const draft=readDraft(),zone=host._hass?.config?.time_zone||'UTC',previous=graphPeriodRange(host);
   const start=parsePeriodDateTime(draft.start,zone,'start',previous.start),end=parsePeriodDateTime(draft.end,zone,'end',previous.end);
   let message;
   if(!Number.isFinite(start)||!Number.isFinite(end))message=label('Choose valid dates and times in the displayed timezone.','Kies geldige datums en tijden in de getoonde tijdzone.');
   else if(end<=start)message=label('End must be after start.','Einde moet na begin liggen.');
   else if(end-start>366*86400000)message=label('Choose a range of at most 366 days.','Kies een bereik van maximaal 366 dagen.');
   if(message){draft.error=message;const error=form.querySelector('.period-custom-error');error.textContent=message;error.hidden=false;position();return;}
   close(true);chooseCustomGraphPeriod(host,start,end);
  });
 }
 menu.onkeydown=e=>{
  if(e.target?.closest?.('.period-custom, .period-tabs'))return;
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
   const visible=visibleItems();if(!visible.length)return;e.preventDefault();const index=visible.indexOf(host.shadowRoot.activeElement),next=e.key==='Home'?0:e.key==='End'?visible.length-1:index<0?(e.key==='ArrowUp'?visible.length-1:0):(index+(e.key==='ArrowDown'?1:-1)+visible.length)%visible.length;
   visible[next].focus();
  }
 };
 for(const [key,direction]of [['previous',-1],['next',1],['now',0]])for(const button of root.querySelectorAll(`[data-period="${key}"]`))button.onclick=()=>{close();moveGraphPeriod(host,direction);};
 if(host._periodMenuOpen)open(false);
 if(!host._periodMenuPending)restorePeriodFocus(host,items);
}
function periodControlsStyles(){return uiTabsStyles()+`
.period-menu-navigation{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:12px;margin-top:12px;border-top:1px solid var(--divider-color,#ddd)}
.period-menu-navigation>[data-period]{width:36px;height:32px}.period-menu-navigation>[data-period=now]{width:auto;padding:4px 12px}
.period-controls{display:flex;min-width:0;max-width:100%;flex:0 1 auto}
.header-actions .period-trigger{width:auto;min-width:0;max-width:100%;flex:0 1 auto;gap:6px;padding:4px 10px;border:0;border-radius:4px;background:transparent;font-weight:400}
.header-actions .period-trigger:hover{background:color-mix(in srgb,var(--primary-text-color,#20252b) 12%,var(--ha-card-background,var(--card-background-color,#fff)))}
.period-trigger span{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.period-current-range{font-size:11px;line-height:1.5;color:var(--secondary-text-color,#666);font-variant-numeric:tabular-nums;overflow-wrap:anywhere;margin:2px 0 10px}
.period-current-range .zoom-status{display:table;margin-top:4px}
.period-tabs{margin:10px 0 0}
.period-menu:has([data-ui-card-tabs]){font-size:inherit;line-height:inherit}
.period-panel{padding-top:12px}
.period-options{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;margin-bottom:0}
.period-options button{position:relative;justify-content:center;padding:7px 3px;gap:0;min-width:0;white-space:nowrap}
.period-options button>span:last-child{position:absolute;inset-inline-end:2px;top:1px;font-size:9px;line-height:1}
.period-calendar{grid-template-columns:repeat(3,minmax(0,1fr))}
.period-custom-fields{display:grid;gap:10px}
.period-custom-fields label{display:grid;gap:4px;font-size:12px}
.period-custom input{box-sizing:border-box;width:100%;min-width:0;padding:8px;border:1px solid var(--divider-color,#ddd);border-radius:5px;font:inherit;color:var(--primary-text-color,#20252b);background:var(--ha-card-background,var(--card-background-color,#fff));color-scheme:inherit}
.period-custom input:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:-1px}
.period-custom p{font-size:11px;line-height:1.5;color:var(--secondary-text-color,#666);margin:8px 0;overflow-wrap:anywhere}
.period-custom .period-custom-error{color:var(--error-color,#db4437)}
.period-custom button[type="submit"]{justify-content:center;margin-top:10px}
`;}

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


const WEATHER_BACKGROUNDS=HEADER_BACKGROUNDS;
const weatherBackgroundStyles=headerBackgroundStyles;

// Liquid glass and Neon: complete icon families for HA weather conditions.
let weatherStyledArtId=0;
function weatherStyledArt(requestedKind,style,idPrefix='wx-styled'){
 const kinds=['sun','night','partly','cloud','rain','pouring','lightning','storm','snow','sleet','hail','fog','wind','wind-cloud','exceptional'];
 const kind=kinds.includes(requestedKind)?requestedKind:'unknown';
 const id=idPrefix+'-'+(++weatherStyledArtId),paint=name=>`url(#${id}-${name})`;
 const sun=`<g class="wxi-sun"><g class="wxi-rays" stroke="#ffd37b" stroke-width="3" stroke-linecap="round">${Array.from({length:12},(_,i)=>`<path transform="rotate(${i*30} 80 60)" d="M80 18v-7"/>`).join('')}</g><circle class="wxi-core" cx="80" cy="60" r="29" fill="${paint('sun')}" stroke="#ffe5ae"/><path class="wxi-highlight" d="M59 57a22 22 0 0 1 28-18" stroke="#fff7d4" stroke-width="3.5" stroke-linecap="round"/></g>`;
 const cloud=`<g class="wxi-cloud-layer"><path class="wxi-cloud" d="M39 109C10 107 15 68 43 68C43 28 100 22 113 63C146 59 152 106 121 109Z" fill="${paint('cloud')}" stroke="#e1f2ff" stroke-width="1.6"/><path class="wxi-highlight" d="M50 66C53 41 91 39 101 60" stroke="#ffffffbe" stroke-width="3" stroke-linecap="round"/><path class="wxi-shadow" d="M33 95c20 10 63 12 95 0" stroke="#43689430" stroke-width="5"/></g>`;
 const moon=`<g class="wxi-moon"><path class="wxi-core" d="M108 91C70 108 42 62 68 29C19 42 25 110 72 114C88 116 101 106 108 91Z" fill="${paint('moon')}" stroke="#e7e8ff" stroke-width="1.5"/><path class="wxi-highlight" d="M48 55C40 80 58 99 74 101" stroke="#fff9" stroke-width="3" stroke-linecap="round"/></g><g class="wxi-stars" fill="#e5dfff"><path d="m113 27 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z"/><circle cx="130" cy="73" r="2.3"/><circle cx="88" cy="15" r="1.7"/></g>`;
 const rain=(heavy=false)=>`<g class="wxi-rain${heavy?' wxi-heavy':''}" stroke="#7bcaff" stroke-width="${heavy?5:4}" stroke-linecap="round">${(heavy?[38,59,80,101,122]:[49,80,111]).map((x,i)=>`<path class="wxi-drop" style="--wxi-delay:${-i*.4}s" d="m${x} 117-5 11"/>`).join('')}</g>`;
 const snow=`<g class="wxi-snow" stroke="#cfecff" stroke-width="2" stroke-linecap="round">${[49,80,111].map((x,i)=>`<path class="wxi-flake" style="--wxi-delay:${-i*1.2}s" d="M${x} 117v14m-7-7h14m-12-5 10 10m-10 0 10-10"/>`).join('')}</g>`;
 const hail='<g class="wxi-hail" fill="#d2ecff" stroke="#ecf7ff" stroke-width="1.5"><circle class="wxi-pellet" cx="48" cy="122" r="4"/><circle class="wxi-pellet" cx="80" cy="129" r="4"/><circle class="wxi-pellet" cx="112" cy="120" r="4"/></g>';
 const bolt=`<path class="wxi-bolt" d="m89 94-24 28h17l-8 20 29-32H87l9-16Z" fill="${paint('sun')}" stroke="#ffe9ae"/>`;
 const wind='<g class="wxi-wind" stroke="#9ad8ed" stroke-width="4" stroke-linecap="round"><path d="M24 56h76c25 0 25-25 7-25"/><path d="M18 78h106c24 0 24 25 5 25"/><path d="M38 101h45c21 0 21 23 4 23"/></g>';
 const fog='<g class="wxi-fog" stroke="#b6cadc" stroke-width="4" stroke-linecap="round"><path d="M26 108h108m-94 13h80m-66 13h64"/></g>';
 const warning=`<g class="wxi-warning"><path d="M73 28a8 8 0 0 1 14 0l49 86a8 8 0 0 1-7 12H31a8 8 0 0 1-7-12Z" fill="${paint('sun')}" fill-opacity=".3" stroke="#ffd37b" stroke-width="3"/><path d="M80 58v34m0 13v3" stroke="#ffe4a7" stroke-width="5" stroke-linecap="round"/></g>`;
 const unknown='<g class="wxi-unknown" stroke="currentColor"><circle cx="80" cy="75" r="42" stroke-width="2" stroke-dasharray="4 7"/><path d="M67 64c0-20 27-20 27-2 0 12-14 10-14 24m0 12v2" stroke-width="4" stroke-linecap="round"/></g>';
 const bodies={sun,night:moon,partly:`<g transform="translate(10 -5) scale(.85)">${sun}</g>`+cloud,cloud,rain:cloud+rain(),pouring:cloud+rain(true),lightning:cloud+bolt,storm:cloud+rain()+bolt,snow:cloud+snow,sleet:cloud+`<g class="wxi-sleet">${snow}${rain()}</g>`,hail:cloud+hail,fog:`<g transform="translate(15 0) scale(.82)">${cloud}</g>`+fog,wind,'wind-cloud':`<g transform="translate(21 -8) scale(.72)">${cloud}</g><g transform="translate(0 47) scale(1 .7)">${wind}</g>`,exceptional:warning,unknown};
 const accent=kind==='unknown'?'#9da5b4':kind==='night'?'#b3a6ff':['rain','pouring'].includes(kind)?'#73c3ff':['snow','sleet','hail'].includes(kind)?'#a7e2ff':['lightning','storm'].includes(kind)?'#b1a0ff':['cloud','fog','wind','wind-cloud'].includes(kind)?'#98c5df':'#ffc760';
 return `<svg class="weather-icon wxi-icon wxi-${style==='neon'?'neon':'glass'}" data-icon-kind="${kind}" style="--wxi-accent:${accent}" viewBox="0 0 160 150" fill="none" aria-hidden="true" focusable="false"><defs><radialGradient id="${id}-sun" cx=".3" cy=".2" r=".95"><stop stop-color="#fff5cb"/><stop offset=".45" stop-color="#ffd36f"/><stop offset="1" stop-color="#e58d30"/></radialGradient><linearGradient id="${id}-cloud" x2=".15" y2="1"><stop stop-color="#fff" stop-opacity=".95"/><stop offset=".45" stop-color="#d1e9ff" stop-opacity=".8"/><stop offset="1" stop-color="#668bab" stop-opacity=".7"/></linearGradient><linearGradient id="${id}-moon" x2=".6" y2="1"><stop stop-color="#f5edff"/><stop offset="1" stop-color="#8d8ad8"/></linearGradient><radialGradient id="${id}-halo"><stop stop-color="${accent}" stop-opacity=".6"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs><circle class="wxi-halo" cx="80" cy="73" r="66" fill="${paint('halo')}"/><g class="wxi-body">${bodies[kind]}</g><path class="wxi-glint" d="m118 49 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="#fff"/></svg>`;
}
const weatherStyledIconStyles=`
.content:is([data-icon-style=glass],[data-icon-style=neon]) .hero{min-height:210px}.content:is([data-icon-style=glass],[data-icon-style=neon]) .art{inset:40px 0 0}.content:is([data-icon-style=glass],[data-icon-style=neon]) .art svg{width:210px;height:168px}
@container(max-width:320px){.content:is([data-icon-style=glass],[data-icon-style=neon]) .hero{min-height:190px}.content:is([data-icon-style=glass],[data-icon-style=neon]) .art svg{width:180px;height:150px}}
.content[data-compact=true]:is([data-icon-style=glass],[data-icon-style=neon]) .hero{min-height:132px}.content[data-compact=true]:is([data-icon-style=glass],[data-icon-style=neon]) .art{inset:38px 0 0}.content[data-compact=true]:is([data-icon-style=glass],[data-icon-style=neon]) .art svg{width:120px;height:94px}
.content[data-dark=false] .wxi-icon{--wxi-stroke:#946500}.content[data-dark=false] .wxi-icon:is([data-icon-kind=cloud],[data-icon-kind=fog],[data-icon-kind=wind],[data-icon-kind=wind-cloud]){--wxi-stroke:#416c88}.content[data-dark=false] .wxi-icon:is([data-icon-kind=rain],[data-icon-kind=pouring],[data-icon-kind=snow],[data-icon-kind=sleet],[data-icon-kind=hail]){--wxi-stroke:#24799e}.content[data-dark=false] .wxi-icon:is([data-icon-kind=night],[data-icon-kind=lightning],[data-icon-kind=storm]){--wxi-stroke:#6e55ac}
.wxi-icon{overflow:visible;color:var(--secondary-text-color,#9da5b4)}.wxi-glint{display:none}.wxi-rays{transform-origin:80px 60px;animation:wxi-spin 30s linear infinite}.wxi-cloud-layer{animation:wxi-float 6s ease-in-out infinite}.wxi-moon{animation:wxi-float 8s ease-in-out infinite}.wxi-stars{animation:wxi-twinkle 4s ease-in-out infinite alternate}.wxi-drop{animation:wxi-rain 1.6s linear infinite;animation-delay:var(--wxi-delay,0s)}.wxi-heavy .wxi-drop{animation-duration:1.05s}.wxi-bolt{animation:wxi-light 5s ease-in-out infinite}.wxi-flake{animation:wxi-snow 4s linear infinite;animation-delay:var(--wxi-delay,0s)}.wxi-pellet{animation:wxi-hail 2s ease-in infinite}.wxi-pellet:nth-child(2){animation-delay:-.7s}.wxi-pellet:nth-child(3){animation-delay:-1.3s}.wxi-fog{animation:wxi-fog 7s ease-in-out infinite}.wxi-wind{stroke-dasharray:85 160;animation:wxi-wind 4s linear infinite}
.wxi-sleet .wxi-flake:nth-child(2),.wxi-sleet .wxi-drop:first-child,.wxi-sleet .wxi-drop:last-child{display:none}
.wxi-glass .wxi-body{filter:drop-shadow(0 8px 5px #07162540)}.wxi-glass .wxi-glint{display:block;transform-origin:118px 58px;animation:wxi-glint 4s ease-in-out infinite}.wxi-glass .wxi-halo{opacity:.25}.wxi-glass .wxi-cloud{stroke-width:2.2}
.wxi-neon .wxi-core,.wxi-neon .wxi-cloud{fill:transparent;stroke:var(--wxi-stroke,var(--wxi-accent));stroke-width:2.3;stroke-dasharray:180 24;animation:wxi-trace 9s linear infinite}.wxi-neon .wxi-body{filter:drop-shadow(0 0 4px var(--wxi-stroke,var(--wxi-accent)))}.wxi-neon .wxi-highlight{opacity:.25}.wxi-neon .wxi-shadow{display:none}.wxi-neon .wxi-halo{opacity:.18}.wxi-neon .wxi-rays{stroke:var(--wxi-stroke,var(--wxi-accent));stroke-width:2}.wxi-neon .wxi-rain,.wxi-neon .wxi-snow,.wxi-neon .wxi-wind,.wxi-neon .wxi-fog{stroke:var(--wxi-stroke,var(--wxi-accent))}.wxi-neon .wxi-warning path:first-child,.wxi-neon .wxi-pellet{fill:transparent}
.wxi-icon:is([data-icon-kind=unknown],[data-icon-kind=exceptional]) .wxi-glint{display:none}
@keyframes wxi-spin{to{transform:rotate(360deg)}}@keyframes wxi-float{50%{transform:translate(3px,-4px)}}@keyframes wxi-twinkle{to{opacity:.3}}@keyframes wxi-rain{0%{transform:translate(2px,-4px);opacity:0}20%,70%{opacity:1}100%{transform:translate(-4px,12px);opacity:0}}@keyframes wxi-light{0%,100%{opacity:.4}60%{opacity:1}}@keyframes wxi-glint{0%,70%,100%{opacity:.2;transform:scale(.55)}35%{opacity:.95;transform:scale(1.15)}}@keyframes wxi-trace{to{stroke-dashoffset:-204}}@keyframes wxi-snow{0%{transform:translate(-2px,-4px);opacity:0}20%,70%{opacity:1}100%{transform:translate(3px,8px);opacity:0}}@keyframes wxi-hail{0%,100%{transform:translateY(-4px);opacity:.3}65%{transform:translateY(8px);opacity:1}80%{transform:translateY(3px)}}@keyframes wxi-fog{50%{transform:translateX(5px);opacity:.55}}@keyframes wxi-wind{to{stroke-dashoffset:-245}}
.content[data-animated=false] .wxi-icon *{animation:none!important}
@media(prefers-reduced-motion:reduce){.wxi-icon *{animation:none!important}}
`;


const weatherAtmosphere=headerAtmosphere;
// Background selection never changes the header or illustration dimensions.
const weatherAtmosphereStyles=headerAtmosphereStyles;





const weatherStyles=`
:host{display:block;min-width:0;container-type:inline-size;font:inherit}
*{box-sizing:border-box}ha-card{display:block;overflow:hidden;border-radius:var(--ha-card-border-radius,12px);background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#20252b);font:inherit}
.content{position:relative;isolation:isolate;padding:var(--eleven-card-padding,16px);--tone:#536b82}.content[data-dark=true]{--tone:#a8c9eb}
.content[data-kind=sun],.content[data-kind=partly]{--tone:#946800}.content[data-dark=true]:is([data-kind=sun],[data-kind=partly]){--tone:#f2c451}
.content[data-kind=rain]{--tone:#427fac}.content[data-dark=true][data-kind=rain]{--tone:#82b8e8}
.content[data-kind=night],.content[data-kind=storm]{--tone:#6553a3}.content[data-dark=true]:is([data-kind=night],[data-kind=storm]){--tone:#aca3f1}
.content[data-kind=snow]{--tone:#45858c}.content[data-dark=true][data-kind=snow]{--tone:#a2dce6}
.scene{position:relative;isolation:isolate;margin:-16px -16px 0;padding:16px 16px 16px;overflow:visible}
.hero{min-height:160px;position:relative;display:grid;grid-template-columns:max-content minmax(0,1fr);column-gap:12px;align-content:start;padding-top:6px}
.temperature{font-size:76px;font-weight:500;line-height:1.15;letter-spacing:-.065em;font-variant-numeric:tabular-nums;margin-top:-20px}.temperature .unit{font-size:.53em;letter-spacing:-.03em;margin-left:2px}
header{text-align:right;min-width:0;padding-top:17px;margin-top:-20px;z-index:1}h2{font-size:18px;font-weight:650;line-height:1.25;margin:0;color:color-mix(in srgb,var(--tone) 88%,#fff);overflow-wrap:anywhere}.feels{font-size:11px;line-height:1.4;color:var(--secondary-text-color,#666);margin-top:2px}.feels strong{font-weight:600;color:var(--primary-text-color)}
.art{position:absolute;inset:46px 0 0;display:grid;place-items:center;pointer-events:none;color:var(--secondary-text-color)}.art svg{height:116px;width:150px;filter:drop-shadow(0 8px 14px color-mix(in srgb,var(--tone) 25%,transparent))}
button{font:inherit;color:inherit;cursor:pointer}.status,.metric{background:var(--secondary-background-color,#eee);border-radius:7px;padding:12px}.status{display:flex;gap:12px;align-items:center;width:100%;text-align:left;border:0;min-height:0;margin:16px 0 0}.status-icon{flex:none;display:grid;place-items:center;width:38px;height:38px;border-radius:10px;color:var(--tone);background:color-mix(in srgb,var(--tone) 13%,transparent)}.status-icon svg{width:30px;height:30px}.status strong{font-size:13px;line-height:1.4;font-weight:600}.status small{display:block;font-size:11px;color:var(--secondary-text-color,#666);margin-top:2px}
.metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:0}.metrics:has(.metric:only-child){grid-template-columns:minmax(0,1fr)}.metric{min-width:0;display:grid;grid-template-rows:auto auto;gap:2px;align-content:start}.metric dt{font-size:11px;line-height:1.4;color:var(--secondary-text-color,#666);margin:0;overflow-wrap:anywhere}.metric dd{font-size:24px;line-height:1.25;font-weight:650;letter-spacing:-.03em;font-variant-numeric:tabular-nums;margin:0;overflow-wrap:anywhere}
.forecast{margin-top:16px}.forecast h3{font-size:11px;font-weight:400;line-height:1.4;color:var(--secondary-text-color,#666);margin:0 0 10px}.forecast-list{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(46px,1fr);gap:6px;overflow-x:auto;scrollbar-width:thin;padding:0 0 3px;list-style:none;margin:0}.forecast-list li{text-align:center;min-width:0}.forecast-list time{font-size:11px;color:var(--secondary-text-color,#666)}.forecast-list svg{display:block;width:38px;height:36px;margin:4px auto}.forecast-value{font-size:18px;line-height:1.35;font-weight:600;letter-spacing:-.02em;white-space:nowrap;font-variant-numeric:tabular-nums}.forecast-low,.rain-chance{font-size:11px;line-height:1.4;color:var(--secondary-text-color,#666);min-height:16px;margin-top:3px}.rain-chance{color:var(--tone)}
.notice{font-size:12px;line-height:1.5;color:var(--secondary-text-color,#666);margin:10px 0}.retry{background:transparent;color:var(--primary-color,#2196f3);border:0;min-height:32px;padding:4px 0}.status:focus-visible,.retry:focus-visible,.forecast-list:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:2px}.status:hover{filter:brightness(1.05)}
@container(max-width:320px){.hero{min-height:150px}.temperature{font-size:65px;margin-top:-17px}header{margin-top:-17px;padding-top:14px}.art svg{height:100px}.forecast-list{grid-auto-columns:minmax(46px,1fr)}}
@supports(grid-template-rows:subgrid){.metrics{grid-template-rows:auto auto;row-gap:2px}.metric{grid-row:span 2;grid-template-rows:subgrid}}
.forecast-panel{padding-top:16px}.forecast-panel[hidden]{display:none!important}
.metric-entity{font:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;background:none;border:0;padding:0;text-align:start;max-width:100%;overflow-wrap:anywhere}.metric-entity:hover{color:var(--primary-color)}.metric-entity:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px;border-radius:3px}
.status>span:last-child{min-width:0;overflow-wrap:anywhere}.status-label{display:block;font-size:11px;line-height:1.4;color:var(--secondary-text-color);margin-bottom:2px}.status-data strong{font-size:24px;line-height:1.25;font-weight:650;letter-spacing:-.03em;font-variant-numeric:tabular-nums}.status-icon ha-icon{--mdc-icon-size:22px}
.content[data-compact=true] .hero{min-height:112px}
.content[data-compact=true] .temperature{font-size:64px;margin-top:-16px}
.content[data-compact=true] header{padding-top:14px;margin-top:-16px}
.content[data-compact=true] .art{inset:38px 0 0}
.content[data-compact=true] .art svg{height:74px;width:100px;filter:drop-shadow(0 5px 10px color-mix(in srgb,var(--tone) 20%,transparent))}
.content[data-compact=true] .scene{padding-bottom:12px}
.content:not(:has(.weather-metrics)) .scene{padding-bottom:0}
.content[data-compact=true] .status{padding:10px;gap:10px;margin-top:12px}
.content[data-compact=true] .status-data strong{font-size:22px}
.content[data-compact=true] .status-icon{width:32px;height:32px;border-radius:8px}
.content[data-compact=true] .status-icon svg{width:26px;height:26px}
.content[data-compact=true] .metrics{column-gap:12px}
.content[data-compact=true] .metric{padding:10px}
.content[data-compact=true] .metric dd{font-size:22px}
.content[data-compact=true] .forecast{margin-top:12px}
.content[data-compact=true] .forecast-panel{padding-top:12px}
.content[data-compact=true] .forecast-list svg{width:32px;height:30px;margin:2px auto}
@container(max-width:320px){.content[data-compact=true] .hero{min-height:104px}.content[data-compact=true] .art svg{height:66px}.content[data-compact=true] .temperature{font-size:56px;margin-top:-14px}.content[data-compact=true] header{margin-top:-14px;padding-top:12px}}
.forecast-extra{font-size:11px;line-height:1.4;margin-top:5px;color:var(--primary-text-color)}.forecast-label{display:block;overflow-wrap:anywhere;font-size:10px;color:var(--secondary-text-color)}
${weatherBackgroundStyles}

.wx-rays{transform-origin:70px 55px}.wx-corona{transform-origin:70px 55px}
@media(prefers-reduced-motion:no-preference){
 .content[data-animated=true] .wx-rays{animation:wx-rotate 24s linear infinite}
 .content[data-animated=true] .wx-corona{animation:wx-glow 5s ease-in-out infinite}
 .content[data-animated=true] .wx-cloud{animation:wx-float 6s ease-in-out infinite}
 .content[data-animated=true] .wx-drop{animation:wx-rain 1.5s linear infinite}
 .content[data-animated=true] .wx-flake{animation:wx-snow 4s ease-in-out infinite}
 .content[data-animated=true] .wx-drop-two{animation-delay:-.5s}
 .content[data-animated=true] .wx-drop-three{animation-delay:-1s}
 .content[data-animated=true] .wx-moon{animation:wx-float 7s ease-in-out infinite}
 .content[data-animated=true] .wx-star{animation:wx-twinkle 4s ease-in-out infinite}
 .content[data-animated=true] .wx-star-two{animation-delay:-1.5s}
 .content[data-animated=true] .wx-star-three{animation-delay:-2.5s}
 .content[data-animated=true] .wx-wind path{stroke-dasharray:90 160;animation:wx-wind 4s linear infinite}
 .content[data-animated=true] .wx-wind path:nth-child(2){animation-delay:-1.2s}
 .content[data-animated=true] .wx-wind path:nth-child(3){animation-delay:-2.4s}
 .content[data-animated=true] .wx-fog{animation:wx-fog 7s ease-in-out infinite}
 .content[data-animated=true] .wx-lightning{animation:wx-lightning 5s ease-in-out infinite}
}
@keyframes wx-rotate{to{transform:rotate(360deg)}}
@keyframes wx-glow{50%{transform:scale(1.12);opacity:.6}}
@keyframes wx-float{50%{transform:translate(3px,-2px)}}
@keyframes wx-rain{0%{transform:translate(2px,-3px);opacity:0}15%,75%{opacity:1}100%{transform:translate(-4px,12px);opacity:0}}
@keyframes wx-snow{0%{transform:translate(-2px,-2px);opacity:0}20%,70%{opacity:1}100%{transform:translate(4px,9px);opacity:0}}
@keyframes wx-twinkle{50%{opacity:.35}}
@keyframes wx-wind{to{stroke-dashoffset:-250}}
@keyframes wx-fog{50%{transform:translateX(5px);opacity:.55}}
@keyframes wx-lightning{0%,50%,100%{opacity:.4}70%,80%{opacity:1}}
${weatherAtmosphereStyles}
${weatherStyledIconStyles}
${headerSceneStyles}
`;

// Retain live nodes, focus, scroll offsets and running SVG animations on telemetry updates.
function patchWeatherDOM(root,markup){
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



const ENERGY_FLOW_BACKGROUNDS=HEADER_BACKGROUNDS;
const energyFlowBackgroundOptions=headerBackgroundOptions;
const energyFlowBackground=headerAtmosphere;
// Shared atmosphere styles are already included through weatherStyles.
const energyFlowBackgroundStyles='';



const energyFlowDutch=hass=>String(hass?.locale?.language??hass?.language??'en').startsWith('nl');
const ENERGY_FLOW_COLORS=[{value:'charging',label:'Goud / Gold'},{value:'waiting',label:'Blauw / Blue'},{value:'done',label:'Groen / Green'},{value:'planned',label:'Paars / Purple'},{value:'off',label:'Grijs / Gray'}];
const energyFlowNumber=value=>value==null||value===''||typeof value==='boolean'||!Number.isFinite(Number(value))?null:Number(value);
function normalizeEnergyFlowConfig(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid energy flow configuration');
 const config={...input,title:typeof input.title==='string'?input.title:'',default_view:input.default_view==='history'?'history':'live',hours_to_show:Math.min(8784,Math.max(1,energyFlowNumber(input.hours_to_show)??24)),show_navigation:true,animate_background:input.animate_background!==false,compact:(input.compact??(input.density==='compact'))===true,grid_power_inverted:input.grid_power_inverted===true};
 for(const key of ['sync_timeframe','show_field_1','show_field_2','show_field_3'])if(input[key]!=null&&typeof input[key]!=='boolean')throw Error('Invalid '+key);
 config.background_strength=input.background_strength==null||!Number.isFinite(Number(input.background_strength))?100:Math.max(0,Math.min(100,Number(input.background_strength)));
 config.color=ENERGY_FLOW_COLORS.some(item=>item.value===input.color)?input.color:'charging';
 config.sync_timeframe=input.sync_timeframe===true;
 const group=input.hover_sync_group??input.timeframe_sync_group;
 if(group!=null&&typeof group!=='string')throw Error('Invalid synchronization group');
 config.hover_sync_group=group?.trim()||'';
 for(let i=1;i<=3;i++)config['show_field_'+i]=input['show_field_'+i]!==false;
 config.background=ENERGY_FLOW_BACKGROUNDS.some(item=>item.value===input.background)?input.background:'lanes';
 // Ignore retired price-graph options in older dashboards.
 delete config.show_prices;delete config.price_card;
 for(const key of ['solar_power_entity','grid_power_entity','grid_import_power_entity','grid_export_power_entity','home_power_entity','price_entity','export_price_entity']){
  if(input[key]&&!(typeof input[key]==='string'&&/^sensor\.[a-z0-9_]+$/.test(input[key])))throw Error('Invalid '+key);
  config[key]=input[key]||'';
 }
 config.detail_view=input.detail_view==='tabs'?'tabs':'popup';
 config.tabs=Array.isArray(input.tabs)?['sun','home','grid'].filter(tab=>input.tabs.includes(tab)):['sun','home','grid'];
 config.custom_tabs=normalizeEntityTabs(input.custom_tabs,2);
 const available=[...(config.detail_view==='tabs'?config.tabs:[]),...config.custom_tabs.filter(tab=>tab.show).map(tab=>tab.id)];
 config.default_tab=available.includes(input.default_tab)?input.default_tab:(available[0]??'');
 return config;
}
const total=values=>values.some(value=>value==null)?null:values.reduce((a,b)=>a+b,0);
const ids=values=>[...new Set(values.filter(value=>typeof value==='string'&&value))];
function energyFlowSources(prefs){
 const sources=Array.isArray(prefs?.energy_sources)?prefs.energy_sources:[];
 return Object.fromEntries(['solar','grid','battery'].map(type=>[type,sources.filter(source=>source?.type===type)]));
}
function energyFlowMeters(prefs){
 const sources=energyFlowSources(prefs);
 const grid=(key,legacy)=>ids(sources.grid.flatMap(source=>source[key]?[source[key]]:(source[legacy]??[]).map(flow=>flow[key])));
 return {solar:ids(sources.solar.map(source=>source.stat_energy_from)),import:grid('stat_energy_from','flow_from'),export:grid('stat_energy_to','flow_to'),discharge:ids(sources.battery.map(source=>source.stat_energy_from)),charge:ids(sources.battery.map(source=>source.stat_energy_to))};
}
const energyFlowStatisticIds=prefs=>ids(Object.values(energyFlowMeters(prefs)).flat());
function energyFlowPower(hass,id){
 const state=hass?.states?.[id],value=energyFlowNumber(state?.state),factor={W:.001,kW:1,MW:1000}[state?.attributes?.unit_of_measurement];
 return value==null||factor==null?null:value*factor;
}
// HA normalizes grid power to positive import and battery power to positive discharge.
function sourcePower(source,hass){
 const read=id=>energyFlowPower(hass,id),config=source.power_config??{};
 if(source.stat_rate)return read(source.stat_rate);
 if(config.stat_rate)return read(config.stat_rate);
 if(config.stat_rate_inverted){const value=read(config.stat_rate_inverted);return value==null?null:-value;}
 if(config.stat_rate_from||config.stat_rate_to){const from=config.stat_rate_from?read(config.stat_rate_from):0,to=config.stat_rate_to?read(config.stat_rate_to):0;return from==null||to==null?null:from-to;}
 return null;
}
const balance=data=>Object.values(data).some(value=>value==null)?null:Math.max(0,data.solar+data.import-data.export+data.discharge-data.charge);
function energyFlowLive(prefs,hass,config={}){
 const sources=energyFlowSources(prefs),read=id=>energyFlowPower(hass,id);
 const solar=config.solar_power_entity?read(config.solar_power_entity):total(sources.solar.map(source=>sourcePower(source,hass)));
 let incoming,outgoing;
 if(config.grid_power_entity){const net=read(config.grid_power_entity),value=net==null?null:net*(config.grid_power_inverted?-1:1);incoming=value==null?null:Math.max(0,value);outgoing=value==null?null:Math.max(0,-value);}
 else if(config.grid_import_power_entity||config.grid_export_power_entity){incoming=config.grid_import_power_entity?read(config.grid_import_power_entity):0;outgoing=config.grid_export_power_entity?read(config.grid_export_power_entity):0;}
 else {const powers=sources.grid.map(source=>sourcePower(source,hass));incoming=total(powers.map(value=>value==null?null:Math.max(0,value)));outgoing=total(powers.map(value=>value==null?null:Math.max(0,-value)));}
 const battery=sources.battery.map(source=>sourcePower(source,hass)),data={solar,import:incoming,export:outgoing,discharge:total(battery.map(value=>value==null?null:Math.max(0,value))),charge:total(battery.map(value=>value==null?null:Math.max(0,-value)))};
 return {...data,home:config.home_power_entity?read(config.home_power_entity):balance(data),battery:sources.battery.length>0};
}
function energyFlowHistorical(prefs,statistics){
 const meters=energyFlowMeters(prefs),sources=energyFlowSources(prefs),data={};
 for(const [key,list] of Object.entries(meters))data[key]=total(list.map(id=>{
  const changes=(Array.isArray(statistics?.[id])?statistics[id]:[]).map(row=>energyFlowNumber(row.change)).filter(value=>value!=null);
  return changes.length?changes.reduce((a,b)=>a+b,0):null;
 }));
 if(sources.solar.some(source=>!source.stat_energy_from))data.solar=null;
 if(sources.grid.some(source=>!source.stat_energy_from&&!source.stat_energy_to&&!(source.flow_from?.length||source.flow_to?.length)))data.import=data.export=null;
 if(sources.battery.some(source=>!source.stat_energy_from))data.discharge=null;
 if(sources.battery.some(source=>!source.stat_energy_to))data.charge=null;
 return {...data,home:balance(data),battery:sources.battery.length>0};
}
function energyFlowStatisticsRequest(prefs,start,end){
 return {type:'recorder/statistics_during_period',start_time:new Date(start).toISOString(),end_time:new Date(Math.min(end,Date.now())).toISOString(),statistic_ids:energyFlowStatisticIds(prefs),period:'hour',units:{energy:'kWh'},types:['change']};
}


function energyFlowGridMeters(prefs){
 return energyFlowSources(prefs).grid.flatMap(source=>['import','export'].flatMap(direction=>{
  const incoming=direction==='import',key=incoming?'stat_energy_from':'stat_energy_to';
  const entries=source[key]?[source]:(source[incoming?'flow_from':'flow_to']??[]);
  return entries.filter(entry=>typeof entry?.[key]==='string'&&entry[key]).map(entry=>({
   direction,energy:entry[key],name:source.name||entry.name,
   cost:entry[incoming?'stat_cost':'stat_compensation'],
   priceEntity:entry[incoming||!source[key]?'entity_energy_price':'entity_energy_price_export'],
   fixedPrice:entry[incoming||!source[key]?'number_energy_price':'number_energy_price_export'],
  }));
 }));
}
function energyFlowDetailIds(prefs,info={}){
 return [...new Set([
  ...energyFlowStatisticIds(prefs),
  ...(prefs?.device_consumption??[]).map(device=>device.stat_consumption),
  ...energyFlowGridMeters(prefs).flatMap(meter=>[meter.energy,meter.cost||info.cost_sensors?.[meter.energy]]),
  ...energyFlowSources(prefs).solar.map(source=>source.stat_energy_from),
 ].filter(id=>typeof id==='string'&&id))];
}
function energyFlowChange(statistics,id){
 const rows=Array.isArray(statistics?.[id])?statistics[id]:[];
 const values=rows.map(row=>energyFlowNumber(row.change)).filter(value=>value!=null);
 return values.length?values.reduce((sum,value)=>sum+value,0):null;
}
function energyFlowDeviceRows(prefs,hass,history,statistics={}){
 const seen=new Set();
 return (Array.isArray(prefs?.device_consumption)?prefs.device_consumption:[]).filter(device=>{
  if(!device?.stat_consumption||seen.has(device.stat_consumption))return false;
  seen.add(device.stat_consumption);return true;
 }).map(device=>{
  const entity=hass?.states?.[device.stat_rate]??hass?.states?.[device.stat_consumption];
  const value=history?energyFlowChange(statistics,device.stat_consumption):energyFlowPower(hass,device.stat_rate);
  return {...device,label:device.name||entity?.attributes?.friendly_name||device.stat_consumption,value:value!=null&&value>=0?value:null};
 }).sort((a,b)=>(b.value??-1)-(a.value??-1)||a.label.localeCompare(b.label));
}
function energyFlowDeviceTotal(rows){
 // Count a nested measurement only when none of its measured ancestors covers it.
 return rows.reduce((sum,row)=>{
  const visited=new Set([row.stat_consumption]);let id=row.included_in_stat;
  while(id&&!visited.has(id)){
   visited.add(id);const parent=rows.find(candidate=>candidate.stat_consumption===id);
   if(!parent)break;if(parent.value!=null)return sum;id=parent.included_in_stat;
  }
  return sum+(row.value??0);
 },0);
}
function energyFlowCurrentPrice(meter,hass){
 if(meter.priceEntity){
  const state=hass?.states?.[meter.priceEntity],value=energyFlowNumber(state?.state);
  const match=String(state?.attributes?.unit_of_measurement??'').match(/^(.+)\/(Wh|kWh|MWh)$/);
  if(value==null||!match)return null;
  const factor={Wh:1000,kWh:1,MWh:.001}[match[2]];
  return {value:value*factor,currency:match[1]==='€'?'EUR':match[1]};
 }
 const value=energyFlowNumber(meter.fixedPrice),currency=hass?.config?.currency;
 return value==null||!currency?null:{value,currency};
}
function energyFlowHistoricalCost(meter,info,statistics,metadata,hass){
 const id=meter.cost||info?.cost_sensors?.[meter.energy];
 const value=energyFlowChange(statistics,id);
 const currency=metadata?.[id]?.unit_of_measurement||hass?.states?.[id]?.attributes?.unit_of_measurement;
 // Do not apply today's price or assume the currency of an external statistic.
 return value==null||!currency?null:{value,currency};
}
function energyFlowSolarRows(prefs,hass,history,statistics){
 return energyFlowSources(prefs).solar.map(source=>({
  label:source.name||hass?.states?.[source.stat_rate]?.attributes?.friendly_name||hass?.states?.[source.stat_energy_from]?.attributes?.friendly_name||source.stat_energy_from,
  value:history?energyFlowChange(statistics,source.stat_energy_from):energyFlowLive({energy_sources:[source]},hass).solar,
 }));
}

// Without storage, generated energy minus export is the solar share of home use.
// Reject inconsistent balances instead of silently clamping them into a convincing percentage.
function energyFlowSolarCoverage(data){
 if(data.battery||![data.solar,data.home,data.export].every(value=>Number.isFinite(value)&&value>=0)||data.export>data.solar)return null;
 const used=data.solar-data.export;
 if(used>data.home+.01)return null;
 if(data.import!=null&&(!Number.isFinite(data.import)||data.import<0||Math.abs(used+data.import-data.home)>.01))return null;
 const own=Math.min(data.home,used);
 return {own,coverage:data.home>0?own/data.home*100:null,selfConsumption:data.solar>0?own/data.solar*100:null};
}



const HOUR=3600000;
function insightTimestamp(value){
 const number=typeof value==='number'?value:Date.parse(value);
 return Number.isFinite(number)?(number<1e12?number*1000:number):null;
}
function insightHours(statistics){
 const hours=new Map();
 for(const [id,rows] of Object.entries(statistics??{}))for(const row of Array.isArray(rows)?rows:[]){
  const start=insightTimestamp(row.start);if(start==null)continue;
  if(!hours.has(start))hours.set(start,{});
  hours.get(start)[id]=[row];
 }
 return [...hours].sort((a,b)=>a[0]-b[0]);
}
// Median of the quietest full hour in each of up to seven complete local nights.
// Requiring all four local hour labels excludes gaps and incomplete nights.
function energyFlowBaseConsumption(prefs,statistics,zone='UTC',end=Date.now()){
 const ids=energyFlowStatisticIds(prefs);if(!ids.length)return null;
 let date;try{date=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'});}catch{return null;}
 const nights=new Map();
 for(const [start,stats] of insightHours(statistics)){
  if(start+HOUR>end||ids.some(id=>energyFlowNumber(stats[id]?.[0]?.change)==null))continue;
  const parts=Object.fromEntries(date.formatToParts(start).map(part=>[part.type,part.value])),hour=Number(parts.hour);
  if(hour<1||hour>=5)continue;
  const home=energyFlowHistorical(prefs,stats).home;if(!Number.isFinite(home)||home<0)continue;
  const day=parts.year+'-'+parts.month+'-'+parts.day;
  if(!nights.has(day))nights.set(day,[]);nights.get(day).push({hour,watts:home*1000});
 }
 const values=[...nights].filter(([,rows])=>[1,2,3,4].every(hour=>rows.some(row=>row.hour===hour))).slice(-7).map(([,rows])=>Math.min(...rows.map(row=>row.watts))).sort((a,b)=>a-b);
 if(values.length<3)return null;
 const middle=Math.floor(values.length/2);
 return {watts:values.length%2?values[middle]:(values[middle-1]+values[middle])/2,nights:values.length};
}

// Preserve hourly tariffs; value gaps at the period's energy-weighted import tariff.
// This is an estimate of consumption value, not an allocation of the household bill.
function energyFlowDeviceCosts(prefs,hass,state={}){
 const meters=energyFlowGridMeters(prefs).filter(meter=>meter.direction==='import'),statistics=state.statistics??{},totals=new Map(),hours=[];
 let periodEnergy=0,periodCost=0,periodCurrency=null,incompatible=false;
 for(const [start,stats] of insightHours(statistics)){
  let energy=0,cost=0,currency=null,known=meters.length>0;
  for(const meter of meters){
   const costId=meter.cost||state.info?.cost_sensors?.[meter.energy],used=energyFlowNumber(stats[meter.energy]?.[0]?.change),paid=energyFlowNumber(stats[costId]?.[0]?.change),unit=state.metadata?.[costId]?.unit_of_measurement||hass?.states?.[costId]?.attributes?.unit_of_measurement;
   if(used==null||used<0){known=false;break;}
   if(used===0){if(paid!=null&&paid!==0)known=false;continue;}
   if(currency&&unit&&unit!==currency){incompatible=true;known=false;break;}
   if(paid==null||!unit){known=false;break;}
   energy+=used;cost+=paid;currency=unit;
  }
  const rate=known&&energy>0?cost/energy:null;
  if(rate!=null){
   if(periodCurrency&&currency!==periodCurrency)incompatible=true;
   periodEnergy+=energy;periodCost+=cost;periodCurrency=currency;
  }
  hours.push({start,stats,rate,currency});
 }
 const average=!incompatible&&periodEnergy>0?periodCost/periodEnergy:null;
 for(const {start,stats,rate,currency} of hours){
  const devices=energyFlowDeviceRows(prefs,hass,true,stats),home=energyFlowHistorical(prefs,stats).home,measured=energyFlowDeviceTotal(devices);
  // Clamping an overmeasured hour to zero would inflate the period's residual costs.
  const other=Number.isFinite(home)&&devices.every(device=>device.value!=null)&&measured<=home+.01?Math.max(0,home-measured):null;
  for(const row of [...devices.map(device=>({id:device.stat_consumption,value:device.value})),{id:'__other',value:other}]){
   if(!totals.has(row.id))totals.set(row.id,{value:0,currency:null,known:!incompatible,energy:0,estimatedEnergy:0,hours:new Set()});
   const total=totals.get(row.id);total.hours.add(start);
   if(row.value==null||row.value<0){total.known=false;continue;}
   if(row.value===0)continue;
   total.energy+=row.value;
   const applied=rate??average,unit=rate==null?periodCurrency:currency;
   if(applied==null||total.currency&&unit!==total.currency){total.known=false;continue;}
   total.value+=row.value*applied;total.currency=unit;
   if(rate==null)total.estimatedEnergy+=row.value;
  }
 }
 // A positive device interval must also be represented among the priced hours.
 const positiveHours=id=>(statistics[id]??[]).filter(row=>energyFlowNumber(row.change)>0).every(row=>{const start=insightTimestamp(row.start);return start!=null&&totals.get(id)?.hours.has(start);});
 const home=energyFlowHistorical(prefs,statistics).home,devices=energyFlowDeviceRows(prefs,hass,true,statistics);
 const residual=Number.isFinite(home)&&devices.every(device=>device.value!=null)?Math.max(0,home-energyFlowDeviceTotal(devices)):null;
 return Object.fromEntries([...totals].map(([id,total])=>{
  const consistent=id==='__other'?residual!=null&&Math.abs(total.energy-residual)<=.01:positiveHours(id);
  return [id,total.known&&consistent?{value:total.value,currency:total.currency??hass?.config?.currency,estimatedShare:total.energy>0?total.estimatedEnergy/total.energy*100:0}:null];
 }));
}







function energyFlowDetailPopup(host,kind,data,{id,attrs={}}={}){
 const nl=String(host._hass?.locale?.language??host._hass?.language??'en').startsWith('nl'),history=host._view==='history';
 const title=kind==='home'?(nl?'Woning':'Home'):kind==='grid'?(nl?'Net':'Grid'):(nl?'Zon':'Solar');
 const mode=history?(nl?'Historisch':'History'):(nl?'Actueel':'Live');
 return uiPopup({id,title:title+' · '+mode,closeLabel:nl?'Sluiten':'Close',attrs:{...attrs,popover:'manual','data-energy-popup':kind},content:`<div class="energy-detail-body" data-detail-view="${history?'history':'live'}">${energyFlowDetailContent(host,kind,data)}</div>`});
}

function energyFlowDetailContent(host,kind,data){
 const nl=String(host._hass?.locale?.language??host._hass?.language??'en').startsWith('nl'),t=(a,b)=>nl?a:b;
 const history=host._view==='history',hass=host._hass,prefs=host._prefs;
 const format=value=>{try{return new Intl.NumberFormat(hass?.locale?.language??hass?.language??'en',{maximumFractionDigits:2}).format(value);}catch{return new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(value);}};
 const reading=(value,suffix=history?'kWh':'kW')=>value==null?'—':suffix==='EUR'||suffix.startsWith('EUR/')?'€ '+format(value)+suffix.slice(3):format(value)+(suffix?' '+suffix:'');
 const balanceReading=(share,amount)=>uiEscape((share==null?'':reading(share,'%')+' · ')+reading(amount));
 const note=value=>`<p class="energy-detail-note">${uiEscape(value)}</p>`;
 const heading=label=>`<div class="energy-detail-section"><h3>${uiEscape(label)}</h3></div>`;
 const metric=(label,value,tone='home')=>`<div data-tone="${tone}"><dt>${uiEscape(label)}</dt><dd>${uiEscape(value)}</dd></div>`;
 const deviceMetric=(label,value,total,{tone='home',hint=''}={})=>{
  const comparable=Number.isFinite(value)&&value>=0&&Number.isFinite(total)&&total>0,percent=comparable?value/total*100:null;
  return `<div data-tone="${tone}"><dt>${uiEscape(label)}</dt><dd><strong>${uiEscape(reading(value))}</strong>${percent!=null&&percent<=100?`<small>${uiEscape(reading(percent,'%'))}</small>`:''}</dd>${comparable?`<div class="energy-detail-track" aria-hidden="true"><i style="width:${Math.min(100,percent)}%"></i></div>`:''}${hint?`<small class="energy-home-hint">${uiEscape(hint)}</small>`:''}</div>`;
 };
 const state=host._detailResult??{},stats=state.statistics??{},meta=state.metadata??{};
 let html='';
 if(host._offline())return html+note(t('Geen verbinding met Home Assistant.','Disconnected from Home Assistant.'));
 if(!prefs)return html+note(t('Energy-instellingen worden geladen.','Loading Energy preferences.'));
 if(history&&host._detailLoading)return html+note(t('Detailgegevens laden…','Loading details…'));
 if(history&&host._detailError)return html+note(t('Detailgegevens laden mislukt.','Could not load details.'))+uiButton({variant:'text',text:t('Opnieuw proberen','Retry'),attrs:{'data-detail-retry':true}});
 if(kind==='home'){
  html+=`<dl class="energy-grid-metrics energy-home-summary">${metric(t('Woning totaal','Home total'),reading(data.home))}${metric(t('Geschat basisverbruik','Estimated base consumption'),reading(host._baseResult?.value?.watts??null,'W'))}</dl>`;
  const devices=energyFlowDeviceRows(prefs,hass,history,stats),costs=history?energyFlowDeviceCosts(prefs,hass,state):{};
  if(!devices.length)return html+note(t('Geen afzonderlijke apparaten ingesteld in Home Assistant Energy.','No individual devices configured in Home Assistant Energy.'));
  const costReading=cost=>cost?.currency?reading(cost.value,cost.currency):'—';
  const surface=(label,value,{entity='',cost=null,hint='',id=''}={})=>{
   const share=Number.isFinite(data.home)&&data.home>0?value/data.home*100:null;
   return uiDetailSurface({title:label,entity,actionLabel:t('Details van ','Details for ')+label,percent:share,attrs:{style:'--ui-detail-tone:var(--detail-home)','data-device-stat':id},metrics:[
    {label:t('Aandeel','Share'),value:share==null?null:format(share),unit:'%'},
    {label:history?t('Verbruik','Consumption'):t('Vermogen','Power'),value:reading(value)},
    ...(history?[{label:t('Geschatte kosten','Estimated cost'),value:costReading(cost)}]:[])
   ]})+(hint?`<p class="energy-home-hint">${uiEscape(hint)}</p>`:'');
  };
  if(history)html+=`<label class="energy-device-sort">${t('Sorteren op','Sort by')}<select data-energy-device-sort><option value="energy"${host._deviceSort!=='cost'?' selected':''}>${t('Verbruik','Consumption')}</option><option value="cost"${host._deviceSort==='cost'?' selected':''}>${t('Geschatte kosten','Estimated cost')}</option></select></label>`;
  const ordered=[...devices].sort((a,b)=>history&&host._deviceSort==='cost'?((costs[b.stat_consumption]?.value??-Infinity)-(costs[a.stat_consumption]?.value??-Infinity))||a.label.localeCompare(b.label):(b.value??-1)-(a.value??-1)||a.label.localeCompare(b.label));
  html+='<div class="energy-device-surfaces">';
  for(const device of ordered){
   if(device.value==null||device.value===0)continue;
   const parent=devices.find(item=>item.stat_consumption===device.included_in_stat),id=history?device.stat_consumption:device.stat_rate;
   html+=surface(device.label,device.value,{id:device.stat_consumption,cost:costs[device.stat_consumption],entity:hass?.states?.[id]?id:'',hint:parent?t('Onderdeel van ','Included in ')+parent.label:''});
  }
  const measured=energyFlowDeviceTotal(devices),other=data.home==null?null:Math.max(0,data.home-measured);
  if(other!=null&&other>0)html+=surface(t('Overig','Other'),other,{cost:costs.__other,id:'__other'});
  html+='</div>';
  if(data.home!=null&&measured>data.home+.01)html+=note(t('Apparaatmetingen zijn samen hoger dan het woningtotaal. Meetmomenten of meters kunnen overlappen.','Device measurements exceed the home total. Measurements may overlap or differ in timing.'));
  return html;
 }
 if(kind==='grid'){
  const meters=energyFlowGridMeters(prefs),prices=meters.map(meter=>history?energyFlowHistoricalCost(meter,state.info,stats,meta,hass):energyFlowCurrentPrice(meter,hass));
  const amounts=[],costs=[],gridSurfaces=[];
  for(const direction of ['import','export']){
   const incoming=direction==='import',indices=meters.map((meter,i)=>meter.direction===direction?i:-1).filter(i=>i>=0),value=incoming?data.import:data.export;
   const label=history?(incoming?t('Totale afname','Total import'):t('Totale teruglevering','Total export')):(incoming?t('Actuele afname','Current import'):t('Actuele teruglevering','Current export'));
   const costLabel=incoming?t('Afnamekosten','Import costs'):t('Terugleververgoeding','Export compensation');
   const rateLabel=incoming?t('Actuele afnameprijs','Current import price'):t('Actuele terugleverprijs','Current export price');
   const sameCurrency=indices.length>0&&indices.every(i=>prices[i]&&prices[i].currency===prices[indices[0]].currency);
   const selected=history?{configured:false}:energyFlowSelectedPrice(host,direction);
   const price=selected.configured?selected.price:history&&sameCurrency?{value:indices.reduce((sum,i)=>sum+prices[i].value,0),currency:prices[indices[0]].currency}:indices.length===1?prices[indices[0]]:null;
   amounts.push(metric(label,reading(value),direction));
   if(history){
    const costMetrics=!price&&indices.length>1?indices.map(i=>({label:meters[i].name||hass?.states?.[meters[i].energy]?.attributes?.friendly_name||meters[i].energy,value:prices[i]?reading(prices[i].value,prices[i].currency):'—'})):[{label:costLabel,value:price?reading(price.value,price.currency):'—'}];
    gridSurfaces.push(uiDetailSurface({title:incoming?t('Afname','Import'):t('Teruglevering','Export'),attrs:{style:'--ui-detail-tone:var(--detail-home)'},metrics:[{label,value:reading(value)},...costMetrics]}));
   }
   if(!price&&indices.length>1&&!selected.configured){
    const connections=indices.map(i=>{
     const meter=meters[i],meterPrice=prices[i],name=meter.name||hass?.states?.[meter.energy]?.attributes?.friendly_name||meter.energy;
     return `<div class="energy-grid-connection"><span>${uiEscape(name)}</span><strong>${uiEscape(meterPrice?reading(meterPrice.value,meterPrice.currency+(history?'':'/kWh')):'—')}</strong></div>`;
    }).join('');
    costs.push(`<div data-tone="${direction}"><dt>${uiEscape(history?costLabel:rateLabel)}</dt><dd>${connections}</dd></div>`);
   }else costs.push(metric(history?costLabel:rateLabel,price?reading(price.value,price.currency+(history?'':'/kWh')):'—',direction));
  }
  let net='';
  if(history){
   const known=prices.length>0&&prices.every(price=>price&&price.currency===prices[0].currency);
   const value=known?prices.reduce((sum,price,i)=>sum+(meters[i].direction==='import'?price.value:-price.value),0):null;
   net=`<div class="energy-grid-net"><dt>${t('Netto kosten','Net costs')}</dt><dd>${uiEscape(known?reading(value,prices[0].currency):'—')}</dd></div>`;
  }
  html+=history?`<dl class="energy-grid-metrics energy-grid-summary">${net}</dl><div class="energy-detail-surfaces">${gridSurfaces.join('')}</div>`:`<dl class="energy-grid-metrics">${amounts.join('')}${costs.join('')}</dl>`;
  return html;
 }
 const coverage=energyFlowSolarCoverage(data);
 const percent=value=>reading(value,'%');
 html+=`<dl class="energy-grid-metrics energy-solar-metrics">${metric(t('Zonne-opwek','Solar generation'),reading(data.solar),'solar')}${metric(t('Zon naar net','Solar to grid'),reading(coverage?data.export:null),'export')}</dl><div class="energy-detail-surfaces">${uiDetailSurface({title:t('Zelfvoorziening','Self-sufficiency'),percent:coverage?.coverage,attrs:{style:'--ui-detail-tone:var(--detail-home)'},metrics:[{label:t('Aandeel','Share'),value:percent(coverage?.coverage)},{label:t('Gedekt door zon','Supplied by solar'),value:reading(coverage?.own)},{label:t('Woning totaal','Home total'),value:reading(data.home)}]})}${uiDetailSurface({title:t('Eigen gebruik van opwek','Self-consumed generation'),percent:coverage?.selfConsumption,attrs:{style:'--ui-detail-tone:var(--detail-home)'},metrics:[{label:t('Aandeel','Share'),value:percent(coverage?.selfConsumption)},{label:t('Zelf gebruikt','Self-consumed'),value:reading(coverage?.own)},{label:t('Zonne-opwek','Solar generation'),value:reading(data.solar)}]})}</div>`;
 if(!coverage)html+=note(data.battery?t('Zelfvoorziening onbekend met batterij.','Self-sufficiency unknown with battery.'):t('Zelfvoorziening niet beschikbaar.','Self-sufficiency unavailable.'));
 else if(data.home===0)html+=note(t('Geen woningverbruik.','No home consumption.'));
 const sources=energyFlowSolarRows(prefs,hass,history,stats);
 if(sources.length>1){
  html+=heading(history?t('Opbrengst per bron','Generation by source'):t('Vermogen per bron','Power by source'))+'<dl class="energy-grid-metrics energy-home-devices">';
  for(const source of sources)html+=deviceMetric(source.label,source.value,data.solar,{tone:'solar'});
  html+='</dl>';
 }
 if(!sources.length)html+=note(t('Geen zonnebronnen ingesteld in Energy.','No solar sources configured in Energy.'));

 return html;
}

const energyFlowDetailStyles=uiDetailSurfaceStyles()+`
.energy-detail-surfaces,.energy-device-surfaces{display:grid;gap:10px;margin-top:12px}
.energy-device-sort{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:16px 0 0;font-size:11px;color:var(--secondary-text-color)}
.energy-device-sort select{min-height:32px;max-width:65%;border:1px solid var(--divider-color);border-radius:8px;padding:4px 8px;background:var(--secondary-background-color);color:var(--primary-text-color);font:inherit}
.energy-device-sort select:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px}
@container(max-width:360px){.energy-home-summary dd{font-size:16px}}

:is([data-energy-popup],[data-energy-panel]){border-radius:8px;scrollbar-gutter:stable;scrollbar-width:thin;--detail-value-size:13px;--detail-value-weight:600;--detail-row-space:10px;--detail-bar-height:8px;--detail-bar-radius:8px;--detail-home:var(--house,var(--primary-color,#578d83));--detail-solar:var(--energy-solar-color,var(--solar,#c28a31));--detail-import:var(--energy-grid-consumption-color,var(--grid,#537dc0));--detail-export:var(--energy-grid-return-color,#9576bb)}
:is([data-energy-popup],[data-energy-panel]) .ui-popup-heading>strong{font-size:14px;font-weight:600}
:is([data-energy-popup],[data-energy-panel]) button{border-radius:8px}
.energy-grid-metrics>.energy-grid-net{grid-column:1/-1}
.energy-detail-note{font-size:11px;line-height:1.5;color:var(--secondary-text-color);margin:8px 0;overflow-wrap:anywhere}
:is([data-energy-popup],[data-energy-panel]) [data-tone=import]{--detail-tone:var(--detail-import)}
:is([data-energy-popup],[data-energy-panel]) [data-tone=export]{--detail-tone:var(--detail-export)}
:is([data-energy-popup],[data-energy-panel]) :is([data-tone=home],[data-tone=other]){--detail-tone:var(--detail-home)}
:is([data-energy-popup],[data-energy-panel]) [data-tone=solar]{--detail-tone:var(--detail-solar)}
.energy-detail-section{margin:16px 0 0}.energy-detail-section h3{font-size:12px;font-weight:650;line-height:1.4;margin:0;color:var(--primary-text-color)}
.energy-detail-track,.energy-detail-supply{display:flex;height:var(--detail-bar-height);margin:8px 0 0;border-radius:var(--detail-bar-radius);background:var(--divider-color,#ddd);overflow:hidden}
.energy-detail-track i,.energy-detail-supply i{display:block;height:100%;flex:none;border-radius:0;background:var(--detail-tone)}
.energy-detail-supply [data-supply=solar]{background:var(--detail-solar)}
.energy-detail-supply [data-supply=grid]{background:var(--detail-import)}
.energy-detail-supply [data-supply=import]{background:var(--detail-import)}
.energy-detail-supply [data-supply=export]{background:var(--detail-export)}
.energy-grid-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px 16px;margin:16px 0 0}
.energy-grid-summary{margin-top:0}
.energy-grid-metrics>div{display:grid;grid-template-rows:subgrid;grid-row:span 2;min-width:0}
.energy-grid-metrics>div:nth-child(n+3){padding-top:14px}
.energy-grid-metrics dt{font-size:11px;color:var(--secondary-text-color,#666);overflow-wrap:anywhere;line-height:1.4}
.energy-grid-metrics dd{margin:0;min-width:0;font-size:18px;font-weight:600;line-height:1.35;letter-spacing:-.02em;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.energy-home-total>div{grid-column:1/-1}
.energy-home-devices{display:block;margin-top:8px}
.energy-home-devices>div{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto;gap:6px 12px;align-items:baseline;padding:10px 0;border-bottom:1px solid var(--divider-color,#ddd)}
.energy-home-devices>div:last-child{border-bottom:0}
.energy-home-devices>div:nth-child(n+3){padding-top:10px}
.energy-home-devices dt{grid-column:1;grid-row:1}
.energy-home-devices dd{grid-column:2;grid-row:1;display:grid;grid-template-columns:minmax(0,1fr) 56px;align-items:baseline;gap:8px;text-align:end;min-width:144px;max-width:180px}
.energy-home-devices dd strong{font:inherit;min-width:0}
.energy-home-devices dd small{font-size:13px;font-weight:600;letter-spacing:normal;white-space:nowrap;color:var(--secondary-text-color,#666)}
.energy-home-devices .energy-detail-track{grid-column:1/-1;grid-row:2;margin:0}
.energy-home-hint{grid-column:1/-1;grid-row:3;font-size:11px;font-weight:400;line-height:1.4;overflow-wrap:anywhere;color:var(--secondary-text-color,#666)}
.energy-home-devices>div:not(:has(.energy-detail-track)) .energy-home-hint{grid-row:2}
.energy-grid-connection+.energy-grid-connection{margin-top:8px}
.energy-grid-connection>span{display:block;font-size:11px;font-weight:400;letter-spacing:normal;color:var(--secondary-text-color,#666);line-height:1.4}
.energy-grid-connection>strong{font:inherit}
.energy-grid-legend{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:8px;font-size:11px;line-height:1.4;color:var(--secondary-text-color,#666)}
.energy-grid-legend>span{position:relative;padding-inline-start:15px;overflow-wrap:anywhere}
.energy-grid-legend>span::before{content:'';position:absolute;inset-inline-start:0;top:.35em;width:8px;height:8px;border-radius:2px;background:var(--detail-tone)}
.energy-grid-legend strong{display:block;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--primary-text-color)}
@media(forced-colors:active){.energy-grid-balance [data-supply=import]{background:Highlight;forced-color-adjust:none}.energy-grid-balance [data-supply=export]{background:CanvasText;forced-color-adjust:none}}
button.circle-node:focus-visible{outline-offset:-3px}
@media(forced-colors:active){.energy-detail-track,.energy-detail-supply{background:Canvas;border:1px solid CanvasText}.energy-detail-track i,.energy-detail-supply [data-supply=grid]{background:CanvasText;forced-color-adjust:none}.energy-detail-supply [data-supply=solar]{background:Highlight;forced-color-adjust:none}}
`;

const energyFlowStyles=`
ha-card{border-radius:var(--ha-card-border-radius,12px)}
.content [data-ui-metric]{--ui-metric-radius:8px}
.content [data-ui-button],.content .period-trigger,.content .period-custom input,.content [data-ui-popup]{border-radius:8px}

:host{height:100%;min-height:0}ha-card{height:100%;min-height:0;overflow:auto;overscroll-behavior:auto;scrollbar-width:thin}
.content{--tone:#d9b77c;--solar:#d9b77c;--grid:#91a9c7;--house:#9bc9b2}
.content[data-dark=false]{--tone:#92641c;--solar:#946800;--grid:#356da6;--house:#34785d}
.content[data-color=waiting]{--tone:#82b8e8}.content[data-color=done]{--tone:#7ed79c}.content[data-color=planned]{--tone:#8fa5ff}.content[data-color=off]{--tone:#a7a9b2}
.content[data-dark=false][data-color=waiting]{--tone:#386c9b}.content[data-dark=false][data-color=done]{--tone:#277441}.content[data-dark=false][data-color=planned]{--tone:#4455ad}.content[data-dark=false][data-color=off]{--tone:#656975}
.header-region{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px 12px;align-items:start}
.energy-heading{grid-column:1;grid-row:1;min-width:0;--ui-primary-size:60px;--ui-primary-unit-size:16px}
.energy-heading:has([data-long=true]){--ui-primary-size:34px}
.toolbar{grid-column:2;grid-row:1;display:flex;justify-content:flex-end;align-items:start;max-width:280px;min-width:0;margin:0!important}
.toolbar .header-actions{margin:0;min-width:0;max-width:100%}
.toolbar .chart-controls{flex-wrap:nowrap;justify-content:flex-end;gap:0;min-width:0;max-width:100%}
.toolbar .view-period{display:flex;align-items:center;flex:1 1 auto;flex-wrap:nowrap;gap:0;min-width:0}
.toolbar .chart-controls>[data-period]{flex:none;width:28px;min-width:0;padding:4px}
.toolbar .chart-controls>[data-period=now]{width:30px}
.toolbar .view-period>[data-view-button]{flex:none;min-height:32px;padding:4px 8px;white-space:nowrap}
.toolbar .view-period .period-controls{position:relative;flex:1 1 auto;min-width:0;margin:0;padding:0;border-inline-start:1px solid var(--divider-color,#ddd)}
.toolbar .view-period .period-trigger{width:100%;min-width:0;max-width:190px}
.toolbar .view-period .period-trigger>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.toolbar .view-period .period-trigger svg{width:14px;height:14px}
.circle-flow{grid-column:1/-1;grid-row:2;min-width:0}
.circle-flow *{box-sizing:border-box}
.circle-scene{position:relative;width:100%;aspect-ratio:412/164;margin:0 auto}
.circle-scene foreignObject{overflow:visible}
.circle-scene>svg{display:block;width:100%;height:100%;overflow:visible}
.flow-route[data-route=solar]{color:var(--solar)}
.flow-route[data-route=return]{color:#b4a0db}.content[data-dark=false] .flow-route[data-route=return]{color:#8060b1}
.flow-route[data-route=grid]{color:var(--grid)}
.flow-bed{fill:none;stroke:currentColor;stroke-width:8;stroke-opacity:.16;stroke-linecap:round;stroke-linejoin:round}
.flow-wire{fill:none;stroke:currentColor;stroke-width:2.1;stroke-opacity:.9;stroke-linecap:round;stroke-linejoin:round}
.flow-route[data-active=false] .flow-bed{stroke:var(--divider-color,#ddd);stroke-width:2;stroke-opacity:.7}
.flow-route[data-active=false] .flow-wire{stroke-opacity:.12}
.flow-dot{fill:currentColor;r:3;offset-distance:0%;offset-rotate:0deg;animation:energy-flow-travel var(--route-duration,4s) linear infinite}
.circle-node[data-ui-metric]{--node-ink:var(--ui-metric-tone);width:100%;height:100%;position:relative;isolation:isolate;grid-template-columns:minmax(0,1fr);grid-template-rows:22px 16px;align-content:center;justify-items:center;row-gap:4px;column-gap:0;border:0;border-radius:8px;background:radial-gradient(ellipse at 100% 0%,color-mix(in srgb,var(--node-ink) 10%,transparent),color-mix(in srgb,var(--node-ink) 3%,transparent) 30%,transparent 70%),var(--secondary-background-color,#eee)}
.circle-node[data-ui-metric][data-density] .ui-metric-icon,.circle-node[data-ui-metric][data-density] .ui-metric-icon svg{width:22px;height:22px}
.circle-node .ui-metric-value{display:none}.circle-node[data-ui-metric] .ui-metric-title{grid-column:1;grid-row:2;justify-self:center;text-align:center;font-size:11px;font-weight:500;line-height:16px}
.circle-node[data-ui-metric][data-density] .ui-metric-icon{position:relative;grid-row:1;grid-column:1;justify-self:center;align-self:center;transform:none;color:var(--node-ink);overflow:visible}
.circle-node[data-ui-metric] .ui-metric-icon::before{content:'';position:absolute;inset:-29px -31px;border-radius:50%;background:radial-gradient(ellipse,color-mix(in srgb,var(--node-ink) 13%,transparent),color-mix(in srgb,var(--node-ink) 4%,transparent) 48%,transparent 76%);z-index:-1;pointer-events:none}
.flow-reading{fill:var(--primary-text-color,#20252b);font-family:inherit;font-size:18px;font-weight:600;letter-spacing:-.4px;font-variant-numeric:tabular-nums}.flow-reading[data-long=true]{font-size:12px}.flow-unit{fill:var(--secondary-text-color,#626a78);font-size:11px;font-weight:400;letter-spacing:0}
.flow-arrow{fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}.flow-route[data-active=false] .flow-arrow{opacity:.24}
.header-region>[data-ui-metric]{grid-column:1/-1;grid-row:3}
.flow-secondary{margin-top:12px}
.content[data-animated=false] .flow-dot,.content[data-view=history] .flow-dot{display:none}
:host([data-motion-paused]) .flow-dot{animation-play-state:paused}
.content[data-compact=true] .header-region{row-gap:12px}
.content[data-compact=true] .energy-heading{--ui-primary-size:46px;--ui-primary-unit-size:14px}
@keyframes energy-flow-travel{to{offset-distance:100%}}
@media(prefers-reduced-motion:reduce){.circle-scene .flow-dot{display:none}}
.toolbar .period-menu-navigation{display:none}
@container(max-width:480px){
 .header-region{grid-template-columns:minmax(0,1fr) 100px;column-gap:8px}
 .toolbar{width:100%;max-width:100%;justify-self:end}
 .toolbar .header-actions,.toolbar .chart-controls,.toolbar .view-period{width:100%}
 .toolbar .chart-controls{background:none}
 .toolbar .chart-controls>[data-period]{display:none}
 .toolbar .view-period{flex-direction:column;align-items:stretch;gap:4px}
 .toolbar .view-period>[data-view-button],.toolbar .view-period .period-controls{background:var(--secondary-background-color,#eee);border-radius:8px}
 .toolbar .view-period .period-controls{border:0}
 .toolbar .view-period .period-trigger{padding:4px 6px;gap:3px;min-height:32px}
 .toolbar .view-period .period-trigger>span,.toolbar .view-period>[data-view-button]{font-size:11px}
 .toolbar .period-menu-navigation{display:flex}
 .energy-heading,.content[data-compact=true] .energy-heading{--ui-primary-size:46px;--ui-primary-unit-size:14px}
 .energy-heading:has([data-long=true]){--ui-primary-size:30px}
}
@container(max-width:319px){
 .header-region{row-gap:12px}
 .energy-heading,.content[data-compact=true] .energy-heading{--ui-primary-size:36px;--ui-primary-unit-size:12px}
 .energy-heading:has([data-long=true]){--ui-primary-size:25px}
}
@container(max-width:270px){.energy-heading,.content[data-compact=true] .energy-heading{--ui-primary-size:32px}}
`;

// One stroke family for the diagram and shared metric surfaces.
const energyFlowIconPaths={
 solar:'M3 12h15l2 9H1l2-9ZM4 16h14M7 12l-1 9m7-9 1 9M6 23h9M10 21v2M18 2v2m0 4v2m-4-4h-2m12 0h-2m-7-3-1-1m7 1 1-1M20 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
 sun:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
 grid:'m12 2-7 20m7-20 7 20M8 7h8M6 13h12M3 22h18M12 2v20M8 7l10 6M16 7 6 13',
 home:'m3 10 9-7 9 7M5 9v12h14V9m-6 2-4 6h4l-1 4 4-6h-4l1-4',
 import:'m8 8 6-5 7 5M10 8v13h10V8M2 14h12m-4-4 4 4-4 4',
 export:'m3 8 6-5 6 5M4 8v13h10v-4M10 12h12m-4-4 4 4-4 4'
};
function energyFlowIcon(kind){return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-energy-icon="${kind}"><path d="${energyFlowIconPaths[kind]??energyFlowIconPaths.home}"/></svg>`;}




function energyFlowDiagram(data,history,nl,format,{detailView='popup',tabs=[],id='energy-flow'}={}){
 const text=(a,b)=>nl?a:b,unit=history?'kWh':'kW',number=value=>value==null?'—':format(value);
 const {solar,home,import:incoming,export:outgoing}=data;
 const direction=incoming==null||outgoing==null?'unknown':incoming>0&&outgoing>0?'both':incoming>0?'import':outgoing>0?'export':'idle';
 // Battery storage makes the source of home consumption ambiguous. Do not
 // invent a solar-to-home amount; imported/exported grid totals remain valid.
 const own=data.battery||solar==null||outgoing==null||home==null?null:Math.min(home,Math.max(0,solar-outgoing));
 const returned=data.battery||solar==null||outgoing==null?null:Math.min(solar,Math.max(0,outgoing));
 const total=(own||0)+(incoming||0)+(returned||0);
 const route=(name,path,amount,arrow)=>{
  const active=amount!=null&&amount>0,duration=6-Math.min(1,(amount||0)/Math.max(total,1))*4.5;
  return `<g class="flow-route" data-route="${name}" data-active="${active}"><path class="flow-bed" d="${path}"/><path class="flow-wire" d="${path}"/><path class="flow-arrow" d="${arrow}"/>${active&&!history?`<circle class="flow-dot" r="2.7" style="offset-path:path('${path}');--route-duration:${duration}s"/>`:''}</g>`;
 };
 const node=(kind,label,value,x,tone)=>{
  const aria=kind==='grid'?`${text('Netafname','Grid import')} ${number(incoming)} ${unit}, ${text('Teruglevering','Grid export')} ${number(outgoing)} ${unit}`:`${label}: ${number(value)} ${unit}`;
  return `<foreignObject x="${x-36}" y="68" width="72" height="72"><div xmlns="http://www.w3.org/1999/xhtml" style="height:100%">${uiMetric({action:true,title:label,value:label,iconContent:energyFlowIcon(kind),compact:true,attrs:{class:'circle-node','data-node':kind,'data-direction':kind==='grid'?direction:'','data-active':String(value!=null&&value>0),'data-energy-detail':kind,'aria-haspopup':detailView==='popup'?'dialog':null,'aria-controls':detailView==='tabs'&&tabs.includes(kind)?id+'-tabs-panel-'+kind:null,disabled:detailView==='tabs'&&!tabs.includes(kind),'aria-label':aria,style:`--ui-metric-tone:var(--${tone})`}})}</div></foreignObject>`;
 };
 const reading=(name,value,x,y)=>`<text class="flow-reading" data-flow-value="${name}" data-long="${number(value).length>6}" x="${x}" y="${y}" text-anchor="middle">${uiEscape(number(value))}${value==null?'':`<tspan class="flow-unit"> ${unit}</tspan>`}</text>`;
 return `<div class="circle-flow" role="group" aria-label="${text('Energiestromen tussen zon, woning en net','Energy flows between solar, home and grid')}"><div class="circle-scene"><svg viewBox="4 0 412 164">
  ${route('solar','M66 104H184',own,'M126 100l5 4-5 4')}
  ${route('return','M40 78V18A8 8 0 0 1 48 10H372A8 8 0 0 1 380 18V78',returned,'M126 6l5 4-5 4M289 6l5 4-5 4')}
  ${route('grid','M354 104H236',incoming,'M294 100l-5 4 5 4')}
  ${node('sun',text('Zon','Solar'),solar,40,'solar')}${node('home',text('Woning','Home'),home,210,'house')}${node('grid',text('Net','Grid'),incoming==null||outgoing==null?null:incoming+outgoing,380,'grid')}
  ${reading('return',returned,210,36)}${reading('solar',own,128,89)}${reading('grid',incoming,292,89)}
 </svg></div></div>`;
}



function energyFlowMetrics(data,history,nl,format,compact=false,config={}){
 const text=(a,b)=>nl?a:b,unit=history?'kWh':'kW';
 const field=(key,title,icon,tone,info)=>uiMetric({title,iconContent:energyFlowIcon(icon),value:data[key]==null?null:format(data[key]),unit,info,compact,attrs:{'data-metric':key,style:`--ui-metric-tone:var(--${tone})`}});
 return {
  solar:config.show_field_1===false?'':field('solar',text('Zonne-energie','Solar generation'),'solar','solar',history?text('Opwek in gekozen periode','Generation in selected period'):text('Opwek op dit moment','Generation right now')),
  grid:config.show_field_2===false&&config.show_field_3===false?'':`<div class="flow-secondary" data-ui-metric-grid style="--ui-metric-columns:${config.show_field_2===false||config.show_field_3===false?1:2}">${config.show_field_2===false?'':field('import',text('Netafname','Grid import'),'import','grid',history?text('Afgenomen in gekozen periode','Imported in selected period'):text('Van net naar woning','From grid to home'))}${config.show_field_3===false?'':field('export',text('Teruglevering','Grid export'),'export','solar',history?text('Teruggeleverd in gekozen periode','Exported in selected period'):text('Terug naar het net','Returned to the grid'))}</div>`
 };
}





const ENERGY_FLOW_TABS=[{value:'sun',nl:'Zon',en:'Solar'},{value:'home',nl:'Woning',en:'Home'},{value:'grid',nl:'Net',en:'Grid'}];
function energyFlowTabs(host,data,nl){
 const items=host._config.detail_view==='tabs'?ENERGY_FLOW_TABS.filter(tab=>host._config.tabs.includes(tab.value)).map(tab=>({value:tab.value,label:tab[nl?'nl':'en'],content:`<div data-energy-panel="${tab.value}"><div class="energy-detail-body" aria-busy="${host._view==='history'&&!!host._detailLoading}">${energyFlowDetailContent(host,tab.value,data)}</div></div>`})):[];
 for(const [index,tab] of host._config.custom_tabs.entries())if(tab.show)items.push({value:tab.id,label:tab.title||(nl?'Eigen tabblad ':'Custom tab ')+(index+1),content:entityTabContent(tab,host._hass,nl)});
 if(!items.length){host._activeTab=null;return '';}
 if(!items.some(tab=>tab.value===host._activeTab))host._activeTab=items.find(tab=>tab.value===host._config.default_tab)?.value??items[0].value;
 if(items.length===1)return `<div data-energy-tabs><section id="${uiEscape(host._id+'-tabs-panel-'+encodeURIComponent(items[0].value))}" class="energy-tab-panel energy-single-tab" aria-label="${uiEscape(items[0].label)}">${items[0].content}</section></div>`;
 return `<div data-energy-tabs>${uiTabs({variant:'card',id:host._id+'-tabs',label:nl?'Energiegegevens':'Energy information',items,selected:host._activeTab,className:'energy-tabs',panelClassName:'energy-tab-panel'})}</div>`;
}
const energyFlowTabStyles=`
[data-energy-tabs]{min-width:0}
.energy-tab-panel{margin:0;padding:16px 0 0;border:0;min-width:0}
.energy-single-tab{margin-top:16px}
.energy-tab-panel>.energy-grid-metrics:first-child,.energy-tab-panel .energy-detail-body>.energy-grid-metrics:first-child{margin-top:0}
.energy-entity-value{font:inherit;color:inherit;text-align:start;overflow-wrap:anywhere;border:0;background:none;padding:0;cursor:pointer;border-radius:8px}
.energy-entity-value:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
@container(max-width:300px){.energy-home-devices dd{min-width:0;max-width:none;grid-template-columns:minmax(0,1fr) auto;font-size:15px}.energy-home-devices dd small{font-size:11px}}
`;





class EnergyFlowEditor extends customTabsEditor(HTMLElement){
 constructor(){super();this._customTabMaxDecimals=2;this.attachShadow({mode:'open'});}
 setConfig(config){this._config=normalizeEnergyFlowConfig(config);this._render();}
 set hass(hass){this._hass=hass;this._render();}get hass(){return this._hass;}
 _emitConfig(){this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:structuredClone(this._config)},bubbles:true,composed:true}));}
 _setCustomTabs(tabs){this._config=normalizeEnergyFlowConfig({...this._config,custom_tabs:tabs});this._render();this._emitConfig();}
 _render(){
  if(!this._config||!this._hass)return;
  const nl=energyFlowDutch(this._hass),text=(a,b)=>nl?a:b;
  const labels={detail_view:text('Details tonen als','Show details as'),tabs:text('Zichtbare tabbladen','Visible tabs'),default_tab:text('Standaardtabblad','Default tab'),color:text('Accentkleur','Accent color'),background_strength:text('Achtergrondsterkte','Background intensity'),sync_timeframe:text('Tijdvak synchroniseren','Synchronize timeframe'),hover_sync_group:text('Synchronisatiegroep','Synchronization group'),show_field_1:text('Zonne-energie tonen','Show solar generation'),show_field_2:text('Netafname tonen','Show grid import'),show_field_3:text('Teruglevering tonen','Show grid export'),title:text('Onderschrift hoofdwaarde','Primary value subtitle'),default_view:text('Standaardweergave','Default view'),background:text('Achtergrond','Background'),compact:text('Compacte weergave','Compact layout'),animate_background:text('Achtergrond animeren','Animate background'),hours_to_show:text('Uren bij standaardperiode','Hours in default period'),solar_power_entity:text('Totaal zonnevermogen','Total solar power'),grid_power_entity:text('Netvermogen (positief = afname)','Grid power (positive = import)'),grid_power_inverted:text('Teken van eigen netvermogen omkeren','Invert custom grid power'),grid_import_power_entity:text('Afzonderlijk afnamevermogen','Separate import power'),grid_export_power_entity:text('Afzonderlijk terugleververmogen','Separate export power'),home_power_entity:text('Gemeten totaal woningvermogen','Measured total home power')};
  const select=(name,options)=>({name,selector:{select:{mode:'dropdown',options}}}),bool=name=>({name,selector:{boolean:{}}}),entity=name=>({name,selector:{entity:{domain:'sensor',device_class:'power'}}}),group=(name,title,schema,expanded=false)=>({type:'expandable',flatten:true,name,title,schema,expanded});
  const schema=[group('general',text('Algemeen','General'),[{name:'title',selector:{text:{}}},select('default_view',[{value:'live',label:text('Actueel','Live')},{value:'history',label:text('Historisch','History')}])],true),group('appearance',text('Weergave','Appearance'),[select('color',ENERGY_FLOW_COLORS.map(item=>({...item,label:item.label.split(' / ')[nl?0:1]}))),select('background',energyFlowBackgroundOptions(nl)),{name:'background_strength',selector:{number:{min:0,max:100,step:5,mode:'slider',unit_of_measurement:'%'}}},bool('animate_background'),bool('compact'),bool('show_field_1'),bool('show_field_2'),bool('show_field_3')]),group('power',text('Actueel vermogen · optionele afwijkende sensoren','Live power · optional sensor overrides'),[entity('solar_power_entity'),entity('home_power_entity'),entity('grid_power_entity'),...(this._config.grid_power_entity?[bool('grid_power_inverted')]:[entity('grid_import_power_entity'),entity('grid_export_power_entity')])]),group('history',text('Historische gegevens','Historical data'),[{name:'hours_to_show',selector:{number:{min:1,max:8784,step:1,mode:'box'}}},bool('sync_timeframe'),...(this._config.sync_timeframe?[{name:'hover_sync_group',selector:{text:{}}}]:[])])];
  Object.assign(labels,{price_entity:text('Huidige afnameprijs · optioneel','Current import price · optional'),export_price_entity:text('Huidige terugleverprijs · optioneel','Current export price · optional')});
  schema.push(group('prices',text('Prijzen','Prices'),[{name:'price_entity',selector:{entity:{domain:'sensor'}}},{name:'export_price_entity',selector:{entity:{domain:'sensor'}}}]));
  const builtins=ENERGY_FLOW_TABS.map(tab=>({value:tab.value,label:tab[nl?'nl':'en']}));
  const defaults=[...(this._config.detail_view==='tabs'?builtins.filter(tab=>this._config.tabs.includes(tab.value)):[]),...this._config.custom_tabs.filter(tab=>tab.show).map((tab,i)=>({value:tab.id,label:tab.title||text('Eigen tabblad ','Custom tab ')+(i+1)}))];
  schema.push(group('tab_settings',text('Tabbladen','Tabs'),[select('detail_view',[{value:'popup',label:text('Pop-ups','Popups')},{value:'tabs',label:text('Tabbladen','Tabs')}]),...(this._config.detail_view==='tabs'?[{name:'tabs',selector:{select:{multiple:true,mode:'list',options:builtins}}}]:[]),...(defaults.length?[select('default_tab',defaults)]:[])],true));
  if(!this._form){
   this.shadowRoot.innerHTML='<style>:host,ha-form{display:block;min-width:0}p{font-size:12px;line-height:1.5;color:var(--secondary-text-color);margin:0 0 12px}h3{font-size:16px;margin:24px 0 12px}details{border:1px solid var(--divider-color);border-radius:8px;margin:12px 0;min-width:0}summary{padding:12px;min-height:44px;cursor:pointer;overflow-wrap:anywhere}.tab-body{padding:0 12px 12px}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}button{font:inherit;min-height:44px;border:1px solid var(--divider-color);border-radius:8px;padding:8px 12px;background:var(--card-background-color);color:var(--primary-text-color);cursor:pointer}button:disabled{opacity:.4}button:focus-visible,summary:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}</style><p></p><ha-form></ha-form><h3></h3><p class="tabs-help"></p><div class="custom-tabs"></div><button type="button" data-action="tab-add"></button>';
   this._form=this.shadowRoot.querySelector('ha-form');this._form.addEventListener('value-changed',event=>{event.stopPropagation();const value=event.detail.value,next={...this._config,...value};this._config=normalizeEnergyFlowConfig(next);this._render();this._emitConfig();});
   this.shadowRoot.querySelector('[data-action=tab-add]').onclick=()=>this._customAction('tab-add');
  }
  this.shadowRoot.querySelector('p').textContent=text('Bronnen worden automatisch uit het Home Assistant Energy-dashboard gelezen. Historisch gebruikt Recorder in kWh. Actueel gebruikt de ingestelde vermogenssensoren in W of kW. Kies hieronder alleen afwijkende sensoren als dat nodig is. Een eigen zonne- of netsensor moet alle bijbehorende bronnen samen meten; een eigen woningvermogensensor meet het volledige woningverbruik.','Sources are read automatically from the Home Assistant Energy dashboard. History uses Recorder in kWh. Live uses configured power sensors in W or kW. Override sensors only when needed. A solar or grid override must measure all corresponding sources combined; a home override must measure the entire home.');
  this._form.hass=this._hass;const key=JSON.stringify([nl,schema]);if(key!==this._schemaKey){this._schemaKey=key;this._form.schema=schema;this._form.computeLabel=item=>labels[item.name]??item.name;}this._form.computeHelper=item=>({default_tab:text('Opent bij het laden. Handmatige tabkeuze blijft behouden bij sensorupdates.','Opens on load. Manual tab selection is preserved during sensor updates.'),animate_background:text('Schakelt beweging in voor geanimeerde achtergronden en de actuele energiestroom. Verminderde beweging wordt gerespecteerd.','Enables motion for animated backgrounds and live energy flow. Respects reduced motion.'),color:text('Vaste kleur voor de achtergrond. Tabbladen volgen de themakleur; zon, woning en net behouden hun eigen kleuren.','Fixed colour for the background. Tabs follow the theme colour; solar, home and grid retain their own colours.'),title:text('Tekst onder de hoofdwaarde. Leeg gebruikt Woningverbruik.','Text below the primary value. Empty uses Home consumption.'),sync_timeframe:text('Alleen de historische weergave deelt het tijdvak met andere kaarten in dezelfde groep. Actueel blijft onafhankelijk.','Only history shares its timeframe with other cards in the same group. Live stays independent.'),hover_sync_group:text('Leeg gebruikt de standaardgroep.','Empty uses the default group.')})[item.name];this._form.data=this._config;this._renderCustomTabs(nl);
  const previousHelper=this._form.computeHelper;
  this._form.computeHelper=item=>['price_entity','export_price_entity'].includes(item.name)?text('Toont de huidige sensorwaarde in Net · Actueel. Gebruik een prijs per kWh, Wh of MWh. Leeg gebruikt de prijs uit Energy.','Shows the current sensor value in Grid · Live. Use a price per kWh, Wh or MWh. Empty uses the Energy tariff.'):previousHelper(item);
 }
}






















let energyFlowSequence=0;
class EnergyFlowCard extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._id='energy-flow-'+(++energyFlowSequence);this._version=0;this._periodMode='today';this._statistics=null;}
 static getStubConfig(){return {default_view:'live'};}
 static async getConfigElement(){
  if(!customElements.get('ha-form')&&window.loadCardHelpers){const helpers=await window.loadCardHelpers();const card=await helpers.createCardElement({type:'entities',entities:[]});await card.constructor.getConfigElement();}
  if(!customElements.get('eleven-energy-flow-editor'))customElements.define('eleven-energy-flow-editor',EnergyFlowEditor);
  return document.createElement('eleven-energy-flow-editor');
 }
 getCardSize(){const config=this._config,hasTabs=(config?.detail_view==='tabs'&&config.tabs.length)||config?.custom_tabs?.some(tab=>tab.show);return (config?.compact?5:6)+(hasTabs?4:0);}
 getGridOptions(){return {columns:12,min_columns:6,rows:this.getCardSize(),min_rows:3};}
 setConfig(input){
  const previous=this._config,next=normalizeEnergyFlowConfig(input);this._config=next;
  if(!previous||previous.default_tab!==next.default_tab||previous.detail_view!==next.detail_view)this._activeTab=next.default_tab;
  if(previous?.detail_view!==next.detail_view)this._dismissDetails();
  const changedGroup=previous&&(previous.sync_timeframe!==next.sync_timeframe||previous.hover_sync_group!==next.hover_sync_group);
  if(changedGroup)this._sharedTimeframe=null;
  const changedView=!previous||previous.default_view!==next.default_view;
  if(changedView)this._view=next.default_view;
  if(!previous||changedView||changedGroup||previous.hours_to_show!==next.hours_to_show)this._reloadPeriod();else this.render();
  this._sync();
 }
 set hass(hass){const changed=this._hass?.connection!==hass?.connection||this._offline()!==(hass?.connected===false||hass?.connection?.connected===false);this._hass=hass;if(changed)this._reset();this.render();this._sync();}
 get hass(){return this._hass;}
 _offline(){return this._hass?.connected===false||this._hass?.connection?.connected===false;}
 connectedCallback(){this._attached=true;this._connectTimeframe();if(this._view==='history')this._reloadPeriod();this._motionCleanup?.();this._motionCleanup=observeCardMotion(this,()=>this._sync());this.render();this._sync();}
 disconnectedCallback(){this._tabController?.disconnect();this._attached=false;this._connected=false;this._timeframeKey=null;disconnectTimeframeSync(this);this._motionCleanup?.();this._motionCleanup=null;disconnectPeriodControls(this);this._reset();}
 _reset(){this._dismissDetails();this._baseVersion=(this._baseVersion??0)+1;this._baseResult=null;this._basePendingKey=null;this._detailVersion=(this._detailVersion??0)+1;this._detailResult=null;this._detailLoading=false;this._detailError=false;this._detailInfo=null;this._version++;clearTimeout(this._timer);this._timer=null;this._loading=false;this._prefs=null;this._statistics=null;this._error=null;this._requested=0;}
 _connectTimeframe(){
  this._connected=!!this._attached&&this._view==='history';
  const key=this._connected&&this._config?.sync_timeframe?(this._config.hover_sync_group?.trim()||'default'):null;
  if(key===this._timeframeKey)return;
  this._timeframeKey=key;connectTimeframeSync(this);
 }
 _reloadPeriod(){this._detailVersion=(this._detailVersion??0)+1;this._detailResult=null;this._detailLoading=false;this._detailError=false;this._connectTimeframe();const range=graphPeriodRange(this);this._start=range.start;this._end=range.end;this._viewStart=range.start;this._viewEnd=range.end;this._status='ready';this._version++;this._loading=false;this._statistics=null;this._requested=0;this.render();this._sync();}
 _dismissDetails(){
  this._detailNode=null;
  for(const binding of Object.values(this._detailBindings??{})){binding.close();binding.disconnect();}
  this._detailBindings={};
 }
 _refreshDetailContent(){
  const focusedSort=this.shadowRoot.activeElement?.matches?.('[data-energy-device-sort]');
  const focusedDevice=this.shadowRoot.activeElement?.closest?.('[data-device-stat]')?this.shadowRoot.activeElement?.dataset.entity:null;
  for(const popup of this.shadowRoot.querySelectorAll('[data-energy-popup],[data-energy-panel]')){
   const body=popup.querySelector('.energy-detail-body');
   body.innerHTML=energyFlowDetailContent(this,popup.dataset.energyPopup??popup.dataset.energyPanel,this._displayData??{});
   body.setAttribute('aria-busy',String(this._view==='history'&&!!this._detailLoading));
  }
  // Opening a controller can synchronously refresh loading content. Position
  // afterwards so native showPopover is never re-entered during that open.
  queueMicrotask(()=>this._detailBindings?.[this._detailNode]?.position());
  if(focusedSort)this.shadowRoot.querySelector('[data-energy-device-sort]')?.focus({preventScroll:true});
  if(focusedDevice)[...this.shadowRoot.querySelectorAll('[data-device-stat] [data-entity]')].find(button=>button.dataset.entity===focusedDevice)?.focus({preventScroll:true});
 }
 async _loadBaseConsumption(){
  if(!this._prefs||this._offline()||!this._attached||document.hidden||this.hasAttribute('data-motion-paused'))return;
  const end=Math.floor(Math.min(this._view==='history'?this._end:Date.now(),Date.now())/3600000)*3600000;
  const key=JSON.stringify([end,this._prefs,this._hass?.config?.time_zone]);
  if(this._basePendingKey===key||this._baseResult?.key===key)return;
  const ids=energyFlowStatisticIds(this._prefs);if(!ids.length)return;
  const prefs=this._prefs,zone=this._hass?.config?.time_zone??'UTC',version=this._baseVersion=(this._baseVersion??0)+1;
  this._basePendingKey=key;this._baseResult=null;
  try{
   const statistics=await this._request({type:'recorder/statistics_during_period',start_time:new Date(end-8*86400000).toISOString(),end_time:new Date(end).toISOString(),statistic_ids:ids,period:'hour',units:{energy:'kWh'},types:['change']});
   if(version===this._baseVersion&&this._attached)this._baseResult={key,value:energyFlowBaseConsumption(prefs,statistics,zone,end)};
  }catch{if(version===this._baseVersion)this._baseResult={key,value:null};}
  finally{if(version===this._baseVersion){this._basePendingKey=null;this._refreshDetailContent();}}
 }
 async _loadDetails(){
  if(this._detailNode==='home'||this._config.detail_view==='tabs'&&this._activeTab==='home')this._loadBaseConsumption();
  if(this._view!=='history'||!this._prefs||this._offline()){this._refreshDetailContent();return;}
  if(!this._attached||document.hidden||this.hasAttribute('data-motion-paused'))return;
  const key=JSON.stringify([this._start,this._end,this._prefs]);
  if(this._detailLoading&&this._detailPendingKey===key)return;
  if(this._detailResult?.key===key&&Date.now()-this._detailResult.time<60000){this._refreshDetailContent();return;}
  const version=this._detailVersion=(this._detailVersion??0)+1,prefs=this._prefs,start=this._start,end=Math.min(this._end,Date.now());
  this._detailLoading=true;this._detailError=false;this._detailPendingKey=key;this._refreshDetailContent();
  try{
   const info=this._detailInfo??await this._request({type:'energy/info'}).catch(()=>({}));
   const ids=energyFlowDetailIds(prefs,info),costIds=[...new Set(energyFlowGridMeters(prefs).map(m=>m.cost||info.cost_sensors?.[m.energy]).filter(Boolean))];
   const results=await Promise.all([
    ids.length?this._request({type:'recorder/statistics_during_period',start_time:new Date(start).toISOString(),end_time:new Date(end).toISOString(),statistic_ids:ids,period:'hour',units:{energy:'kWh'},types:['change']}):{},
    costIds.length?this._request({type:'recorder/get_statistics_metadata',statistic_ids:costIds}).catch(()=>[]):[],
   ]);
   if(version!==this._detailVersion||!this._attached)return;
   this._detailInfo=info;
   const metadata=Object.fromEntries((Array.isArray(results[1])?results[1]:[]).map(item=>[item.statistic_id,item]));
   this._detailResult={key,time:Date.now(),statistics:results[0],metadata,info};
  }catch{if(version===this._detailVersion)this._detailError=true;}
  finally{if(version===this._detailVersion){this._detailLoading=false;this._refreshDetailContent();}}
 }
 _bindDetails(){
  if(this._config.detail_view==='tabs')return;
  const open=this._detailNode;
  for(const kind of ['home','grid','sun']){
   const trigger=this.shadowRoot.querySelector(`[data-energy-detail=${kind}]`),popup=this.shadowRoot.querySelector(`[data-energy-popup=${kind}]`);
   let controller;
   controller=bindUIPopup({trigger,popup,container:popup,align:'center',
    topBoundary:()=>Math.max(8,(this.shadowRoot.querySelector('.toolbar')?.getBoundingClientRect().bottom??0)+8),
    keepOpenOnOutside:event=>event.composedPath().some(node=>node?.getRootNode?.()===this.shadowRoot&&node.matches?.('.toolbar,.period-menu,[data-energy-detail]')),
    isRequested:()=>this._detailNode===kind,isCurrent:()=>this._detailBindings?.[kind]===controller,
    beforeOpen:()=>{for(const [name,binding] of Object.entries(this._detailBindings??{}))if(name!==kind)binding.close();},
     onOpen:()=>{this._detailNode=kind;this._loadDetails();},
    onClose:()=>{if(this._detailNode===kind)this._detailNode=null;},
   });
   this._detailBindings??={};this._detailBindings[kind]=controller;
  }
  // Let closed period menus and replaced popup nodes leave the native top layer
  // before restoring the requested detail popup.
  if(open){const binding=this._detailBindings[open];requestAnimationFrame(()=>{if(this._detailBindings[open]===binding&&this._detailNode===open)binding.open(false);});}
 }
 async _request(message){let timer;try{return await Promise.race([Promise.resolve().then(()=>this._hass.callWS(message)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),15000);})]);}finally{clearTimeout(timer);}}
 _sync(){
  clearTimeout(this._timer);this._timer=null;
  if(!this._attached||!this._config||!this._hass||this._offline()||document.hidden||this.hasAttribute('data-motion-paused')||this._loading)return;
  const interval=this._view==='history'?60000:300000,elapsed=Date.now()-(this._requested??0);
  if(elapsed<interval){this._timer=setTimeout(()=>this._sync(),interval-elapsed);return;}
  if(typeof this._hass.callWS!=='function')return;
  const version=++this._version;this._loading=true;this._error=null;this._requested=Date.now();this.render();
  (async()=>{
   // Refresh preferences periodically so edits in HA Energy are picked up too.
   const prefs=await this._request({type:'energy/get_prefs'});
   if(version!==this._version||!this._attached)return;
   if(!Array.isArray(prefs?.energy_sources))throw Error('invalid preferences');
   if(JSON.stringify(prefs)!==JSON.stringify(this._prefs)){this._statistics=null;this._detailResult=null;this._detailInfo=null;this._detailVersion=(this._detailVersion??0)+1;this._detailLoading=false;}
   this._prefs=prefs;
   if(this._view==='history'){
    const range=graphPeriodRange(this);this._start=range.start;this._end=range.end;this._viewStart=range.start;this._viewEnd=range.end;
    const request=energyFlowStatisticsRequest(prefs,range.start,range.end);
    const statistics=request.statistic_ids.length?await this._request(request):{};
    if(version!==this._version||!this._attached)return;
    this._statistics=statistics;
   }
  })().catch(()=>{if(version===this._version){this._error=true;this._statistics=null;}}).finally(()=>{
   if(version!==this._version)return;this._loading=false;this.render();this._sync();
  });
 }
 render(){
  if(!this._config)return;
  const config=this._config,nl=energyFlowDutch(this._hass),text=(a,b)=>nl?a:b,history=this._view==='history',offline=this._offline();
  const empty={solar:null,import:null,export:null,home:null},data=offline||!this._prefs||this._error||!Object.values(energyFlowSources(this._prefs)).some(list=>list.length)?empty:history?(this._statistics?energyFlowHistorical(this._prefs,this._statistics):empty):energyFlowLive(this._prefs,this._hass,config);
  const unit=history?'kWh':'kW',format=value=>{if(value==null)return '—';try{return new Intl.NumberFormat(this._hass?.locale?.language??this._hass?.language??'en',{maximumFractionDigits:2}).format(value);}catch{return new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(value);}};
  const metrics=energyFlowMetrics(data,history,nl,format,config.compact,config);
  const sources=energyFlowSources(this._prefs),configured=Object.values(sources).some(list=>list.length),period=history?periodControls(this,nl?'nl':'en',{popupNavigation:true,tabVariant:'card'}):null;
  const focusedTab=this.shadowRoot.activeElement?.dataset.uiTab,focusedEntity=this.shadowRoot.activeElement?.dataset.entity;
  this._tabController?.disconnect();
  const focused=this.shadowRoot.activeElement?.dataset.viewButton;
  const focusedDetail=this.shadowRoot.activeElement?.dataset.energyDetail;
  const active=this.shadowRoot.activeElement;
  const focusedPopupControl=active?.hasAttribute('data-ui-popup-close')?'[data-ui-popup-close]':active?.hasAttribute('data-detail-retry')?'[data-detail-retry]':null;
  const openedDetail=this._detailNode,detailScroll=this.shadowRoot.querySelector(`[data-energy-popup=${openedDetail}]`)?.scrollTop??0;
  for(const binding of Object.values(this._detailBindings??{})){binding.disconnect();binding.close();}
  this._detailBindings={};this._detailNode=openedDetail;
  // Recreate closed native popovers before patching their bodies. Reusing a
  // focused top-layer node across period changes can stall Chromium layout.
  for(const popup of this.shadowRoot.querySelectorAll('[data-energy-popup]'))popup.remove();
  this._displayData=data;
  const tabs=energyFlowTabs(this,data,nl);
  const details=(config.detail_view==='tabs'?'':['home','grid','sun'].map(kind=>energyFlowDetailPopup(this,kind,data,{id:this._id+'-detail-'+kind})).join(''));
  const switchButton=uiButton({text:history?text('Actueel','Live'):text('Historisch','History'),variant:'text',attrs:{'data-view-button':history?'live':'history','aria-label':history?text('Toon actueel vermogen','Show live power'):text('Toon historische energie','Show historical energy')}});
  const toolbar=`<div class="toolbar"><div class="header-actions"><div class="chart-controls" role="group" aria-label="${text('Weergave en tijdvak','View and timeframe')}"><div class="view-period">${switchButton}${history?period.picker:''}</div>${history?period.navigation:''}</div></div></div>`;
  let notice=offline?text('Geen verbinding met Home Assistant.','Disconnected from Home Assistant.'):this._error?text('Energy-gegevens laden mislukt. Controleer de Energy-configuratie en Recorder.','Could not load Energy data. Check Energy configuration and Recorder.'):!this._prefs?text('Energy-configuratie laden…','Loading Energy configuration…'):!configured?text('Stel elektriciteitsbronnen in via het Home Assistant Energy-dashboard.','Configure electricity sources in the Home Assistant Energy dashboard.'):this._loading&&history&&!this._statistics?text('Energiestatistieken laden…','Loading energy statistics…'):Object.values({solar:data.solar,import:data.import,export:data.export,home:data.home}).some(value=>value==null)?history?text('Niet alle energiestatistieken zijn beschikbaar voor deze periode.','Some energy statistics are unavailable for this period.'):text('Actueel vermogen ontbreekt. Stel vermogenssensoren in bij Energy of kies ze in de kaartconfiguratie.','Live power is missing. Configure power sensors in Energy or select them in the card editor.'):'';
  if(data.battery)notice+=(notice?' ':'')+text('Thuisbatterij meegerekend in woningverbruik.','Home consumption includes the battery balance.');
  patchWeatherDOM(this.shadowRoot,`<style>${cardHeaderStyles()}${periodControlsStyles()}${weatherStyles}${energyFlowStyles}${energyFlowBackgroundStyles}${energyFlowDetailStyles}${energyFlowTabStyles}${uiPrimaryValueStyles()}${uiMetricStyles()}</style><ha-card><div class="content" style="--header-background-opacity:${config.background_strength/100}" data-view="${this._view}" data-color="${config.color}" data-background="${config.background}" data-animated="${config.animate_background&&!offline&&!this._error}" data-compact="${config.compact}" data-dark="${!!this._hass?.themes?.darkMode}"><div class="header-region"><div class="scene-background" aria-hidden="true">${energyFlowBackground(config.background)}</div>${toolbar}<div class="energy-heading">${uiPrimaryValue({value:data.home==null?null:format(data.home),unit,subtitle:config.title||text('Woningverbruik','Home consumption'),compact:config.compact,attrs:{'data-metric':'home','data-long':String(data.home!=null&&format(data.home).length>6)}})}</div>${energyFlowDiagram(data,history,nl,format,{detailView:config.detail_view,tabs:config.tabs,id:this._id})}${metrics.solar}</div>${metrics.grid}${notice?`<p class="notice" role="status">${uiEscape(notice)}</p>`:''}${this._error&&!offline?uiButton({text:text('Opnieuw proberen','Retry'),variant:'text',className:'retry',attrs:{'data-retry':true}}):''}${tabs}${details}</div></ha-card>`);
  if(!this._bound){this._bound=true;this.shadowRoot.addEventListener('click',event=>{
   const entity=event.target.closest?.('[data-entity]');
   if(entity){this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:entity.dataset.entity},bubbles:true,composed:true}));return;}
   const endpoint=event.target.closest?.('[data-energy-detail]');
   if(endpoint&&this._config.detail_view==='tabs'){
    const kind=endpoint.dataset.energyDetail;
    if(this._config.tabs.includes(kind)){this._activeTab=kind;this._tabController?.select(kind,{focus:true});this._loadDetails();}
    return;
   }
   const button=event.target.closest?.('[data-view-button]');
   if(button){if(button.dataset.viewButton===this._view)return;disconnectPeriodControls(this);this._periodMenuOpen=false;this._periodMenuPending=false;this._view=button.dataset.viewButton;this._reloadPeriod();}
   else if(event.target.closest?.('[data-detail-retry]')){this._detailResult=null;this._loadDetails();}
   else if(event.target.closest?.('[data-retry]')){this._requested=0;this._sync();}
  });this.shadowRoot.addEventListener('change',event=>{if(event.target.matches?.('[data-energy-device-sort]')){this._deviceSort=event.target.value==='cost'?'cost':'energy';this._refreshDetailContent();}});this.shadowRoot.addEventListener('keydown',event=>{if(event.key==='Escape'&&this._detailNode&&!this._periodMenuOpen){event.preventDefault();event.stopPropagation();this._detailBindings[this._detailNode]?.close(true);}});}
  this._tabController=bindUITabs({tabs:this.shadowRoot.querySelectorAll('[data-energy-tabs] [data-ui-tab]'),panels:this.shadowRoot.querySelectorAll('[data-energy-tabs] [data-ui-tab-panel]'),onSelect:value=>{this._activeTab=value;this.render();}});
  if(focusedTab)([...this.shadowRoot.querySelectorAll('[data-energy-tabs] [data-ui-tab]')].find(tab=>tab.dataset.uiTab===focusedTab)??this.shadowRoot.querySelector('[data-energy-tabs] [aria-selected=true]'))?.focus({preventScroll:true});
  if(focusedEntity)[...this.shadowRoot.querySelectorAll('[data-entity]')].find(button=>button.dataset.entity===focusedEntity)?.focus({preventScroll:true});
  this._bindDetails();
  if(this._config.detail_view==='tabs'&&this._config.tabs.includes(this._activeTab))this._loadDetails();
  bindPeriodControls(this);
  if(openedDetail&&config.detail_view!=='tabs'){const popup=this.shadowRoot.querySelector(`[data-energy-popup=${openedDetail}]`);requestAnimationFrame(()=>{if(!popup.isConnected||this._detailNode!==openedDetail)return;popup.scrollTop=detailScroll;if(focusedPopupControl)popup.querySelector(focusedPopupControl)?.focus({preventScroll:true});else if(focusedEntity)[...popup.querySelectorAll('[data-entity]')].find(button=>button.dataset.entity===focusedEntity)?.focus({preventScroll:true});});}
  if(focusedDetail&&!openedDetail)this.shadowRoot.querySelector(`[data-energy-detail=${focusedDetail}]`)?.focus({preventScroll:true});
  if(focused&&!this._periodMenuOpen)this.shadowRoot.querySelector('[data-view-button]')?.focus({preventScroll:true});
 }
}

if(!customElements.get('eleven-energy-flow-card'))customElements.define('eleven-energy-flow-card',EnergyFlowCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(card=>card.type==='eleven-energy-flow-card'))window.customCards.push({type:'eleven-energy-flow-card',name:'Eleven Energy Flow (beta)',description:'Automatic Home Assistant Energy sources, live power and historical energy distribution.',preview:true});
})();
