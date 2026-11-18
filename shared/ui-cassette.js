import {uiEscape,uiAttributes} from './ui-button.js';

// Native disclosure anatomy. Labels/attributes are escaped; content is trusted,
// caller-owned HTML, like uiButton. Native details owns keyboard/open state.
export function uiCassette({label='',content='',open=false,attrs={},summaryAttrs={},bodyAttrs={}}={}){
 return `<details${uiAttributes({...attrs,'data-ui-cassette':'',open:open?'':null})}><summary${uiAttributes({...summaryAttrs,'data-ui-cassette-trigger':''})}>${uiEscape(label)}</summary><div${uiAttributes({...bodyAttrs,'data-ui-cassette-body':''})}>${content}</div></details>`;
}

// Adopt existing native markup without replacing its nodes or their listeners.
// House's immutable source stays authoritative; Scene keeps its native content.
export function mountUICassette(details){
 if(details?.tagName!=='DETAILS')throw new TypeError('Cassette requires a native details element');
 const summary=Array.from(details.children).find(node=>node.tagName==='SUMMARY');
 if(!summary)throw new TypeError('Cassette details requires a direct summary');
 const children=Array.from(details.children).filter(node=>node!==summary);
 let body=children.find(node=>node.hasAttribute('data-ui-cassette-body'));
 if(!body){
  if(children.length===1&&children[0].tagName==='DIV')body=children[0];
  else{
   body=details.ownerDocument.createElement('div');
   const content=Array.from(details.childNodes).filter(node=>node!==summary);
   details.insertBefore(body,content[0]??null);body.append(...content);
  }
 }
 details.setAttribute('data-ui-cassette','');summary.setAttribute('data-ui-cassette-trigger','');body.setAttribute('data-ui-cassette-body','');
 return details;
}

// Extracted House grip/chevron and attached tray. The wrapper deliberately has
// no paint: a neighboring Scene Reset remains outside the inset content plane.
// Theme roles own paint; scope only outranks immutable legacy House selectors.
export function uiCassetteStyles({scope=''}={}){
 const cassette=`${scope?scope+' ':''}[data-ui-cassette]`;
 return `
${cassette}{box-sizing:border-box;min-width:0;padding:0;border:0;background:transparent;box-shadow:none;border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px))}
${cassette}>[data-ui-cassette-trigger]{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:12px;box-sizing:border-box;min-width:44px;min-height:44px;width:var(--ui-cassette-grip-width,100%);margin:0;padding:10px 12px;list-style:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:500;line-height:1.4;text-align:start;overflow-wrap:anywhere;color:var(--primary-text-color);border:1px solid var(--divider-color,transparent);border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px));background:var(--eleven-material-control-background,var(--secondary-background-color,transparent));box-shadow:var(--eleven-material-control-shadow,none);transform:none;transition:filter 120ms ease-out,box-shadow 120ms ease-out}
${cassette}>[data-ui-cassette-trigger]::-webkit-details-marker{display:none}
${cassette}>[data-ui-cassette-trigger]::after{content:'';box-sizing:border-box;flex:none;width:8px;height:8px;margin:0 3px 4px 12px;border:0;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);transition:transform 120ms ease-out}
${cassette}[open]>[data-ui-cassette-trigger]{border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px)) var(--eleven-material-radius-button,var(--ha-card-border-radius,12px)) 0 0}
${cassette}[open]>[data-ui-cassette-trigger]::after{transform:rotate(225deg);margin-bottom:0}
${cassette}>[data-ui-cassette-trigger]:active{transform:none;filter:none;background:var(--eleven-material-control-background,var(--secondary-background-color,transparent));box-shadow:var(--eleven-material-well,none)}
${cassette}>[data-ui-cassette-trigger]:focus-visible{outline:2px solid var(--ui-cassette-focus-color,var(--accent-color,var(--primary-color,Highlight)));outline-offset:3px}
${cassette}>[data-ui-cassette-body]{box-sizing:border-box;min-width:0;margin:0;padding:12px 10px 10px;border:0;border-radius:0 0 var(--eleven-material-radius-button,var(--ha-card-border-radius,12px)) var(--eleven-material-radius-button,var(--ha-card-border-radius,12px));background:var(--eleven-material-plot-background,var(--secondary-background-color,transparent));box-shadow:var(--eleven-material-well,none);color:var(--primary-text-color)}
${cassette}:not([open])>[data-ui-cassette-body]{display:none}
@media(hover:hover){${cassette}>[data-ui-cassette-trigger]:hover{filter:brightness(1.025)}}
@media(prefers-reduced-motion:reduce){${cassette}>[data-ui-cassette-trigger],${cassette}>[data-ui-cassette-trigger]::after{transition:none}}
@media(forced-colors:active){${cassette}>[data-ui-cassette-trigger]{background:ButtonFace;color:ButtonText;border-color:ButtonText;box-shadow:none;forced-color-adjust:none}${cassette}>[data-ui-cassette-trigger]:active{background:ButtonFace;box-shadow:none}${cassette}>[data-ui-cassette-trigger]:focus-visible{outline-color:Highlight}${cassette}>[data-ui-cassette-body]{background:Canvas;color:CanvasText;border:1px solid CanvasText;box-shadow:none}}
`;
}
