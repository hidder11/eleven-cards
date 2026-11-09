import test from 'node:test';
import assert from 'node:assert/strict';
import {weatherArt} from '../src/weather-art.js';

test('classic cloud is one rounded silhouette without detached highlights or swoosh',()=>{
 for(const kind of ['partly','cloud','rain','snow','storm','fog']){
  const svg=weatherArt(kind), cloud=svg.match(/<g class="wx-cloud">(.*?)<\/g>/)[1];
  assert.equal((cloud.match(/<path /g)||[]).length,1);
  assert.match(cloud,/C/);
  assert.doesNotMatch(cloud,/#65829f|stroke="#fff"|M43 101a23/);
 }
});
test('only partly-cloudy gets deliberate outer sun offset, preserving local ray origin',()=>{
 assert.match(weatherArt('partly'),/<g class="wx-partly-sun" transform="translate\(54\.6 -3\.1\) scale\(\.82\)"><g class="wx-sun">/);
 assert.doesNotMatch(weatherArt('sun'),/wx-partly-sun/);
 assert.match(weatherArt('sun'),/cx="70" cy="55" r="25"/);
 for(const style of ['glass','neon'])assert.doesNotMatch(weatherArt('partly',style),/wx-partly-sun|wx-cloud/);
});

import {createHash} from 'node:crypto';
const original={"classic:sun": "b49242e54a2e02b6c33f1d0720ee4613594d4bcc40fe04e43adfcf60b00f5129", "classic:partly": "71c1f47b1e0bcfbd96a7029d65065876663876830a2b4fb0fe62e0f11af0a79f", "classic:cloud": "423d7387cae4f9fda14ee8e22963f2679bc04517f22d819dc26ac93e873ba254", "classic:rain": "1ceaece9b31caa7f15e9dcf3092a46e3a1436ae6a654dc326e9247eb8331c297", "classic:night": "257454acce01a1936625751b8d9ea0cdac12dec8209b2d6c1b91adfeb1038593", "classic:snow": "b3f8c0865dff90acbe1725f7c9fc49e6b99c4adea84b08ebe81381244a3cd031", "classic:storm": "be9a93b3d01af36b53e12797304b84ada178d4838974359f0b48800365257078", "classic:fog": "18f593ec1c15dbfb3947432ab66d544a27c8343661cefed9b17624512d631686", "classic:wind": "b7aebf4ec54c45e1dce49dd2cced255d8b837c9c57b9aa64a30aaa6843b342ab", "classic:unknown": "c425e762601a0778fc445312aaa12b078e17d5d1e9218f01c4ec1c0081900499", "glass:sun": "05c8aa8565d0eeee2ad5e7d3d2634d6006847384fcd2a2f1ec7554e9b4b380be", "glass:partly": "35206bf70854886d34fdfa025803363653f8de59aef4ff5e81bd356bb3f83fcd", "glass:cloud": "1724d393c2daebbd20c04be3d8f5e9d5a60ce4e0df237b89ca3c30a055026df8", "glass:rain": "51e7e4b8b2d8211d31e2e7a4ed8e71bd4d65f109bf205cc064fcee45bfbf837f", "glass:night": "79834e2d71606a9baabc77f1edbfffba3af8a8fbb3a15a159aea9d7415d5ffd2", "glass:snow": "b35ea5491677c21cafb3534498e4a3e6cce091a4132a5bee1148b4dedb998e34", "glass:storm": "1d586a841468454cedca2771f2b65433945011bfc9102fc17230edfb4a6d7e40", "glass:fog": "ecff58525683517094d643c8b15224e305f22fa40101ff390462751730458470", "glass:wind": "2a0e35980f533d269103345fa958ec2b2c82d29ac20a819c12f5510c405d0869", "glass:unknown": "9552b7c706e6793eb25a4c60de054feb97b82b5111c49b723a46ba6dcf17f1a3", "neon:sun": "6c2b6fe7c6df0b947cd5e5ad78586b95740b9b02895a8699e75f2740f85fb433", "neon:partly": "12cf579663d5f4f318076d517e4af9e55cba5aae1c9f583ee7f8d0e2adc2ceeb", "neon:cloud": "8766c89967a95d490a81ee35380a31438bbfcc85a63ce8267fbf8d15dd4fc792", "neon:rain": "dfa76b6dbdeb666a5d5e7c257385789ea90f487b95fdb1ffffc4065c3a0d907d", "neon:night": "03793ba0288d04637e14c8ebc4890564bff57dc7ef6fbf1ce9993476c866c0e5", "neon:snow": "f92f88c6dc5a009a603a6915e9dc60066c0e7c43e7f571c1c19ab522352a8a36", "neon:storm": "18bb6f8b50ac4349b027e98c950655a138301ee5786eaf78978c121d03339ad3", "neon:fog": "b20855b51044967e169b692990cfff7f5f7cc7233356a6b07a3ac497faf5e512", "neon:wind": "3ad6f7964609607f19e461b34a3dbca03ed1f14f9e3940769fb9cb80270bc98c", "neon:unknown": "cc97d13f717e7599451f06f214966375ec7a848663f856630dbdf1103adba733"};
test('all classic small icons are byte-identical to entry apart from IDs',()=>{
 for(const [key,hash] of Object.entries(original).filter(([key])=>key.startsWith('classic:'))){const [style,kind]=key.split(':');for(const hero of style==='classic'?[false]:[true,false]){const markup=weatherArt(kind,style,kind,hero).replaceAll(/wx-\d+|wxi-\d+/g,'PAINT');assert.equal(createHash('sha256').update(markup).digest('hex'),hash,key)}}
});

import {weatherStyledArt} from '../src/weather-icon-styles.js';
test('glass/neon main and small illustrations still delegate unchanged family output',()=>{
 const normalize=s=>s.replaceAll(/wx-styled-\d+/g,'PAINT');
 for(const style of ['glass','neon'])for(const kind of ['sun','partly','cloud','rain','night','snow','storm','fog','wind','unknown'])for(const hero of [true,false])assert.equal(normalize(weatherArt(kind,style,kind,hero)),normalize(weatherStyledArt(kind,style)));
});
test('partly-cloudy masks lower rotating rays without clipping standalone sun rays',()=>{
 assert.match(weatherArt('partly'),/clipPath[^>]*partly-rays/);
 assert.match(weatherArt('partly'),/M0 0H160V58H0Z/);
 assert.doesNotMatch(weatherArt('sun'),/clipPath/);
 assert.doesNotMatch(weatherArt('partly','classic','partly',false),/clipPath/);
});
