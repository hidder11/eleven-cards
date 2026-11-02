export function coverRequest(state,entity,action){
 const bit={open:1,close:2,stop:8}[action];
 if(!available(state)||!/^cover\.[a-z0-9_]+$/.test(entity)||!bit||!(Number(state.attributes?.supported_features)&bit))return null;
 return {domain:'cover',service:action+'_cover',data:{entity_id:entity}};
}
export function actionRequest(state,entity){
 if(!available(state)||!/^(scene|script)\.[a-z0-9_]+$/.test(entity))return null;
 return {domain:entity.split('.')[0],service:'turn_on',data:{entity_id:entity}};
}

export const available=s=>!!s&&!['unknown','unavailable'].includes(s.state);
export const finite=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
export function temperatureRequest(state,direction){
 if(!available(state)||![-1,1].includes(direction))return null;
 const a=state.attributes??{};if(!finite(a.temperature))return null;
 const step=finite(a.target_temp_step)&&Number(a.target_temp_step)>0?Number(a.target_temp_step):0.5;
 const value=Number((Number(a.temperature)+direction*step).toFixed(6));
 if((finite(a.min_temp)&&value<Number(a.min_temp))||(finite(a.max_temp)&&value>Number(a.max_temp)))return null;
 return value;
}
