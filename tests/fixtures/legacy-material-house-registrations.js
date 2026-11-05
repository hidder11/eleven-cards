// Exact legacy registration statements from ff91d7d's isolated pilot build.
// Rendering/classes are supplied by the test; these statements intentionally
// preserve the old unguarded public registrations and internal picker entry.
if(!customElements.get('eleven-house-baseline-editor'))customElements.define('eleven-house-baseline-editor',ElevenHouseCardEditor);
if(!customElements.get('eleven-house-baseline'))customElements.define('eleven-house-baseline',ElevenHouseCard);
window.customCards=window.customCards||[];if(!window.customCards.some(c=>c.type==='eleven-house-baseline'))window.customCards.push({type:'eleven-house-baseline',name:'Eleven House Card',description:'Transparant 3D-huis met vooraf berekende verlichting',preview:true});
customElements.define('eleven-house-styled-baseline',HouseStylePreview);
customElements.define('eleven-house-styled-baseline-editor',HouseStylePreviewEditor);
customElements.define('eleven-material-house',MaterialHouseCard);
customElements.define('eleven-material-house-editor',MaterialHouseEditor);
