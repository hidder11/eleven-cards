import '../dist/eleven-camera-card.js';
import './fixture-icons.js';
import {securityDesignConfig,securityDesignHass} from './security-design-data.js';
import {setupThemePreview} from './security-theme-preview.js';
import {scene} from './security-scene.js';
const proposals=[
 {
  "id": "watermark",
  "name": "1. Shield watermark",
  "description": "Een groot, half buiten beeld geplaatst schild als zachte afdruk. Rustig en herkenbaar als beveiligingskaart."
 },
 {
  "id": "brushed",
  "name": "2. Brushed metal",
  "description": "Fijne horizontale vezels met een brede lichtreflectie. Een matte, geborstelde materiaaluitstraling."
 },
 {
  "id": "paper",
  "name": "3. Cotton paper",
  "description": "Een onregelmatige papierstructuur met kleine vezels. Warm en tactiel, zonder geometrisch patroon."
 },
 {
  "id": "weave",
  "name": "4. Woven fabric",
  "description": "Korte draden die om en om over elkaar lopen. Een zachte textielstructuur met zichtbaar ritme."
 },
 {
  "id": "terrazzo",
  "name": "5. Terrazzo",
  "description": "Losse, onregelmatige steensplinters met veel ruimte ertussen. Speels en architectonisch."
 },
 {
  "id": "pixels",
  "name": "6. Pixel mosaic",
  "description": "Blokken van verschillende afmetingen vormen een digitale compositie. Hoekig en grafisch, zonder doorlopend raster."
 },
 {
  "id": "glass",
  "name": "7. Fluted glass",
  "description": "Verticale glasribben met afwisselend lichte en donkere kanten. Ruimtelijk, met een rustige verticale richting."
 },
 {
  "id": "botanical",
  "name": "8. Botanical",
  "description": "Gestileerde bladeren en fijne nerven langs de rechterrand. Een organische, natuurlijke richting."
 },
 {
  "id": "circuit",
  "name": "9. Circuit traces",
  "description": "Rechthoekige printplaatsporen met open aansluitpunten. Een technische uitstraling met veel lege ruimte."
 },
 {
  "id": "frame",
  "name": "10. Edge light",
  "description": "Alleen een zachte lichtlijn langs de boven- en rechterrand. Het midden blijft vrijwel leeg: de meest minimale optie."
 }
];
const geometry={
 "watermark": "<svg viewBox=\"0 0 500 260\" preserveAspectRatio=\"xMaxYMin slice\"><path class=\"shield-fill\" d=\"m413-38 128 51v97c0 71-68 129-128 157-60-28-128-86-128-157V13Z\"/><path class=\"shield-rim\" d=\"m413-12 105 41v81c0 58-56 108-105 131-49-23-105-73-105-131V29Z\"/></svg>",
 "brushed": "<i></i><b></b>",
 "paper": "<svg viewBox=\"0 0 500 260\" preserveAspectRatio=\"xMaxYMin slice\"><path class=\"fiber\" d=\"m31 19 -2 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m168 92 3 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m305 165 -2 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m442 238 3 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m79 51 -2 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m216 124 3 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m353 197 -2 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m490 10 3 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m127 83 -2 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m264 156 3 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m401 229 -2 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m38 42 3 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m175 115 -2 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m312 188 3 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m449 1 -2 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m86 74 3 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m223 147 -2 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m360 220 3 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m497 33 -2 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m134 106 3 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m271 179 -2 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m408 252 3 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m45 65 -2 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m182 138 3 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m319 211 -2 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m456 24 3 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m93 97 -2 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m230 170 3 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m367 243 -2 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m4 56 3 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m141 129 -2 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m278 202 3 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m415 15 -2 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m52 88 3 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m189 161 -2 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m326 234 3 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m463 47 -2 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m100 120 3 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m237 193 -2 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m374 6 3 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m11 79 -2 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m148 152 3 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m285 225 -2 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m422 38 3 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m59 111 -2 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m196 184 3 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m333 257 -2 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m470 70 3 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m107 143 -2 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m244 216 3 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m381 29 -2 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m18 102 3 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m155 175 -2 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m292 248 3 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m429 61 -2 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m66 134 3 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m203 207 -2 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m340 20 3 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m477 93 -2 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m114 166 3 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m251 239 -2 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m388 52 3 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m25 125 -2 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m162 198 3 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m299 11 -2 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m436 84 3 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m73 157 -2 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m210 230 3 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m347 43 -2 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m484 116 3 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m121 189 -2 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m258 2 3 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m395 75 -2 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m32 148 3 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m169 221 -2 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m306 34 3 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m443 107 -2 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m80 180 3 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m217 253 -2 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m354 66 3 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m491 139 -2 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m128 212 3 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m265 25 -2 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m402 98 3 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m39 171 -2 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m176 244 3 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m313 57 -2 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m450 130 3 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m87 203 -2 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m224 16 3 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m361 89 -2 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m498 162 3 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m135 235 -2 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m272 48 3 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m409 121 -2 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m46 194 3 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m183 7 -2 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m320 80 3 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m457 153 -2 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m94 226 3 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m231 39 -2 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m368 112 3 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m5 185 -2 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m142 258 3 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m279 71 -2 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m416 144 3 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m53 217 -2 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m190 30 3 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m327 103 -2 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m464 176 3 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m101 249 -2 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m238 62 3 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m375 135 -2 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m12 208 3 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m149 21 -2 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m286 94 3 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m423 167 -2 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m60 240 3 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m197 53 -2 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m334 126 3 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m471 199 -2 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m108 12 3 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m245 85 -2 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m382 158 3 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m19 231 -2 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m156 44 3 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m293 117 -2 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m430 190 3 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m67 3 -2 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m204 76 3 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m341 149 -2 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m478 222 3 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m115 35 -2 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m252 108 3 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m389 181 -2 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m26 254 3 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m163 67 -2 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m300 140 3 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m437 213 -2 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m74 26 3 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m211 99 -2 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m348 172 3 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m485 245 -2 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m122 58 3 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m259 131 -2 5\" opacity=\"0.6799999999999999\"/><path class=\"fiber\" d=\"m396 204 3 1\" opacity=\"0.2\"/><path class=\"fiber\" d=\"m33 17 -2 2\" opacity=\"0.32\"/><path class=\"fiber\" d=\"m170 90 3 3\" opacity=\"0.44\"/><path class=\"fiber\" d=\"m307 163 -2 4\" opacity=\"0.56\"/><path class=\"fiber\" d=\"m444 236 3 5\" opacity=\"0.6799999999999999\"/></svg><i></i>",
 "weave": "<i></i><b></b>",
 "terrazzo": "<svg viewBox=\"0 0 500 260\" preserveAspectRatio=\"xMaxYMin slice\"><path class=\"chip\" opacity=\"0.18\" d=\"m220 0 6 -3 3 6 -6 3Z\"/><path class=\"chip\" opacity=\"0.3\" d=\"m303 61 9 -4.5 4.5 9 -9 4.5Z\"/><path class=\"chip\" opacity=\"0.42\" d=\"m386 122 12 -6 6 12 -12 6Z\"/><path class=\"chip\" opacity=\"0.54\" d=\"m469 183 15 -7.5 7.5 15 -15 7.5Z\"/><path class=\"chip\" opacity=\"0.18\" d=\"m252 244 18 -9 9 18 -18 9Z\"/><path class=\"chip\" opacity=\"0.3\" d=\"m335 35 6 -3 3 6 -6 3Z\"/><path class=\"chip\" opacity=\"0.42\" d=\"m418 96 9 -4.5 4.5 9 -9 4.5Z\"/><path class=\"chip\" opacity=\"0.54\" d=\"m501 157 12 -6 6 12 -12 6Z\"/><path class=\"chip\" opacity=\"0.18\" d=\"m284 218 15 -7.5 7.5 15 -15 7.5Z\"/><path class=\"chip\" opacity=\"0.3\" d=\"m367 9 18 -9 9 18 -18 9Z\"/><path class=\"chip\" opacity=\"0.42\" d=\"m450 70 6 -3 3 6 -6 3Z\"/><path class=\"chip\" opacity=\"0.54\" d=\"m233 131 9 -4.5 4.5 9 -9 4.5Z\"/><path class=\"chip\" opacity=\"0.18\" d=\"m316 192 12 -6 6 12 -12 6Z\"/><path class=\"chip\" opacity=\"0.3\" d=\"m399 253 15 -7.5 7.5 15 -15 7.5Z\"/><path class=\"chip\" opacity=\"0.42\" d=\"m482 44 18 -9 9 18 -18 9Z\"/><path class=\"chip\" opacity=\"0.54\" d=\"m265 105 6 -3 3 6 -6 3Z\"/><path class=\"chip\" opacity=\"0.18\" d=\"m348 166 9 -4.5 4.5 9 -9 4.5Z\"/><path class=\"chip\" opacity=\"0.3\" d=\"m431 227 12 -6 6 12 -12 6Z\"/><path class=\"chip\" opacity=\"0.42\" d=\"m514 18 15 -7.5 7.5 15 -15 7.5Z\"/><path class=\"chip\" opacity=\"0.54\" d=\"m297 79 18 -9 9 18 -18 9Z\"/><path class=\"chip\" opacity=\"0.18\" d=\"m380 140 6 -3 3 6 -6 3Z\"/></svg>",
 "pixels": "<svg viewBox=\"0 0 500 260\" preserveAspectRatio=\"xMaxYMin slice\"><rect class=\"pixel\" x=\"235\" y=\"0\" width=\"14\" height=\"14\" opacity=\"0.08\"/><rect class=\"pixel\" x=\"319\" y=\"196\" width=\"28\" height=\"28\" opacity=\"0.16999999999999998\"/><rect class=\"pixel\" x=\"403\" y=\"112\" width=\"42\" height=\"42\" opacity=\"0.26\"/><rect class=\"pixel\" x=\"487\" y=\"28\" width=\"14\" height=\"14\" opacity=\"0.35000000000000003\"/><rect class=\"pixel\" x=\"291\" y=\"224\" width=\"28\" height=\"28\" opacity=\"0.44\"/><rect class=\"pixel\" x=\"375\" y=\"140\" width=\"42\" height=\"42\" opacity=\"0.08\"/><rect class=\"pixel\" x=\"459\" y=\"56\" width=\"14\" height=\"14\" opacity=\"0.16999999999999998\"/><rect class=\"pixel\" x=\"263\" y=\"252\" width=\"28\" height=\"28\" opacity=\"0.26\"/><rect class=\"pixel\" x=\"347\" y=\"168\" width=\"42\" height=\"42\" opacity=\"0.35000000000000003\"/><rect class=\"pixel\" x=\"431\" y=\"84\" width=\"14\" height=\"14\" opacity=\"0.44\"/><rect class=\"pixel\" x=\"235\" y=\"0\" width=\"28\" height=\"28\" opacity=\"0.08\"/><rect class=\"pixel\" x=\"319\" y=\"196\" width=\"42\" height=\"42\" opacity=\"0.16999999999999998\"/><rect class=\"pixel\" x=\"403\" y=\"112\" width=\"14\" height=\"14\" opacity=\"0.26\"/><rect class=\"pixel\" x=\"487\" y=\"28\" width=\"28\" height=\"28\" opacity=\"0.35000000000000003\"/><rect class=\"pixel\" x=\"291\" y=\"224\" width=\"42\" height=\"42\" opacity=\"0.44\"/><rect class=\"pixel\" x=\"375\" y=\"140\" width=\"14\" height=\"14\" opacity=\"0.08\"/><rect class=\"pixel\" x=\"459\" y=\"56\" width=\"28\" height=\"28\" opacity=\"0.16999999999999998\"/><rect class=\"pixel\" x=\"263\" y=\"252\" width=\"42\" height=\"42\" opacity=\"0.26\"/><rect class=\"pixel\" x=\"347\" y=\"168\" width=\"14\" height=\"14\" opacity=\"0.35000000000000003\"/><rect class=\"pixel\" x=\"431\" y=\"84\" width=\"28\" height=\"28\" opacity=\"0.44\"/><rect class=\"pixel\" x=\"235\" y=\"0\" width=\"42\" height=\"42\" opacity=\"0.08\"/><rect class=\"pixel\" x=\"319\" y=\"196\" width=\"14\" height=\"14\" opacity=\"0.16999999999999998\"/><rect class=\"pixel\" x=\"403\" y=\"112\" width=\"28\" height=\"28\" opacity=\"0.26\"/><rect class=\"pixel\" x=\"487\" y=\"28\" width=\"42\" height=\"42\" opacity=\"0.35000000000000003\"/><rect class=\"pixel\" x=\"291\" y=\"224\" width=\"14\" height=\"14\" opacity=\"0.44\"/><rect class=\"pixel\" x=\"375\" y=\"140\" width=\"28\" height=\"28\" opacity=\"0.08\"/></svg>",
 "glass": "<i></i><b></b>",
 "botanical": "<svg viewBox=\"0 0 500 260\" preserveAspectRatio=\"xMaxYMin slice\"><g class=\"leaves\"><path d=\"M505 260C450 193 420 116 405-18\"/><path d=\"M454 179c-72 8-91-19-83-60 43 2 72 19 83 60Z\"/><path d=\"M430 111c48-4 64-39 52-68-31 2-49 26-52 68Z\"/><path d=\"M408 48c-51-5-67-29-59-60 36 2 54 25 59 60Z\"/><path d=\"M487 240c-57 7-99-12-103-48 42-11 82 7 103 48Z\"/></g><g class=\"veins\"><path d=\"m454 179-63-42m39-26 38-53m-60-10-45-48m124 240-79-37\"/></g></svg>",
 "circuit": "<svg viewBox=\"0 0 500 260\" preserveAspectRatio=\"xMaxYMin slice\"><g class=\"traces\"><path d=\"M500 35H365l-25 25H245M500 75h-65l-30 30H310M500 127h-35l-35 35H290M500 210h-110l-30-30h-90M385 0v33l-30 30v32M450 0v20M490 260v-25h-70l-35-35\"/></g><g class=\"pads\"><circle cx=\"245\" cy=\"60\" r=\"4\"/><circle cx=\"310\" cy=\"105\" r=\"4\"/><circle cx=\"290\" cy=\"162\" r=\"4\"/><circle cx=\"270\" cy=\"180\" r=\"4\"/><circle cx=\"355\" cy=\"95\" r=\"4\"/></g></svg>",
 "frame": "<i></i><b></b>"
};
const styles=`
ha-card{position:relative;isolation:isolate}.content{position:relative;z-index:1}.camera-alarm-controls{display:none!important}.camera-security-header{min-height:132px}
.study-background{position:absolute;inset:0;z-index:0;overflow:hidden;border-radius:inherit;pointer-events:none;opacity:var(--study-opacity);color:var(--study-color)}
.study-background[data-coverage=header]{height:var(--study-height);max-height:100%;border-bottom-left-radius:0;border-bottom-right-radius:0;mask-image:linear-gradient(#000 0 45%,transparent 100%)}
.study-background svg{width:100%;height:100%;position:absolute;inset:0;fill:none;stroke:currentColor;stroke-width:1;overflow:visible}

.study-background[data-proposal=watermark] .shield-fill{fill:currentColor;stroke:none;opacity:.19}.study-background[data-proposal=watermark] .shield-rim{stroke:currentColor;stroke-width:1.2;opacity:.45}
.study-background[data-proposal=brushed] i{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 2px,currentColor 2.3px,transparent 2.8px 5px);opacity:.22}.study-background[data-proposal=brushed] b{position:absolute;inset:0;background:linear-gradient(110deg,transparent 15%,currentColor 65%,transparent 92%);opacity:.25}
.study-background[data-proposal=paper] svg{opacity:.28;mask-image:linear-gradient(90deg,transparent,currentColor 85%)}.study-background[data-proposal=paper] .fiber{stroke:currentColor;stroke-width:.7;stroke-linecap:round}.study-background[data-proposal=paper] i{position:absolute;inset:0;background:linear-gradient(120deg,transparent,color-mix(in srgb,currentColor 12%,transparent))}
.study-background[data-proposal=weave] i{position:absolute;inset:0;background:repeating-linear-gradient(0deg,currentColor 0 2px,transparent 2px 9px) 0 0/18px 18px;mask-image:repeating-linear-gradient(90deg,#000 0 7px,transparent 7px 18px);opacity:.24}.study-background[data-proposal=weave] b{position:absolute;inset:0;background:repeating-linear-gradient(90deg,currentColor 0 2px,transparent 2px 9px);mask-image:repeating-linear-gradient(0deg,transparent 0 7px,#000 7px 18px);opacity:.21}.study-background[data-proposal=weave]{mask-image:linear-gradient(90deg,transparent,currentColor)}
.study-background[data-proposal=terrazzo] .chip{fill:currentColor;stroke:currentColor;stroke-width:.4}
.study-background[data-proposal=pixels] .pixel{fill:currentColor;stroke:none}
.study-background[data-proposal=glass] i{position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 17px,color-mix(in srgb,currentColor 50%,transparent) 18px,color-mix(in srgb,currentColor 9%,transparent) 26px,transparent 31px);mask-image:linear-gradient(90deg,transparent,#000 90%)}.study-background[data-proposal=glass] b{position:absolute;inset:0;background:linear-gradient(150deg,transparent 35%,currentColor 100%);opacity:.1}
.study-background[data-proposal=botanical] .leaves{fill:currentColor;fill-opacity:.18;stroke:currentColor;stroke-opacity:.5;stroke-width:1.2}.study-background[data-proposal=botanical] .leaves>path:first-child{fill:none}.study-background[data-proposal=botanical] .veins{stroke:currentColor;stroke-opacity:.25;stroke-width:.8}
.study-background[data-proposal=circuit] .traces{stroke:currentColor;stroke-width:1.2;opacity:.4}.study-background[data-proposal=circuit] .pads{stroke:currentColor;stroke-width:1.5;opacity:.65}
.study-background[data-proposal=frame] i{position:absolute;inset:0;box-shadow:inset 0 2px 0 currentColor,inset -2px 0 0 currentColor;mask-image:linear-gradient(45deg,transparent 25%,#000 100%);opacity:.65}.study-background[data-proposal=frame] b{position:absolute;inset:0;box-shadow:inset 0 14px 20px -17px currentColor,inset -14px 0 20px -17px currentColor}

:host([data-feed=hidden]) .camera-body,:host([data-feed=hidden]) .camera-empty,:host([data-feed=hidden]) .camera-security-tabs,:host([data-feed=hidden]) .camera-navigation{display:none!important}:host([data-feed=hidden]) .camera-security-header{padding-bottom:0;min-height:140px}
.study-background[data-animated=true]>:first-child{animation:study-drift 22s ease-in-out infinite alternate;transform-origin:80% 20%}
@keyframes study-drift{to{transform:translate(-8px,6px) scale(1.04)}}
:host([data-motion-paused]) .study-background *{animation-play-state:paused!important}@media(prefers-reduced-motion:reduce){.study-background *{animation:none!important}}
`;
class ExampleFeed extends HTMLElement{set hass(value){if(!this.firstChild){this.innerHTML=scene(false);this.style.cssText='display:block;height:100%';this.firstChild.style.cssText='display:block;width:100%;height:100%';}}}
customElements.define('background-example-feed',ExampleFeed);
window.loadCardHelpers=async()=>({createCardElement:()=>document.createElement('background-example-feed')});
class BackgroundExample extends customElements.get('eleven-camera-card'){
 _renderSecurity(){
  super._renderSecurity();if(!this.proposal)return;
  if(!this.shadowRoot.querySelector('[data-background-study]')){const style=document.createElement('style');style.dataset.backgroundStudy='';style.textContent=styles;this.dataset.feed='hidden';this.shadowRoot.append(style);}
  let layer=this.shadowRoot.querySelector('.study-background');
  if(!layer){layer=document.createElement('div');layer.className='study-background';layer.ariaHidden='true';layer.dataset.proposal=this.proposal.id;layer.innerHTML=geometry[this.proposal.id];this.shadowRoot.querySelector('ha-card').prepend(layer);}
  const settings=this.settings;layer.dataset.coverage=settings.coverage;layer.dataset.animated=String(settings.animated);
  layer.style.setProperty('--study-color',this.cardBackgroundStatusColor());layer.style.setProperty('--study-opacity',(100-settings.transparency)/100);layer.style.setProperty('--study-height',settings.height+'px');
 }
}
customElements.define('security-background-example',BackgroundExample);
const samples=proposals.map(proposal=>{
 const article=document.createElement('article');article.className='background-item';
 const title=document.createElement('h2');title.textContent=proposal.name;
 const description=document.createElement('p');description.className='background-description';description.textContent=proposal.description;
 const card=document.createElement('security-background-example');card.proposal=proposal;card.settings={coverage:'header',transparency:55,height:220,animated:false};
 article.append(title,description,card);document.querySelector('#examples').append(article);return {proposal,card};
});
function update(){
 const light=document.body.classList.contains('light'),coverage=document.querySelector('#coverage').value;
 const settings={coverage,transparency:Number(document.querySelector('#transparency').value),height:Math.min(2000,Math.max(24,Number(document.querySelector('#height').value)||220)),animated:document.querySelector('#animated').checked};
 document.querySelector('#opacity-value').textContent=settings.transparency+'%';document.querySelector('#height-field').hidden=coverage!=='header';
 for(const {card} of samples){
  card.settings=settings;card.dataset.feed=document.querySelector('#show-feed').checked?'visible':'hidden';
  const config={...structuredClone(securityDesignConfig),cameras:[{entity:'camera.front',name:'Voordeur',motion_entity:'binary_sensor.front_motion',person_entity:'binary_sensor.front_person'}],show_alarm:true,show_contacts:false,show_activity:false,compact:true,card_background:false};
  const hass=securityDesignHass('quiet',light);hass.states[config.alarm_entity].state=document.querySelector('#state').value;
  card.setConfig(config);card.hass=hass;
 }
}
document.querySelector('#theme').onclick=event=>{const light=document.body.classList.toggle('light');event.target.textContent=light?'Donker thema':'Licht thema';};
for(const id of ['state','coverage','animated','show-feed'])document.querySelector('#'+id).onchange=update;
for(const id of ['transparency','height'])document.querySelector('#'+id).oninput=update;
document.querySelector('#height').onchange=event=>{event.target.value=samples[0].card.settings.height;update();};
document.querySelector('#width').onchange=event=>document.body.classList.toggle('narrow',event.target.value==='narrow');
await setupThemePreview(document.querySelector('.controls'),update);
window.securityBackgroundQA={samples};
