import test from 'node:test';
import assert from 'node:assert/strict';
import {powerMotion, statusSymbol} from '../../src/evcc/evcc-gallery.js';

const power = (state, unit = 'kW') => ({state, attributes: {unit_of_measurement: unit}});

test('battery motion scales with 0–11 kW and supports watt sensors', () => {
 assert.equal(powerMotion(power('0')).moving, false);
 assert.equal(powerMotion(power('5.5')).seconds, 7);
 assert.equal(powerMotion(power('5500', 'W')).seconds, 7);
 assert.equal(powerMotion(power('11')).seconds, 2);
 assert.equal(powerMotion(power('22')).seconds, 2);
 assert.equal(powerMotion(power('-5')).moving, false);
 for (const entity of [undefined, power(''), power(null), power('unknown'), power('unavailable'), power('5', 'MW')]) {
  assert.equal(powerMotion(entity).moving, false);
  assert.equal(powerMotion(entity).kw, null);
 }
});

test('state symbols use a fixed known SVG and do not interpolate source text', () => {
 assert.match(statusSymbol('connected'), /<svg/);
 assert.notEqual(statusSymbol('connected'), statusSymbol('disconnected'));
 assert.equal(statusSymbol('<script>'), statusSymbol('unknown'));
});
test('motion supports a chosen maximum power and speed multiplier without changing source units',()=>{
 assert.equal(powerMotion(power('11'),{maxKw:22,speed:1}).seconds,7);
 assert.equal(powerMotion(power('11000','W'),{maxKw:22,speed:2}).seconds,3.5);
 assert.equal(powerMotion(power('22'),{maxKw:22,speed:0.5}).seconds,4);
 assert.equal(powerMotion(power('50'),{maxKw:22,speed:1}).seconds,2);
 assert.equal(powerMotion(power('0'),{maxKw:22,speed:3}).moving,false);
 assert.equal(powerMotion(power('unknown'),{maxKw:22,speed:3}).moving,false);
});
