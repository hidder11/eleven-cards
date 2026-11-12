import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
// The activity reader shares the bounded HA-read helper.
const files=['../../shared/ui-surface.js','../../shared/ui-button.js','../../shared/ui-primary-value.js','../../shared/ui-metric.js','../../shared/ui-bar.js','../../shared/ui-detail-surface.js','../../shared/ui-tabs.js','../../shared/header-atmosphere.js','../../shared/header-backgrounds.js','../../shared/header-scene.js','src/camera-features.js','src/camera-activity-pages.js','src/camera-utils.js','src/camera-player.js','src/camera-snapshot.js','src/camera-viewer-picker.js','src/camera-feature-styles.js','src/security-status.js','src/security-art.js','src/camera-styles.js','src/camera-editor.js','src/camera-security.js','src/camera-features-view.js','src/camera-card.js','src/camera-viewer-link.js','src/camera-viewer-card.js'];
files.unshift('../../shared/request.js','../../shared/ui-card-title.js');
files.splice(files.indexOf('src/camera-styles.js'),0,'src/camera-alarm.js');
files.splice(2,0,'../../shared/ui-action-button.js','../../shared/card-theme.js');
files.splice(files.indexOf('src/camera-features.js'),0,'../../shared/ui-card-background.js','../../shared/card-background.js');
files.splice(files.indexOf('src/camera-styles.js'),0,'src/camera-theme.js');
files.splice(files.indexOf('src/camera-styles.js'),0,'src/camera-activity-styles.js');
const sources=await Promise.all(files.map(async file=>(await readFile(new URL(file,root),'utf8')).replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'')));
const output=`// Eleven Camera (beta) - self-contained module\n(()=>{\n${sources.join('\n')}\nif(!customElements.get('eleven-camera-card'))customElements.define('eleven-camera-card',CameraCard);\nif(!customElements.get('eleven-camera-viewer-card'))customElements.define('eleven-camera-viewer-card',CameraViewerCard);\nwindow.customCards=window.customCards||[];\nif(!window.customCards.some(card=>card.type==='eleven-camera-card'))window.customCards.push({type:'eleven-camera-card',name:'Eleven Camera (beta)',description:'One or more Home Assistant camera feeds in a grid or tabs.',preview:true});\nif(!window.customCards.some(card=>card.type==='eleven-camera-viewer-card'))window.customCards.push({type:'eleven-camera-viewer-card',name:'Eleven Camera Viewer (beta)',description:'Show the camera selected in a linked Camera card.',preview:true});\n})();\n`;
await mkdir(new URL('dist/',root),{recursive:true});
await writeFile(new URL('dist/eleven-camera-card.js',root),output);
await writeFile(new URL('dist/eleven-camera-card-test.js',root),output.replaceAll('eleven-camera-viewer-card','eleven-camera-viewer-card-test').replaceAll('eleven-camera-viewer-editor','eleven-camera-viewer-editor-test').replaceAll('eleven-camera-card','eleven-camera-card-test').replaceAll('eleven-camera-editor','eleven-camera-editor-test').replaceAll('eleven-card-background-editor','eleven-camera-background-editor-test'));
console.log('Built Eleven Camera (beta)');
