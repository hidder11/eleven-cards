/* Isolated Material adapter over the exact installed styled source closure.
 * Keep inherited loader/actions/config authoritative; accessibility and detached
 * completion guards below are pilot-only seams, never vendor snapshot changes. */
class MaterialHouseCard extends HouseStylePreview {
 constructor(){
  super();
  const panel=this.shadowRoot.querySelector('ha-card');
  const root=document.createElement('div');root.dataset.elevenMaterial='';root.dataset.houseMaterial='';
  panel.replaceWith(root);root.append(panel);this.materialRoot=root;
  const style=document.createElement('style');
  // Raise the shared opt-in scope specificity above the inherited compact selectors.
  // House adapter keeps native defaults; the active theme owns Material paint.
  style.textContent=houseThemeStyles().replaceAll('[data-eleven-material]',':host [data-eleven-material][data-house-material]')+`
:host [data-eleven-material][data-house-material] ha-card[data-material=card]{padding:0;border-radius:var(--_em-radius-card);overflow:hidden;color:var(--_em-fg)}
:host [data-eleven-material][data-house-material] .content{font-family:var(--ha-font-family-body,system-ui,sans-serif);--primary-text-color:var(--_em-fg);--secondary-text-color:var(--_em-muted);--welcome-muted:var(--_em-muted);--welcome-accent:var(--_em-fg)}
:host [data-eleven-material][data-house-material] .hero-header{padding:18px 18px 0;gap:2px}
:host [data-eleven-material][data-house-material] h2{font-size:18px;line-height:1.3;font-weight:600;color:var(--_em-fg);letter-spacing:0}
:host [data-eleven-material][data-house-material] .hero-date{font-size:12px;color:var(--_em-muted)}
:host [data-eleven-material][data-house-material] .home-caption{font-size:12px;color:var(--_em-muted)}
/* Keep image and caption in one vertical flow from the first frame onward.
 * Avoid any loading-only flex row that could place an arriving canvas beside
 * the caption during a stale layout. Do not depend on :has([hidden]). */
:host [data-eleven-material][data-house-material] .stage{display:block}
:host [data-eleven-material][data-house-material]:not([data-house-image-state=ready]) .stage::before{content:'';display:block;width:100%;aspect-ratio:4/3;min-height:220px}
:host [data-eleven-material][data-house-material][data-house-image-state=error] .stage-caption{visibility:hidden}
:host [data-eleven-material][data-house-material] .stage-caption{display:flex;flex-wrap:wrap;align-items:center;padding:0 18px 12px;gap:8px;color:var(--_em-muted)}
:host [data-eleven-material][data-house-material] .stage-caption> :first-child{min-width:0;flex:1 1 90px;text-align:left}
:host [data-eleven-material][data-house-material] .stage-caption .view-toggle{flex:none;margin-left:auto}
:host [data-eleven-material][data-house-material] .light-state{line-height:1.4;overflow-wrap:normal}
:host [data-eleven-material][data-house-material] .view-toggle{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));justify-self:end;align-items:stretch;background:none;padding:0;gap:6px;border-radius:0}
:host [data-eleven-material][data-house-material] .view-toggle button{box-sizing:border-box;min-width:62px;min-height:44px;padding:8px 12px;gap:0;justify-content:center;text-align:center}
:host [data-eleven-material][data-house-material] .view-label{max-width:100%;justify-self:end}
:host [data-eleven-material][data-house-material] .view-toggle button:after{content:none}
:host [data-eleven-material][data-house-material] .summary{padding:0!important;margin:0 18px;gap:8px;border:0}
:host [data-eleven-material][data-house-material] .summary-tile{padding:12px;min-height:80px;border:0;color:var(--_em-fg);text-align:left;transition:filter 120ms ease-out}
:host [data-eleven-material][data-house-material] .summary-tile[data-summary=alarm]{min-height:62px}
/* Give the security emblem its own fitted slot; leave other metric icons alone. */
:host [data-eleven-material][data-house-material] [data-summary=alarm] .ui-metric-icon{width:30px;height:30px;align-self:center;justify-self:end;transform:none}
:host [data-eleven-material][data-house-material] [data-summary=alarm] .ui-metric-icon ha-icon{display:block;width:30px;height:30px;--mdc-icon-size:30px}
:host [data-eleven-material][data-house-material] .summary-tile .ui-metric-title{font-size:12px;line-height:1.35;color:var(--_em-muted)}
:host [data-eleven-material][data-house-material] .summary-tile .ui-metric-value{font-size:26px;line-height:1.2;font-weight:600;letter-spacing:-.025em;color:var(--_em-fg)}
:host [data-eleven-material][data-house-material] .summary-tile[data-summary=presence] .ui-metric-value,:host [data-eleven-material][data-house-material] .summary-tile[data-summary=alarm] .ui-metric-value{font-size:15px;line-height:1.4;letter-spacing:0;font-weight:550}
:host [data-eleven-material][data-house-material] .summary-tile .ui-metric-unit{font-size:13px;color:var(--_em-muted);margin-left:2px;white-space:nowrap}
:host [data-eleven-material][data-house-material] .summary-tile .ui-metric-info{padding-top:0;margin-top:5px;border:0;font-size:12px;color:var(--_em-muted)}
:host [data-eleven-material][data-house-material] .ui-metric-icon{background:none;box-shadow:none;border:0;transform:none;color:var(--tone,var(--_em-muted))}
:host [data-eleven-material][data-house-material] .ui-metric-icon ha-icon{color:inherit;fill:currentColor;stroke:none;stroke-width:0}
:host [data-eleven-material][data-house-material] .summary-tile:disabled{opacity:1;cursor:default}
:host [data-eleven-material][data-house-material] .summary-tile:hover:not(:disabled){filter:brightness(1.025)}
:host [data-eleven-material][data-house-material] .summary-tile:focus-visible,:host [data-eleven-material][data-house-material] summary:focus-visible{outline:2px solid var(--house-focus,var(--_em-accent));outline-offset:3px}
:host [data-eleven-material][data-house-material] [data-material=button]:focus-visible{outline-color:var(--house-focus,var(--_em-accent))}
:host [data-eleven-material][data-house-material] .light-panel{margin:10px 18px 14px;border:0}
:host [data-eleven-material][data-house-material] .light-heading{min-height:44px;padding:10px 12px;color:var(--_em-fg);font-size:13px;border-radius:var(--_em-radius-button);border:1px solid var(--_em-edge);background:var(--_house-recipe-button-background,var(--_em-face1));box-shadow:var(--_house-recipe-button-shadow,none);transition:filter var(--_em-duration-color),transform var(--_em-duration-press),box-shadow var(--_em-duration-press)}
:host [data-eleven-material][data-house-material] .light-heading::after{content:'';box-sizing:border-box;flex:none;width:8px;height:8px;margin:0 3px 4px 12px;border:0;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);transition:transform var(--_em-duration-color)}
:host [data-eleven-material][data-house-material] details[open]>.light-heading::after{content:'';transform:rotate(225deg);margin-bottom:0}
@media(hover:hover){:host [data-eleven-material][data-house-material] .light-heading:hover{filter:brightness(1.025)}}
:host [data-eleven-material][data-house-material] .light-heading:active{transform:translateY(var(--_em-press-distance));box-shadow:var(--_em-well);background:var(--_em-inset)}
/* A single housing: a raised grip above an inset tray, never two floating cards.
 * The grip stays in place when opened; only the interior is revealed. */
:host [data-eleven-material][data-house-material] .light-panel{border-radius:var(--_em-radius-button);background:var(--_em-inset);box-shadow:var(--_em-well)}
:host [data-eleven-material][data-house-material] .light-heading{position:relative;z-index:1}
:host [data-eleven-material][data-house-material] .light-panel[open]>.light-heading{border-radius:var(--_em-radius-button) var(--_em-radius-button) 0 0;box-shadow:var(--_house-recipe-button-shadow,none)}
:host [data-eleven-material][data-house-material] .light-heading:active{transform:none;background:var(--_house-recipe-button-background,var(--_em-face1));box-shadow:var(--_house-recipe-disclosure-pressed-shadow,none)}
:host [data-eleven-material][data-house-material] .light-panel[open] .controls{box-sizing:border-box;margin:0;padding:12px 10px 10px}
:host [data-eleven-material][data-house-material] .light-panel .lighting-notice:not(:empty){margin:0;padding:10px 10px 0;color:var(--_em-muted)}
@media(forced-colors:active){:host [data-eleven-material][data-house-material] .light-panel{background:Canvas;border:1px solid ButtonText;box-shadow:none}:host [data-eleven-material][data-house-material] .light-panel[open]>.light-heading{box-shadow:none}:host [data-eleven-material][data-house-material] .light-heading:active{background:ButtonFace}}
:host [data-eleven-material][data-house-material] [data-summary=presence] .ui-metric-icon{width:30px;height:30px;align-self:center;justify-self:end;transform:none}
:host [data-eleven-material][data-house-material] [data-summary=presence] .hero-avatar{box-sizing:border-box;display:flex;width:30px;height:30px;max-width:100%;border:0;line-height:1;transform:none}
:host [data-eleven-material][data-house-material] .hero-avatar-photo{display:block;object-position:center}
@media(prefers-reduced-motion:reduce){:host [data-eleven-material][data-house-material] .light-heading,:host [data-eleven-material][data-house-material] .light-heading::after{transition:none}}
@media(forced-colors:active){:host [data-eleven-material][data-house-material] .light-heading{background:ButtonFace;color:ButtonText;border:1px solid ButtonText;box-shadow:none}:host [data-eleven-material][data-house-material] .light-heading:focus-visible{outline-color:Highlight}}
:host [data-eleven-material][data-house-material] .controls{grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));gap:8px;margin:4px 0 0}
:host [data-eleven-material][data-house-material] .controls button{box-sizing:border-box;display:grid;grid-template-columns:22px minmax(0,1fr);align-items:center;column-gap:10px;min-height:56px;justify-content:start;text-align:left;padding:9px 12px}
:host [data-eleven-material][data-house-material] .controls button .label{font-size:13px;line-height:1.3;overflow-wrap:anywhere;word-break:normal}
:host [data-eleven-material][data-house-material] .controls button small{font-size:12px;color:inherit;opacity:1}
:host [data-eleven-material][data-house-material] .controls button[aria-pressed=true]:not(:disabled){color:var(--_em-accent)}
:host [data-eleven-material][data-house-material] .controls button[aria-pressed=true] ha-icon{color:inherit}
/* Selection depth is owned by the shared option-1 recipe, also on hover. */
:host [data-eleven-material][data-house-material] .controls button ha-icon{color:inherit}
:host [data-eleven-material][data-house-material] [role=status]{margin:0 18px 14px;color:var(--_em-muted);font-size:12px}
:host [data-eleven-material][data-house-material] [role=status][data-error=true]{color:var(--error-color,var(--_em-error))}
:host([data-density=standard]) [data-eleven-material][data-house-material] .summary-tile{padding:16px;min-height:92px}
@container(max-width:350px){:host [data-eleven-material][data-house-material] .hero-header{padding:14px 14px 0}:host [data-eleven-material][data-house-material] .stage-caption{padding:0 14px 10px}:host [data-eleven-material][data-house-material] .summary{margin:0 14px;gap:7px}:host [data-eleven-material][data-house-material] .summary-tile{padding:10px;min-height:78px}:host [data-eleven-material][data-house-material] .light-panel{margin:8px 14px 12px}}
/* Presence has two short text lines, not a large numeric reading. Keep its
 * inset material but size it to its content, independently of metric wells. */
:host [data-eleven-material][data-house-material] .summary-tile[data-summary=presence]{min-height:60px;padding:10px 12px}
:host([data-density=standard]) [data-eleven-material][data-house-material] .summary-tile[data-summary=presence]{min-height:68px;padding:12px}
@media(prefers-reduced-motion:reduce){:host [data-eleven-material][data-house-material] .summary-tile{transition:none}}
/* System colors are explicit here: avoid Chromium's automatic text backplate
 * erasing HighlightText, and outrank the shared selected+active recipe. */
@media(forced-colors:active){:host [data-eleven-material][data-house-material] .view-toggle button[data-material=button][aria-pressed=true]:not(:disabled){background:Highlight;color:HighlightText;box-shadow:none;forced-color-adjust:none}:host [data-eleven-material][data-house-material] .controls button[data-material=button][aria-pressed=true]:not(:disabled){background:Highlight;color:HighlightText;outline-color:Highlight;box-shadow:none;forced-color-adjust:none}:host [data-eleven-material][data-house-material] .controls button[aria-pressed=true]:not(:disabled) ha-icon{color:HighlightText}:host [data-eleven-material][data-house-material] .controls button ha-icon{color:inherit}}
/* Pending remains keyboard-focusable, but is not visually actionable. */
:host [data-eleven-material][data-house-material] .controls button[data-material=button][aria-disabled=true][aria-busy=true]{background:var(--_em-inset);color:var(--_em-muted);box-shadow:none;transform:none;cursor:wait}
@media(forced-colors:active){:host [data-eleven-material][data-house-material] .controls button[data-material=button][aria-disabled=true][aria-busy=true]{background:ButtonFace;color:GrayText;border-color:GrayText}}
`;
  this.shadowRoot.append(style);
  this.markMaterial();
 }
 static getConfigElement(){return document.createElement('eleven-material-house-editor');}
 static getConfigForm(){const base=HouseStylePreview.getConfigForm();return {...base,schema:[...base.schema.filter(s=>s.name!=='appearance'),{name:'accent_color',selector:{text:{}}}],computeLabel:s=>s.name==='accent_color'?'Selectieaccent (hex, leeg = thema)':base.computeLabel(s)};}
 setConfig(c){
  if(c.accent_color!=null&&c.accent_color!==''&&!/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(c.accent_color))throw Error('accent_color vereist een hexkleur, bijvoorbeeld #8b5cf6');
  super.setConfig(c);
 }
 connectedCallback(){this.materialDetached=false;super.connectedCallback();}
 disconnectedCallback(){
  this.materialDetached=true;
  // Reject in-flight inherited loads without changing the immutable loader.
  this.loadToken=(this.loadToken||0)+1;this.loading=null;
  super.disconnectedCallback();
 }
 load(){if(!this.materialDetached)return super.load();}
 paintLivingFrame(...args){if(!this.materialDetached)return super.paintLivingFrame(...args);}
 cameraToggleHTML(){
  // Include the recipe in the inherited HTML comparison, not as a late mutation.
  return super.cameraToggleHTML().replaceAll('<button ', '<button data-material="button" ');
 }
 heroSceneHTML(){
  const html=super.heroSceneHTML(),stage=this.shadowRoot.querySelector('.stage-caption');
  const next=document.createElement('template');next.innerHTML=html;
  const current=stage?.querySelector('.view-toggle'),toggle=next.content.querySelector('.view-toggle');
  const buttons=current?.querySelectorAll('button'),fresh=toggle?.querySelectorAll('button');
  // Light-count/caption changes must not unmount the independently selected camera.
  // Delegated upstream click handling remains authoritative, including view loads.
  if(current&&toggle&&buttons.length===fresh.length&&[...buttons].every((b,i)=>b.dataset.houseView===fresh[i].dataset.houseView)){
   buttons.forEach((b,i)=>{const pressed=fresh[i].getAttribute('aria-pressed');if(b.getAttribute('aria-pressed')!==pressed)b.setAttribute('aria-pressed',pressed);});
   const prefix=[...next.content.childNodes].filter(n=>n!==toggle),existing=[...stage.childNodes].filter(n=>n!==current);
   if(existing.map(n=>n.outerHTML||n.textContent).join('')!==prefix.map(n=>n.outerHTML||n.textContent).join('')){
    existing.forEach(n=>n.remove());prefix.forEach(n=>stage.insertBefore(n,current));
   }
   return stage.innerHTML;
  }
  return html;
 }
 draw(){
  if(this.materialDetached)return; // Mode, registry and service promises can settle after removal.
  // Inherited controls are replaced on state changes. Restore only the control
  // focused at this synchronous draw, never a remembered async action target.
  const focused=this.shadowRoot.activeElement?.dataset.entity;
  super.draw();
  for(const button of this.shadowRoot.querySelectorAll('.controls button')){
   const light=this.loaded?.manifest.lights.find(l=>this.bindingKey(l)===button.dataset.entity);
   if(!light)continue;
   const known=this.lightState(light).known,pending=this.pending.has(button.dataset.entity);
   button.disabled=!known;
   button.setAttribute('aria-disabled',String(!known||pending));
   button.setAttribute('aria-busy',String(pending));
   const name=button.querySelector('.label').firstChild.textContent;
   button.setAttribute('aria-label',name+' '+(!known?'Niet beschikbaar':pending?'Bezig…':button.getAttribute('aria-pressed')==='true'?'uitschakelen':'inschakelen'));
   if(focused===button.dataset.entity&&!button.disabled)button.focus({preventScroll:true});
  }
  this.markMaterial();
 }
 markMaterial(){
  const root=this.materialRoot;if(!root||!this.config)return;
  const dark=!!this._hass?.themes?.darkMode;root.dataset.materialTheme=dark?'dark':'light';root.dataset.houseImageState=this.loaded?'ready':this.failure?'error':'loading';
  const h=getComputedStyle(this);
  const setToken=(name,value)=>{
   // Private host outputs inherit into the material root without rewriting
   // any public input. Only changed values produce style mutations.
   if(value){if(this.style.getPropertyValue(name)!==value)this.style.setProperty(name,value);}
   else if(this.style.getPropertyValue(name))this.style.removeProperty(name);
  };
  // Resolve solid colors via actual CSS properties: custom properties can still
  // contain var()/color-mix(), and ha-card-background may be a gradient recipe.
  const probe=document.createElement('span');probe.hidden=true;root.append(probe);
  const readColor=()=>{
   const color=getComputedStyle(probe).color;if(parseColor(color))return color;
   // Chromium may retain color(srgb ...)/oklch() after color-mix(). Normalize
   // those solid colors for the shared helper without changing its consumers.
   const ctx=this.materialColorContext||(this.materialColorContext=document.createElement('canvas').getContext('2d',{willReadFrequently:true}));
   ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);
   const [r,g,b]=ctx.getImageData(0,0,1,1).data;return `rgb(${r}, ${g}, ${b})`;
  };
  const solid=token=>{probe.style.color=`var(${token})`;return readColor();};
  const paintSurface=solid('--_em-surface'),inset=solid('--_em-inset');
  probe.style.color=this.config.accent_color||'var(--accent-color,Highlight)';
  const accent=readColor();probe.remove();
  const p=materialAccent(accent,dark,paintSurface,[inset],4.5);
  // Internal derivation never writes public inputs: removing/changing a theme
  // or a public override is effective without clearing consumer-owned tokens.
  for(const key of ['accent','tint1','tint2'])setToken('--_house-'+key,p?.[key]||'');
  setToken('--house-focus',h.getPropertyValue('--eleven-material-focus').trim()||p?.focus||'');
  const effective=getComputedStyle(root);
  // Theme recipe markers are literal CSS identifiers, not var() references:
  // resolve them here so inherited view recipes honor per-card public inputs.
  for(const key of ['card-background','card-shadow','button-background','button-shadow','button-hover-background','selected-background','button-pressed-background','disclosure-pressed-shadow','switch-shadow']){
   const recipe=h.getPropertyValue('--eleven-material-'+key).trim();
   const resolved=recipe.replace(/EM_([A-Z0-9_]+)/g,(_,token)=>effective.getPropertyValue('--_em-'+token.toLowerCase().replaceAll('_','-')).trim());
   setToken('--_house-recipe-'+key,resolved);
  }


