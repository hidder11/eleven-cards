async function metricAlternativesChecks(){
 const reports=[],check=(ok,message)=>{if(!ok)throw Error(message);reports.push(message);};
 for(const light of [false,true]){
  if(document.body.classList.contains('light')!==light)document.querySelector('#theme').click();
  for(const compact of [false,true]){
   if(document.querySelector('#density').getAttribute('aria-pressed')!==String(compact))document.querySelector('#density').click();
   for(const dataset of ['energy','car','weather','edge'])for(const info of ['mixed','all','none'])for(const width of [260,480]){
    for(const [key,value] of [['dataset',dataset],['info',info]]){const select=document.getElementById(key);select.value=value;select.dispatchEvent(new Event('change'));}
    for(const card of document.querySelectorAll('.card'))card.style.width=width+'px';
    check(document.querySelectorAll('.variant').length===4,'four comparison variants');
    for(const variant of document.querySelectorAll('.variant')){
     const card=variant.querySelector('.card'),metrics=[...variant.querySelectorAll('[data-ui-metric]')];
     check(card.scrollWidth<=card.clientWidth+1,'variant fits '+width+' '+dataset+' '+variant.className);
     check(variant.querySelectorAll('.ui-metric-info').length===({mixed:2,all:3,none:0})[info],'optional information selection');
     check(metrics.every(m=>getComputedStyle(m.querySelector('.ui-metric-icon')).width===(compact?'20px':'26px')),'variant uses shared icon size');
     const pair=[...variant.querySelectorAll('.metric-pair .ui-metric-value')].map(v=>v.getBoundingClientRect());
     check(Math.abs(pair[0].top-pair[1].top)<.1,'paired variant values align');
     const titles=[...variant.querySelectorAll('.metric-pair .ui-metric-title')].map(v=>v.getBoundingClientRect().bottom);
     check(Math.abs(pair[0].top-Math.max(...titles)-2)<.1,'pair title-value gap remains 2px');
    }
   }
  }
 }
 return reports;
}
