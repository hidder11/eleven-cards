// Presentation helpers shared by Actions, Controls and Waste; no card registration.
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const icon=name=>`<ha-icon icon="${esc(name)}" aria-hidden="true"></ha-icon>`;
export const CSS=`
:host{display:block;min-width:0;height:100%;color:var(--primary-text-color)}
ha-card{display:block;box-sizing:border-box;height:100%;overflow:hidden;background:var(--ha-card-background,var(--card-background-color));border-radius:var(--ha-card-border-radius,12px)}
.content{padding:16px;font-family:var(--ha-font-family-body,inherit);line-height:1.4}.heading{display:flex;align-items:baseline;gap:8px;margin-bottom:14px}h2{font-size:18px;font-weight:650;letter-spacing:-.01em;line-height:1.25;margin:0;flex:1}
button{font:inherit;color:inherit;cursor:pointer;appearance:none;border:0;border-radius:8px;background:var(--secondary-background-color);min-width:44px;min-height:44px;box-sizing:border-box;transition:background 120ms ease-out}button:hover:not(:disabled){background:color-mix(in srgb,var(--primary-color) 12%,var(--secondary-background-color))}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}button:disabled{opacity:.45;cursor:default}ha-icon{--mdc-icon-size:22px;display:inline-flex;width:22px;height:22px;flex:none}
.actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.action{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:8px;padding:12px;min-height:76px;text-align:left;font-size:13px;font-weight:550;overflow-wrap:anywhere}.action ha-icon{color:var(--primary-color)}.action:nth-child(n+4){background:transparent;border:1px solid var(--divider-color)}
.split-label{display:block}.split-label small{display:block;color:var(--secondary-text-color);font-size:11px;font-weight:400;margin-top:1px}.feedback:empty{display:none}.feedback{font-size:12px;margin-top:10px;color:var(--secondary-text-color);overflow-wrap:anywhere}.feedback.error{color:var(--error-color)}
.target{text-align:center;min-width:49px;font-size:16px;font-weight:550;font-variant-numeric:tabular-nums}.target small{display:block;font-weight:400;font-size:10px;color:var(--secondary-text-color)}
.identity{background:transparent;text-align:left;flex:1;min-width:0;padding:0;display:flex;gap:9px;align-items:center}.identity ha-icon{color:var(--secondary-text-color)}.identity span{min-width:0;overflow-wrap:anywhere;font-size:13px}.identity small{display:block;font-size:11px;color:var(--secondary-text-color)}
@media(max-width:380px){.content{padding:12px}.action{padding:10px;min-height:72px}}@media(prefers-reduced-motion:reduce){button{transition:none}}
`;
export function CSSescape(s){return String(s).replace(/["\\]/g,'\\$&');}
