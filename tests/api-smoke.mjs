import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5183';
async function call(path,body){const r=await fetch(base+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};}
const config=await call('/api/config');assert.equal(config.data.mode,'demo','This smoke test may only run in demo mode');
const places=await call('/api/locations?q=Zakopane');const location=places.data.locations[0];assert.ok(location);
const input={direction:'from-airport',location,departureAt:new Date(Date.now()+48*3600000).toISOString(),vehicleId:'van',passengers:8,luggage:7,childSeats:0,boosterSeats:0,combi:false,currency:'PLN'};
const q=await call('/api/quote',input);assert.equal(q.status,200);assert.equal(q.data.distanceKm,112.4);assert.equal(q.data.amount,79300);assert.equal(q.data.radiusKm,0);
assert.equal((await call('/api/quote',{...input,vehicleId:'sedan'})).status,422);
assert.equal((await call('/api/quote',{...input,departureAt:new Date().toISOString()})).status,422);
assert.equal((await call('/api/quote',{...input,location:{...location,id:'tampered'}})).status,422);
const customer={firstName:'Test',lastName:'Passenger',email:'test@example.com',phone:'+48500000000'};
const payload={quoteId:q.data.quoteId,customer,flightNumber:'TEST123',notes:'Automated demo smoke test',acceptTerms:true,amount:1,status:'paid'};
const b=await call('/api/bookings',payload);assert.equal(b.status,201);assert.equal(b.data.status,'demo');assert.equal(b.data.paymentUrl,null);
const status=await call('/api/bookings/status?token='+b.data.statusToken);assert.equal(status.status,200);assert.equal(status.data.amount,79300);assert.equal(status.data.status,'demo');assert.equal(status.data.emailSent,false);assert.equal(status.data.passengers,8);assert.equal(status.data.luggage,7);assert.equal('customer' in status.data,false);
assert.equal((await call('/api/bookings',payload)).status,409);
assert.equal((await call('/api/bookings/status?token=invalid')).status,404);
assert.equal((await call('/api/payments/notify',{status:'paid'})).status,409);
console.log('API smoke: demo quote over60km, capacity, lead time, canonical locations, server fare, booking persistence, duplicate prevention, opaque status and malformed webhook passed.');
