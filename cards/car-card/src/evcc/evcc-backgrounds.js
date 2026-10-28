import {HEADER_BACKGROUNDS,headerBackgroundStyles} from '../../../../shared/header-backgrounds.js';
import {headerSceneStyles} from '../../../../shared/header-scene.js';
import {headerAtmosphereStyles} from '../../../../shared/header-atmosphere.js';
// Selectable header backgrounds; colors describe charging state independently of design.
export const EVCC_BACKGROUNDS=HEADER_BACKGROUNDS;
export const evccBackgroundStyles = `
 .content{--tone-charging:#896400;--tone-planned:#4455ad;--tone-waiting:#386c9b;--tone-done:#277441;--tone-off:#656975;--tone-disconnected:#616b79;--tone-unknown:#777d87;--tone:var(--tone-unknown);--evcc-glow:var(--tone);--status-accent:var(--tone)}
 .content[data-theme=dark]{--tone-charging:#f2c451;--tone-planned:#8fa5ff;--tone-waiting:#82b8e8;--tone-done:#7ed79c;--tone-off:#a7a9b2;--tone-disconnected:#9199a5;--tone-unknown:#858992}
 .content[data-tone=charging]{--tone:var(--tone-charging)}.content[data-tone=planned]{--tone:var(--tone-planned)}.content[data-tone=waiting]{--tone:var(--tone-waiting)}.content[data-tone=done]{--tone:var(--tone-done)}.content[data-tone=off]{--tone:var(--tone-off)}.content[data-tone=disconnected]{--tone:var(--tone-disconnected)}.content[data-tone=unknown]{--tone:var(--tone-unknown)}
 .content[data-tone]{--evcc-glow:var(--tone);--status-accent:var(--tone)}
 ha-card{overflow:hidden}.header-scene{position:relative;isolation:isolate;overflow:hidden;margin:-16px -16px 0;padding:16px 16px 16px}
 .gallery-top{margin:0;padding:0;background:none;border:0}.header-scene .status-line{position:relative;margin:16px 0 0;background:var(--secondary-background-color,#eee);border:0;box-shadow:none}

 .header-background::before,.header-background::after{content:'';position:absolute;pointer-events:none;z-index:-1}
 header{position:relative;z-index:1}header h2{color:color-mix(in srgb,var(--tone) 88%,#fff)}.hero{background:none}.car-stage::before{background:none}.car-stage::after{content:none}
 .content[data-tone=disconnected] .header-background::before,.content[data-tone=disconnected] .header-background::after{opacity:.38}
 .content[data-tone=unknown] .header-background::before,.content[data-tone=unknown] .header-background::after{opacity:.16}

${headerBackgroundStyles}
:where(.content[data-background="ribbon"]) .car-stage::after{opacity:.3}
:where(.content[data-background="prism-glass"]) .car-stage::after,:where(.content[data-background="eclipse"]) .car-stage::after{opacity:.2}
${headerAtmosphereStyles}
 .content[data-tone=disconnected] .header-atmosphere{opacity:.38}.content[data-tone=unknown] .header-atmosphere{opacity:.16}

${headerSceneStyles}
`;
