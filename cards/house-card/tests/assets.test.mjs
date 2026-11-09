import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/house-pixels.js',import.meta.url),'utf8');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function setup({corrupt=false,gzip=false}={}){
 const bytes=new Float32Array([.1,.2,.3]).buffer,alpha=new Float32Array([1]).buffer,zipped=gzipSync(new Uint8Array(bytes)),calls=[];
 const manifest={schema:1,dtype:'float32-le',channels:3,width:1,height:1,release:'fixture',lights:[],views:[{id:'front',alpha:'alpha',modes:{morning:{base:'base',layers:[]},afternoon:{base:'base',layers:[]},evening:{base:'night',layers:[]},night:{base:'night',layers:[]}}}],files:{base:{sha256:corrupt?'0'.repeat(64):digest(new Uint8Array(bytes)),...(gzip?{gzip:{file:'base.gz',sha256:digest(zipped),bytes:zipped.length}}:{})},night:{sha256:digest(new Uint8Array(bytes))},alpha:{sha256:digest(new Uint8Array(alpha))}}};
 const fetch=async url=>{const name=new URL(url).pathname.split('/').pop();calls.push(name);return name==='manifest.json'?Response.json(manifest):name==='pointer.json'?Response.json({manifest:'manifest.json'}):new Response(name==='base.gz'?zipped:name==='alpha'?alpha:bytes);};
 const context=vm.createContext({fetch,Response,Blob,URL,ArrayBuffer,DataView,Uint8Array,Uint8ClampedArray,Float32Array,DecompressionStream,document:{baseURI:'https://example.invalid/'}});
 vm.runInContext(source+';globalThis.pixels=HousePixels;',context);return {pixels:context.pixels,calls};
}
test('manifest pointer, alpha, lazy phases and cache deduplicate asset downloads',async()=>{
 const {pixels,calls}=setup();const loaded=await pixels.load('/pointer.json','front',{mode:'afternoon'});
 assert.equal(loaded.arrays.night,null);assert.deepEqual(calls,['pointer.json','manifest.json','base','alpha']);
 await Promise.all([pixels.ensureMode(loaded,'night'),pixels.ensureMode(loaded,'night')]);assert.equal(calls.filter(v=>v==='night').length,1);
 await pixels.load('/pointer.json','front',{mode:'afternoon'});assert.equal(calls.filter(v=>v==='base').length,1);assert.equal(calls.filter(v=>v==='alpha').length,1);
});
test('manifest-supplied checksum mismatch rejects rather than displaying corrupted layers',async()=>{
 const {pixels}=setup({corrupt:true});await assert.rejects(pixels.load('/manifest.json','front',{mode:'afternoon'}),/Checksum/);
});
test('manifest-owned gzip checks compressed and decompressed checksums',async()=>{
 const {pixels,calls}=setup({gzip:true});const loaded=await pixels.load('/manifest.json','front',{mode:'afternoon'});assert.equal(loaded.arrays.afternoon.base.length,3);assert.ok(calls.includes('base.gz'));assert.ok(!calls.includes('base'));
});
