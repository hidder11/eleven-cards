import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chartEntityItems} from '../shared/chart-insights.js';
test('sum information uses the total name rather than mislabelling it as the primary sensor',()=>{
 const host={_config:{entities:['sensor.a'],series_options:[{entity:'sensor.a',sum_entities:['sensor.b']}]},_hass:{states:{'sensor.a':{attributes:{friendly_name:'Kitchen'}},'sensor.b':{attributes:{friendly_name:'Office'}}}}};
 assert.equal(chartEntityItems(host)[0].name,'Kitchen + Office');
 host._config.series_options[0].name='Total';assert.equal(chartEntityItems(host)[0].name,'Total');
 delete host._config.series_options[0].name;delete host._config.series_options[0].sum_entities;assert.equal(chartEntityItems(host)[0].name,'Kitchen');
});
