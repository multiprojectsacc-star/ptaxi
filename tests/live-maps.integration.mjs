import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5183';
const auth=process.env.TEST_SITES_TOKEN?{'OAI-Sites-Authorization':'Bearer '+process.env.TEST_SITES_TOKEN}:{};
async function call(path,body){const res=await fetch(base+path,{method:body?'POST':'GET',headers:{...auth,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:res.status,data:await res.json()};}
const config=await call('/api/config');assert.equal(config.data.mode,'demo','Run this test with test payments only');assert.equal(config.data.mapsMode,'live','The real TomTom integration must be configured');
for(const query of ['Opole','Opole, Ozimska 2']){const result=await call('/api/locations?q='+encodeURIComponent(query));assert.equal(result.status,200);assert.equal(result.data.mapsMode,'live');assert.ok(result.data.locations.some(l=>l.address.includes('Opole')),query+' must find Opole');console.log(query+': '+result.data.locations[0].address);}
const result=await call('/api/locations?q='+encodeURIComponent('Opole, Ozimska 2'));
const location=result.data.locations.find(l=>/Ozimska 2,.*Opole/.test(l.address));assert.ok(location,'The exact street address must be available');
const input={direction:'from-airport',location,departureAt:new Date(Date.now()+48*3600000).toISOString(),vehicleId:'sedan',passengers:2,luggage:2,combi:false,childSeats:0,boosterSeats:0,currency:'PLN'};
const quote=await call('/api/quote',input);assert.equal(quote.status,200);assert.equal(quote.data.mapsMode,'live');assert.equal(quote.data.mode,'demo');assert.ok(quote.data.distanceKm>150&&quote.data.distanceKm<300);assert.ok(quote.data.routePoints.length>2);assert.equal(quote.data.amount,(129+Math.max(0,Math.round(quote.data.distanceKm)-20)*7)*100);
console.log('Real route: '+quote.data.distanceKm.toFixed(1)+' km, '+quote.data.durationMinutes+' min, '+quote.data.amount/100+' PLN');
const reverse=await call('/api/quote',{...input,direction:'to-airport'});assert.equal(reverse.status,200);assert.equal(reverse.data.to.id,'krakow-airport');assert.equal(reverse.data.from.address,location.address);
const booking=await call('/api/bookings',{quoteId:quote.data.quoteId,customer:{firstName:'Test',lastName:'Passenger',email:'test@example.com',phone:'+48500000000'},locale:'pl',acceptTerms:true});assert.equal(booking.status,201);assert.equal(booking.data.status,'demo');assert.equal(booking.data.paymentUrl,null);
const status=await call('/api/bookings/status?token='+booking.data.statusToken);assert.equal(status.status,200);assert.equal(status.data.to.address,location.address);assert.equal(status.data.emailSent,false);
console.log('Live address, real routing in both directions, server fare and safe test booking: PASS');