  const scope=this.shadowRoot;
  scope.querySelector('ha-card').dataset.material='card';
  scope.querySelectorAll('.summary-tile').forEach(n=>n.dataset.material='well');
  scope.querySelectorAll('.view-toggle button,.controls button').forEach(n=>n.dataset.material='button');
  scope.querySelectorAll('.ui-metric-icon ha-icon').forEach(n=>n.dataset.material='title-icon');
 }
}
class MaterialHouseEditor extends HouseStylePreviewEditor {
 constructor(){
  super();
  // Native ha-form can render before Lovelace calls setConfig.
  // Its schema iterator must already exist during that first update.
  this.form.schema=[];this.form.data={};
 }
 render(){
  super.render();if(!this.config||!this.form)return;
  this.form.schema=[...this.form.schema.filter(s=>!['accent_color','appearance'].includes(s.name)),MaterialHouseCard.getConfigForm().schema.find(s=>s.name==='accent_color')];
  const label=this.form.computeLabel;this.form.computeLabel=s=>s.name==='accent_color'?'Selectieaccent (hex, leeg = thema)':label(s);
 }
}
if(!customElements.get('eleven-material-house'))customElements.define('eleven-material-house',MaterialHouseCard);
if(!customElements.get('eleven-material-house-editor'))customElements.define('eleven-material-house-editor',MaterialHouseEditor);
window.customCards=window.customCards||[];
if(!window.customCards.some(card=>card.type==='eleven-material-house'))window.customCards.push({type:'eleven-material-house',name:'Eleven Material House (pilot)',description:'Approved Material House pilot with a compatible house image manifest',preview:true});
