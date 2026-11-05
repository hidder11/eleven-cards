// The backdrop belongs to the header region, never to the entire card or a tab.
// Relative stops follow the header's intrinsic height, including wrapped content.
export const headerSceneStyles=`
.header-region{position:relative;isolation:isolate;margin:calc(-1 * var(--eleven-card-padding,16px)) calc(-1 * var(--eleven-card-padding,16px)) 0;padding:var(--eleven-card-padding,16px) var(--eleven-card-padding,16px) 0}
.header-region>.header-scene,.header-region>.scene{margin:0;padding-left:0;padding-right:0;padding-top:0;padding-bottom:12px;isolation:auto;overflow:visible}
.header-region>.header-background,.header-region>.scene-background{position:absolute;inset:0;z-index:-1;overflow:hidden;pointer-events:none;opacity:var(--header-background-opacity,1);
--header-fade:linear-gradient(180deg,#000 0%,#000 25%,rgba(0,0,0,.9) 40%,rgba(0,0,0,.65) 55%,rgba(0,0,0,.32) 72%,rgba(0,0,0,.08) 88%,transparent 100%);
-webkit-mask-image:var(--header-fade);mask-image:var(--header-fade)}
`;
