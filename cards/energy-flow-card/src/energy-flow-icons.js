// One stroke family for the diagram and shared metric surfaces.
const energyFlowIconPaths={
 solar:'M3 12h15l2 9H1l2-9ZM4 16h14M7 12l-1 9m7-9 1 9M6 23h9M10 21v2M18 2v2m0 4v2m-4-4h-2m12 0h-2m-7-3-1-1m7 1 1-1M20 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
 sun:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
 grid:'m12 2-7 20m7-20 7 20M8 7h8M6 13h12M3 22h18M12 2v20M8 7l10 6M16 7 6 13',
 home:'m3 10 9-7 9 7M5 9v12h14V9m-6 2-4 6h4l-1 4 4-6h-4l1-4',
 import:'m8 8 6-5 7 5M10 8v13h10V8M2 14h12m-4-4 4 4-4 4',
 export:'m3 8 6-5 6 5M4 8v13h10v-4M10 12h12m-4-4 4 4-4 4'
};
export function energyFlowIcon(kind){return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-energy-icon="${kind}"><path d="${energyFlowIconPaths[kind]??energyFlowIconPaths.home}"/></svg>`;}
