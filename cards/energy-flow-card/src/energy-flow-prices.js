import {energyFlowCurrentPrice} from './energy-flow-details-data.js';
// Explicit current-price sensors override Energy only in the selected direction.
// Never substitute another tariff when the chosen sensor is unavailable.
export function energyFlowSelectedPrice(host,direction){
 const id=host._config?.[direction==='import'?'price_entity':'export_price_entity'];
 return id?{configured:true,price:energyFlowCurrentPrice({priceEntity:id},host._hass)}:{configured:false,price:null};
}
