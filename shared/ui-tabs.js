import {uiButton,uiAttributes} from './ui-button.js';
export function uiTabs({id,label,items,selected,className='',panelClassName='',variant=''}={}){
 if(typeof id!=='string'||!id||!items?.length||items.some(item=>typeof item.value!=='string'||!item.value)||new Set(items.map(item=>item.value)).size!==items.length)throw Error('Tabs need an id and distinct text values.');
 const active=items.find(item=>item.value===selected&&!item.disabled)??items.find(item=>!item.disabled);
 const tabId=value=>`${id}-tab-${encodeURIComponent(value)}`,panelId=value=>`${id}-panel-${encodeURIComponent(value)}`;
 const bar=`<div${uiAttributes({class:className||null,'data-ui-tabs':'','data-ui-card-tabs':variant==='card'?true:null,role:'tablist','aria-label':label})}>${items.map(item=>uiButton({variant:'tab',text:item.label,disabled:item.disabled,attrs:{role:'tab',id:tabId(item.value),'data-ui-tab':item.value,'aria-controls':panelId(item.value),'aria-selected':item===active,tabindex:item===active?0:-1,...item.tabAttrs}})).join('')}</div>`;
 const panels=items.map(item=>`<section${uiAttributes({class:[panelClassName,item.className].filter(Boolean).join(' ')||null,id:panelId(item.value),role:'tabpanel','aria-labelledby':tabId(item.value),'data-ui-tab-panel':item.value,'data-ui-card-tab-panel':variant==='card'?true:null,...item.panelAttrs,hidden:item!==active})}>${item.content??''}</section>`).join('');
 return bar+panels;
}
export function bindUITabs({tabs,panels,onSelect=()=>{}}){
 const buttons=[...tabs],sections=[...panels],cleanups=[];
 const select=(value,{focus=false,notify=true}={})=>{
  const target=buttons.find(tab=>tab.dataset.uiTab===value&&!tab.disabled);if(!target)return false;
  for(const tab of buttons){const active=tab===target;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;}
  for(const panel of sections)panel.hidden=panel.dataset.uiTabPanel!==value;
  if(focus)target.focus({preventScroll:true});
  // Keep a selected tab visible within a scrolling strip without moving the page.
  const list=target.parentElement;
  if(list&&list.scrollWidth>list.clientWidth&&target.getBoundingClientRect){const box=target.getBoundingClientRect(),view=list.getBoundingClientRect();list.scrollLeft+=box.left<view.left?box.left-view.left:box.right>view.right?box.right-view.right:0;}
  if(notify)onSelect(value,target);return true;
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
export function uiTabsStyles(){return `
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

// Approved 2A-1 appearance. Retain the existing helper name for consumers.
export function uiBalancedTabsStyles(){
 const strip=':host [data-ui-tabs][role=tablist]';
 const tab=strip+' [role=tab][data-ui-tab]';
 return `
${strip}{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);align-items:stretch;gap:0;width:100%;box-sizing:border-box;padding:0;border:0;border-bottom:1px solid var(--divider-color,#ddd);background:transparent;box-shadow:none;overflow:visible}
${strip}:has(>[role=tab]:nth-child(4)){display:flex;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;scrollbar-width:none}
${strip}::-webkit-scrollbar{display:none}
${strip}:has(>[role=tab]:nth-child(4)) [role=tab][data-ui-tab]{flex:1 0 88px}
${tab}{display:flex;align-items:center;justify-content:center;box-sizing:border-box;min-width:44px;max-width:none;min-height:44px;height:auto;margin:0 0 -1px;padding:5px 6px 3px;border:0;border-bottom:2px solid transparent;border-radius:0;background:transparent;box-shadow:none;color:var(--secondary-text-color,#666);font-family:inherit;font-size:13px;font-weight:400;line-height:1.3;text-align:center;white-space:normal;overflow:visible;overflow-wrap:anywhere;text-overflow:clip;text-decoration:none;transform:none}
${tab}:not(:disabled):hover{color:var(--primary-text-color,#20252b);background:color-mix(in srgb,var(--primary-text-color,#20252b) 5%,transparent);box-shadow:none;transform:none}
${tab}[aria-selected=true],${tab}[aria-selected=true]:not(:disabled):hover{color:var(--primary-text-color,#20252b);font-weight:400;background:transparent;box-shadow:none;border-bottom:2px solid var(--accent-color,var(--primary-color));text-decoration:none;transform:none}
${tab}:focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:-3px}
${strip}~[data-ui-tab-panel]{border:0;padding-block-start:12px;background:transparent}
@media(forced-colors:active){${strip}{border-bottom-color:CanvasText}${tab}[aria-selected=true]{border-bottom-color:Highlight;outline:1px solid Highlight;outline-offset:-2px;box-shadow:none}${tab}:focus-visible{outline:2px solid CanvasText;outline-offset:-4px}}
`;
}
