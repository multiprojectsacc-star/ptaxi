import assert from 'node:assert/strict';
const base=(process.env.TEST_BASE_URL||'http://127.0.0.1:5183').replace(/\/$/,'');
async function get(path){const r=await fetch(base+path);assert.equal(r.status,200);return r.json();}
async function post(path,body){return fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify(body)});}
const config=await get('/api/config');
assert.equal(config.mode,'demo','Integration test must never run real bookings or payments.');
assert.equal(config.mapsMode,'live','This test requires real TomTom search and routes.');
const pickup=(await get('/api/locations?scope=tour&q='+encodeURIComponent('Hotel Stary Kraków'))).locations.find(l=>l.name==='Hotel Stary');
assert.ok(pickup,'Expected a real pickup suggestion in Kraków.');
const opole=(await get('/api/locations?q=Opole')).locations[0];assert.ok(opole);
const input={slug:'wieliczka',vehicleId:'van',passengers:5,luggage:2,visitAt:new Date(Date.now()+72*3600000).toISOString(),pickupId:pickup.id};
const outside=await post('/api/tours/quote',{...input,pickupId:opole.id,municipality:'Kraków'});assert.equal(outside.status,422);assert.equal((await outside.json()).code,'TOUR_OUTSIDE_AREA');
const response=await post('/api/tours/quote',{...input,amount:1});assert.equal(response.status,200);
const quote=await response.json();assert.equal(quote.kind,'tour');assert.equal(quote.amount,35000);assert.equal(quote.mapsMode,'live');assert.ok(quote.routePoints.length>2);assert.ok(quote.distanceKm>quote.tour.outboundKm);assert.ok(Date.parse(quote.departureAt)<Date.parse(quote.tour.visitAt));
const result=await post('/api/bookings',{quoteId:quote.quoteId,locale:'pl',customer:{firstName:'Test',lastName:'Integracyjny',email:'test@example.com',phone:'+48600123456'},notes:'Automatyczny test integracyjny — tryb demonstracyjny.',acceptTerms:true});assert.equal(result.status,201);
const booking=await result.json();assert.equal(booking.paymentUrl,null);assert.equal(booking.mode,'demo');
const status=await get('/api/bookings/status?token='+encodeURIComponent(booking.statusToken));assert.equal(status.status,'demo');assert.equal(status.kind,'tour');assert.equal(status.amount,35000);assert.equal(status.emailSent,false);assert.equal(status.tour.slug,'wieliczka');
console.log('Tours: real pickup search, outside-area rejection, TomTom return route, fixed 350 PLN price, demo booking and status passed.');
