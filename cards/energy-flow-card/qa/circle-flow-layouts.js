import '../dist/eleven-energy-flow-card.js';

// The preview now renders the production card, with no separate markup or styles.
class CircleFlowLayout extends customElements.get('eleven-energy-flow-card'){}
customElements.define('eleven-circle-flow-layout',CircleFlowLayout);
