import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SharedGraph} from '../shared/graph.js';

test('hover popups stay six pixels from the pointer and flip at the right and bottom edges',()=>{
 const bounds={left:0,right:400,top:0,bottom:200,width:120,height:80};
 assert.deepEqual(SharedGraph.tooltipPlacement({...bounds,x:140,y:50}),{left:146,top:56});
 assert.deepEqual(SharedGraph.tooltipPlacement({...bounds,x:350,y:170}),{left:224,top:84});
 const clipped=SharedGraph.tooltipPlacement({...bounds,left:80,right:200,x:195,y:20});
 assert.equal(clipped.left,80);assert.ok(clipped.top>=0&&clipped.top+80<=200);
});

test('placement avoids the selected graph markers while remaining beside its anchor',()=>{
 const result=SharedGraph.tooltipPlacement({left:0,right:500,top:0,bottom:300,width:100,height:60,x:150,y:100,markers:[{x:180,y:130}]});
 assert.deepEqual(result,{left:156,top:34});
});

test('synchronized cards use their own data anchor and never copy a stale mouse position or publish hover',()=>{
 globalThis.window={innerWidth:1200,innerHeight:800};
 const box={left:100,right:500,top:300,bottom:500,width:400,height:200};
 const chart={clientWidth:400,clientHeight:200,getBoundingClientRect:()=>box};
 const tooltip={style:{},getBoundingClientRect:()=>({width:140,height:80})};
 const host={_config:{},_tooltipPointer:{x:190,y:340},shadowRoot:{querySelector:()=>({getBoundingClientRect:()=>({top:280,bottom:550})})}};
 const active={source:{},timestamp:123};SharedGraph.hoverState().set('default',active);
 SharedGraph.positionTooltip(host,{chart,tooltip,x:200,y:90,local:false});
 assert.equal(tooltip.style.left,'206px');assert.equal(tooltip.style.top,'96px');
 assert.equal(SharedGraph.hoverState().get('default'),active);
 SharedGraph.positionTooltip(host,{chart,tooltip,x:200,y:90,local:true});
 assert.equal(tooltip.style.left,'96px');assert.equal(tooltip.style.top,'46px');
 SharedGraph.hoverState().clear();
});

test('positioning handles scaled cards and clips popups to the visible viewport',()=>{
 globalThis.window={innerWidth:350,innerHeight:220};
 const chart={clientWidth:400,clientHeight:200,getBoundingClientRect:()=>({left:20,right:220,top:100,bottom:200,width:200,height:100})};
 const tooltip={style:{},getBoundingClientRect:()=>({width:100,height:50})};
 const host={_config:{},shadowRoot:{querySelector:()=>null}};
 const placement=SharedGraph.positionTooltip(host,{chart,tooltip,x:180,y:80});
 assert.ok(placement.left>=24&&placement.left+100<=216);
 assert.ok(placement.top>=104&&placement.top+50<=196);
 assert.equal(parseFloat(tooltip.style.left),(placement.left-20)/.5);
});
