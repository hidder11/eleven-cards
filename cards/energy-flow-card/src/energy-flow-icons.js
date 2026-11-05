// Native HA/MDI glyphs; keep energy colors and accessible parent labels.
const energyFlowIconNames={
 solar:'mdi:solar-power-variant',
 sun:'mdi:weather-sunny',
 grid:'mdi:transmission-tower',
 home:'mdi:home',
 import:'mdi:home-import-outline',
 export:'mdi:home-export-outline'
};
export function energyFlowIcon(kind){
 const key=Object.hasOwn(energyFlowIconNames,kind)?kind:'home';
 return `<ha-icon icon="${energyFlowIconNames[key]}" aria-hidden="true" data-energy-icon="${key}"></ha-icon>`;
}
