import {applyReviewTheme} from './theme.js';
import {configs,createFixture} from './fixtures.js';
// Disposable preview-only subclass. Production element/configuration stays unchanged.
const Base=customElements.get('eleven-actions-card');
const proposalStyles=`
:host{container-type:inline-size}
.content{padding:16px}
@container(max-width:330px){.content{padding:12px}}
.heading{margin-bottom:12px}
.actions{gap:8px;align-items:stretch}
.actions .action{align-items:flex-start;justify-content:flex-start;text-align:start;gap:6px;padding:10px;min-height:76px;overflow-wrap:break-word}
.action .split-label{font-size:inherit;line-height:1.4;overflow-wrap:break-word}
.actions .action ha-icon{--mdc-icon-size:28px;width:28px;height:28px;color:var(--secondary-text-color)}
.action .split-label small{margin-top:4px}
.actions .action:not(:disabled):active{transform:translateY(1px)}
@media(prefers-reduced-motion:reduce){.action{transition:none}}
`;
class ControlPadProposal extends Base{
 _render(){super._render();if(!this._config||!this.shadowRoot)return;if(!this.shadowRoot.querySelector('#control-pad-proposal-style')){const style=document.createElement('style');style.id='control-pad-proposal-style';style.textContent=proposalStyles;this.shadowRoot.append(style);this._fitActions();}}
}
customElements.define('eleven-control-pad-proposal',ControlPadProposal);
const entry=configs.find(([name])=>name==='actions-card');
const config={type:'custom:eleven-actions-card',title:'Control Pad',...structuredClone(entry[2])};
const fixture=createFixture('actions-card');
fixture.callService=async(domain,service,data)=>{window.controlPadCalls.push([domain,service,data]);const entity=fixture.states[data.entity_id];document.querySelector('#demo-status').textContent='Voorbeeldopdracht verstuurd: '+(entity?.attributes?.friendly_name||data.entity_id)+'. Je huis is niet bediend.';};
window.controlPadCalls=[];window.controlPadCards=[];
for(const[id,tag]of [['current','eleven-actions-card'],['proposal','eleven-control-pad-proposal']]){const card=document.createElement(tag);card.dataset.variant=id;document.querySelector('#'+id+' .card-frame').append(card);card.setConfig(structuredClone(config));card.hass=fixture;window.controlPadCards.push(card);}
let dark=false;
function theme(){for(const key of [...document.body.style])if(key.startsWith('--'))document.body.style.removeProperty(key);applyReviewTheme(dark);if(document.querySelector('#paint').value==='native'){
for(const key of [...document.body.style])if(key.startsWith('--eleven-material-')||key==='--ha-card-box-shadow')document.body.style.removeProperty(key);
const values={'ha-card-background':'var(--card-background-color)','ha-card-border-radius':'12px','ha-card-box-shadow':'none',...(dark?{'primary-background-color':'#111111','card-background-color':'#1c1c1c','secondary-background-color':'#282828','primary-text-color':'#e1e1e1','secondary-text-color':'#aaaaaa','divider-color':'#424242'}:{'primary-background-color':'#fafafa','card-background-color':'#ffffff','secondary-background-color':'#f2f2f2','primary-text-color':'#212121','secondary-text-color':'#666666','divider-color':'#dddddd'})};for(const[k,v]of Object.entries(values))document.body.style.setProperty('--'+k,v);}
document.body.style.setProperty('--accent-color',dark?'#c3a1e4':'#67448e');document.documentElement.style.setProperty('--preview-width',document.querySelector('#width').value+'px');document.querySelector('#mode').textContent=dark?'Licht thema':'Donker thema';document.querySelector('#mode').setAttribute('aria-pressed',String(dark));for(const card of controlPadCards)card.hass={...card.hass,themes:{darkMode:dark}};window.controlPadDark=dark;}
document.querySelector('#mode').onclick=()=>{dark=!dark;theme();};document.querySelector('#paint').onchange=theme;document.querySelector('#width').onchange=theme;theme();window.controlPadReady=true;
