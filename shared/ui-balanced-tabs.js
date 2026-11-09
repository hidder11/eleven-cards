import {uiTabIndicatorStyles} from './ui-tabs.js';

export function uiBalancedTabsStyles(){
 const strip=':host [data-ui-tabs][role=tablist]';
 const tab=strip+' [role=tab][data-ui-tab]';
 return `
${strip}{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);align-items:stretch;gap:0;width:100%;box-sizing:border-box;padding:0;border:0;background:transparent;box-shadow:none;overflow:visible}
${strip}:has(>[role=tab]:nth-child(4)){display:flex;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;scrollbar-width:none}
${strip}::-webkit-scrollbar{display:none}
${strip}:has(>[role=tab]:nth-child(4)) [role=tab][data-ui-tab]{flex:1 0 88px}
${tab}{display:flex;align-items:center;justify-content:center;box-sizing:border-box;min-width:44px;max-width:none;min-height:44px;height:auto;margin:0;padding:5px 6px 3px;border:0;border-radius:0;background:transparent;box-shadow:none;color:var(--secondary-text-color,#666);font-family:inherit;font-size:13px;font-weight:400;line-height:1.3;text-align:center;white-space:normal;overflow:visible;overflow-wrap:anywhere;text-overflow:clip;text-decoration:none;transform:none}
${tab}:not(:disabled):hover{color:var(--primary-text-color,#20252b);background:color-mix(in srgb,var(--primary-text-color,#20252b) 5%,transparent);box-shadow:none;transform:none}
${tab}[aria-selected=true],${tab}[aria-selected=true]:not(:disabled):hover{color:var(--primary-text-color,#20252b);font-weight:400;background:transparent;box-shadow:none;text-decoration:none;transform:none}
${uiTabIndicatorStyles({strip,tab,color:'var(--accent-color,var(--primary-color))'})}
${tab}:focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:-3px}
${strip}~[data-ui-tab-panel]{border:0;padding-block-start:12px;background:transparent}
@media(forced-colors:active){${strip}{border-bottom-color:CanvasText}${tab}[aria-selected=true]{border-bottom-color:Highlight;outline:1px solid Highlight;outline-offset:-2px;box-shadow:none}${tab}:focus-visible{outline:2px solid CanvasText;outline-offset:-4px}}
`;
}
