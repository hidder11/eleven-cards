import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CarEntityImage} from '../src/car-entity-image.js';

function fixture(t){
 const images=[],changes=[];
 t.mock.method(globalThis,'Image',class{constructor(){images.push(this);}});
 const hass={connection:{},states:{'image.car':{state:'2026-11-10',attributes:{entity_picture:'/api/image_proxy/image.car?token=first'}}},hassUrl:path=>'https://ha.test'+path};
 const image=new CarEntityImage(()=>changes.push(image.status));
 t.after(()=>image.reset());
 return {image,hass,images,changes};
}
// Node has no browser Image constructor; the mock never makes network requests.
globalThis.Image=class{};

test('entity image is preloaded once and the loaded element survives telemetry updates',t=>{
 const {image,hass,images,changes}=fixture(t);
 image.update(hass,'image.car');assert.equal(image.status,'loading');
 assert.equal(image.image,null);const url=new URL(images[0].src);
 assert.equal(url.origin+url.pathname,'https://ha.test/api/image_proxy/image.car');assert.equal(url.searchParams.get('token'),'first');assert.ok(url.searchParams.has('_eleven_image'));
 images[0].onload();assert.equal(image.status,'ready');assert.equal(image.image,images[0]);
 image.update({...hass,states:{...hass.states,'sensor.soc':{state:'62'}}},'image.car');
 assert.equal(images.length,1);assert.deepEqual(changes,['ready']);
});

test('an updated entity image reloads its unchanged proxy URL and preserves its token',t=>{
 t.mock.timers.enable({apis:['Date'],now:1000});
 const {image,hass,images}=fixture(t);image.update(hass,'image.car');images[0].onload();
 t.mock.timers.tick(1000);hass.states['image.car'].state='2026-11-11';image.update(hass,'image.car');
 assert.equal(images.length,2);assert.equal(image.image,images[0]);
 assert.notEqual(images[0].src,images[1].src);assert.equal(new URL(images[1].src).searchParams.get('token'),'first');
 images[1].onload();assert.equal(image.image,images[1]);
});

test('temporary errors retry without a new hass update and retain the last loaded image',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const {image,hass,images}=fixture(t);
 image.update(hass,'image.car');images[0].onload();
 hass.states['image.car'].attributes.entity_picture='/api/image_proxy/image.car?token=second';
 image.update(hass,'image.car');images[1].onerror();
 assert.equal(image.image,images[0]);assert.equal(image.status,'loading');
 t.mock.timers.tick(1000);assert.equal(images.length,3);images[2].onload();
 assert.equal(image.image,images[2]);assert.equal(image.status,'ready');assert.equal(image.timer,null);
});

test('persistent errors stop after four attempts and a manual retry can recover',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const {image,hass,images}=fixture(t);image.update(hass,'image.car');
 for(const delay of [1000,4000,15000]){images.at(-1).onerror();t.mock.timers.tick(delay);}
 images.at(-1).onerror();assert.equal(image.status,'error');assert.equal(images.length,4);
 image.update({...hass},'image.car');t.mock.timers.tick(60000);assert.equal(images.length,4);
 image.retry();assert.equal(image.status,'loading');assert.equal(images.length,5);
 images.at(-1).onload();assert.equal(image.status,'ready');
});

test('stalled requests time out and retry, ignoring an obsolete load callback',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const {image,hass,images}=fixture(t);image.update(hass,'image.car');const late=images[0].onload;
 t.mock.timers.tick(10000);assert.equal(image.pending,null);t.mock.timers.tick(1000);
 late();assert.equal(image.image,null);images[1].onload();assert.equal(image.image,images[1]);
});

test('new source URLs replace pending attempts and stale responses cannot overwrite them',t=>{
 const {image,hass,images}=fixture(t);image.update(hass,'image.car');const late=images[0].onload;
 hass.states['image.car'].attributes.entity_picture='/local/new.png';image.update(hass,'image.car');
 images[1].onload();late();assert.equal(image.image,images[1]);assert.equal(image.image.src,'https://ha.test/local/new.png');
});

test('disconnect stops requests and reconnect retries even with the same entity URL',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const {image,hass,images}=fixture(t);image.update(hass,'image.car');images[0].onerror();
 image.update({...hass,connected:false},'image.car');t.mock.timers.tick(60000);assert.equal(images.length,1);
 image.update(hass,'image.car');assert.equal(images.length,2);images[1].onload();
 image.update(hass,'image.car',false);assert.equal(image.timeout,null);
 image.update(hass,'image.car',true);assert.equal(images.length,3);
});

test('different entities and HA connections discard the previous vehicle image',t=>{
 const {image,hass,images}=fixture(t);image.update(hass,'image.car');images[0].onload();
 image.update({...hass,connection:{}},'image.car');assert.equal(image.image,null);images[1].onload();
 image.update(hass,'image.other');assert.equal(image.image,null);
 image.reset();assert.equal(image.timer,null);assert.equal(image.timeout,null);assert.equal(image.pending,null);
});

test('missing or unsafe entity URLs use bounded retries and recover when attributes arrive',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const {image,hass,images}=fixture(t);
 hass.states['image.car'].attributes.entity_picture='javascript:alert(1)';image.update(hass,'image.car');
 assert.equal(images.length,0);assert.equal(image.status,'loading');
 for(const delay of [1000,4000,15000])t.mock.timers.tick(delay);
 assert.equal(image.status,'error');assert.equal(images.length,0);
 hass.states['image.car'].attributes.entity_picture='/local/car.png';image.update(hass,'image.car');
 assert.equal(images.length,1);images[0].onload();assert.equal(image.status,'ready');
});
