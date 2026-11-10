// Minimal SVG stand-ins for ha-icon outside HA. Never loaded by a card bundle.
const fixtureIconPaths={
 'account-outline':'M6 21v-3a6 6 0 0 1 12 0v3M15 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
 'motion-sensor':'M4 7a10 10 0 0 1 16 0M7 10a6 6 0 0 1 10 0M10 13a2 2 0 0 1 4 0M14 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
 door:'M5 21V3h14v18M3 21h18M15 12h1',
 'window-closed-variant':'M4 3h16v18H4ZM4 12h16M12 3v18',
 'shield-off-outline':'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6ZM8 9l8 8M16 9l-8 8',
 'shield-check-outline':'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6ZM8 12l3 3 5-6',
 'shield-outline':'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z',
 'shield-lock':'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6ZM9 11h6v6H9Zm1 0V9a2 2 0 0 1 4 0v2',
 'home-outline':'m3 10 9-7 9 7M5 9v12h14V9M10 21v-7h4v7',
 'weather-night':'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z',
 airplane:'m12 3 2 7 7 4v2l-7-2v5l2 2h-8l2-2v-5l-7 2v-2l7-4Z',
 'information-outline':'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 11v6M12 7v1',
 'arrow-expand':'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5',
 'chevron-left':'m14 5-7 7 7 7',
 'chevron-right':'m9 5 7 7-7 7',
 close:'m6 6 12 12M18 6 6 18',
 refresh:'M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 14 0M19 17a8 8 0 0 1-14 0',
 cctv:'m3 5 15 3-2 9-15-3ZM17 10l5-1v9l-6-3M7 16v4h7'
};
class FixtureIcon extends HTMLElement{
 static observedAttributes=['icon'];
 connectedCallback(){this.paint();}
 attributeChangedCallback(){this.paint();}
 paint(){
  const path=fixtureIconPaths[this.getAttribute('icon')?.replace('mdi:','')];
  if(!this.shadowRoot)this.attachShadow({mode:'open'});
  this.shadowRoot.innerHTML=`<style>:host{display:inline-flex;vertical-align:middle;width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px);flex:none}svg{width:100%;height:100%}</style><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path??'M5 5h14v14H5Z'}"/></svg>`;
 }
}
if(!customElements.get('ha-icon'))customElements.define('ha-icon',FixtureIcon);
