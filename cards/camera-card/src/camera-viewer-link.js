// Shared across standalone/collection loads. Only mounted sources are retained.
const cameraViewerKey=Symbol.for('eleven-camera-viewer-card.links');
const cameraViewerLinks=globalThis[cameraViewerKey]??=new Map();
export function cameraViewerChannel(id){
 if(!cameraViewerLinks.has(id))cameraViewerLinks.set(id,{source:null,entity:'',listeners:new Set()});
 return cameraViewerLinks.get(id);
}
export function updateCameraViewer(id,source,entity){
 if(!id)return;
 const channel=cameraViewerChannel(id);
 if(entity){channel.source=source;channel.entity=entity;}
 if(channel.source!==source)return;
 for(const listener of [...channel.listeners])listener();
}
export function releaseCameraViewer(id,source){
 if(!id)return;
 const channel=cameraViewerChannel(id);
 if(channel.source===source){channel.source=null;channel.entity='';for(const listener of [...channel.listeners])listener();}
 if(!channel.source&&!channel.listeners.size)cameraViewerLinks.delete(id);
}
