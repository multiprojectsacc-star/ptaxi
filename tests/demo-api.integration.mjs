import assert from 'node:assert/strict';

const base = process.env.PERSONAL_TAXI_TEST_BASE_URL || 'http://127.0.0.1:5183';
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname)) {
  throw new Error('This test only runs against a local preview.');
}
async function request(path, body, extraHeaders = {}) {
  const response = await fetch(base + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { ...(body === undefined ? {} : {'Content-Type':'application/json'}), ...extraHeaders },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual',
  });
  const text = await response.text();
  let data;
  try { data=JSON.parse(text); } catch { data={}; }
  return {status:response.status,data,headers:response.headers};
}
let passed=0;
function check(name, operation){operation();passed++;console.log(`PASS ${name}`);}
const config = await request('/api/config');
assert.equal(config.status,200);
assert.equal(config.data.mode,'demo','STOP: live mode — never run test booking');
check('demo safety gate and no fixed kilometre cap',()=>{assert.equal(config.data.radiusKm,0);assert.equal(config.data.minimumLeadHours,16);});

const search = await request('/api/locations?q=Krak%C3%B3w');
check('location search returns marked demonstration locations',()=>{assert.equal(search.status,200);assert.ok(search.data.locations.length>0);assert.ok(search.data.locations.every(l=>l.demo===true));});
const airport=await request('/api/locations?q=airport');
check('airport search contains Kraków Airport only',()=>{assert.equal(airport.data.locations.length,1);assert.equal(airport.data.locations[0].id,config.data.airport.id);});
const location=search.data.locations[0];
const input={direction:'from-airport',location,departureAt:new Date(Date.now()+48*3600_000).toISOString(),vehicleId:'sedan',passengers:2,luggage:2,combi:true,currency:'PLN'};

const quote=await request('/api/quote',input);
check('server quote fixes airport endpoint and authoritative amount',()=>{assert.equal(quote.status,200);assert.equal(quote.data.from.id,config.data.airport.id);assert.equal(quote.data.to.id,location.id);assert.equal(quote.data.amount,12900);assert.equal(quote.data.mode,'demo');assert.equal(quote.data.routePoints.length,2);});
const spoofedLocation=await request('/api/quote',{...input,location:{...location,name:'Attacker address',lat:0,lng:0},amount:1});
check('client location coordinates/name and amount cannot alter canonical quote',()=>{assert.equal(spoofedLocation.status,200);assert.equal(spoofedLocation.data.to.name,location.name);assert.equal(spoofedLocation.data.to.lat,location.lat);assert.equal(spoofedLocation.data.amount,12900);});
const soon=await request('/api/quote',{...input,departureAt:new Date(Date.now()+3600_000).toISOString()});
check('16-hour lead enforced',()=>{assert.equal(soon.status,422);assert.equal(soon.data.code,'LEAD_TIME');});
const overcrowded=await request('/api/quote',{...input,passengers:8});
check('eight passengers rejected in sedan',()=>{assert.equal(overcrowded.status,422);assert.equal(overcrowded.data.code,'CAPACITY');});
const airportToAirport=await request('/api/quote',{...input,location:config.data.airport});
check('airport cannot be both endpoints',()=>{assert.equal(airportToAirport.status,422);assert.equal(airportToAirport.data.code,'AIRPORT_ONLY');});
const cityToCity=await request('/api/quote',{...input,direction:'city-to-city'});
check('city-to-city bypass rejected',()=>{assert.equal(cityToCity.status,422);});
const inventedAddress=await request('/api/quote',{...input,location:{...location,id:'invented-address'}});
check('unknown location ID rejected',()=>{assert.equal(inventedAddress.status,422);assert.equal(inventedAddress.data.code,'SELECT_LOCATION');});
const euro=await request('/api/quote',{...input,currency:'EUR'});
check('unsupported currency rejected',()=>{assert.equal(euro.status,422);});
const origin=await request('/api/quote',input,{Origin:'https://not-the-preview.example'});
check('cross-origin booking request rejected',()=>{assert.equal(origin.status,403);});

const farSearch=await request('/api/locations?q=Zakopane');
const farQuote=await request('/api/quote',{...input,location:farSearch.data.locations[0],vehicleId:'van',passengers:8,luggage:7});
check('long-distance route remains allowed with audited van price',()=>{assert.equal(farQuote.status,200);assert.ok(farQuote.data.distanceKm>60);assert.equal(farQuote.data.amount,79300);});

const bookingInput={quoteId:quote.data.quoteId,customer:{firstName:'Test',lastName:'Example',email:'demo-api-test@example.com',phone:'+48123456789'},flightNumber:'TEST 123',notes:'Local demo integration test — no real service',unusualItems:'Example luggage',invoice:{requested:true,companyName:'Example Test Company',taxId:'TEST-ID',address:'Example address'},acceptTerms:true,amount:1,status:'paid',isPayed:true};
const booking=await request('/api/bookings',bookingInput);
check('demo booking persists with no payment or paid-state spoofing',()=>{assert.equal(booking.status,201);assert.equal(booking.data.status,'demo');assert.equal(booking.data.paymentUrl,null);assert.match(booking.data.statusToken,/^[a-f0-9]{64}$/);});
const status=await request('/api/bookings/status?token='+encodeURIComponent(booking.data.statusToken));
check('opaque status retrieves durable booking without contact data',()=>{assert.equal(status.status,200);assert.equal(status.data.bookingId,booking.data.bookingId);assert.equal(status.data.status,'demo');assert.equal(status.data.amount,12900);assert.equal(status.data.emailSent,false);assert.equal(status.data.combi,true);assert.equal('customer' in status.data,false);assert.equal(status.headers.get('cache-control'),'no-store');});
const duplicate=await request('/api/bookings',bookingInput);
check('same quote cannot create a second booking',()=>{assert.equal(duplicate.status,409);assert.equal(duplicate.data.code,'ALREADY_BOOKED');});
const unknown=await request('/api/bookings/status?token='+'a'.repeat(64));
check('unknown token does not disclose booking',()=>{assert.equal(unknown.status,404);});
const forged=await request('/api/payments/notify',{sessionId:'fake',amount:12900,sign:'fake'});
check('fake callback cannot mark demonstration booking paid',()=>{assert.equal(forged.status,409);assert.equal(forged.data.code,'DEMO_MODE');});
const afterForgery=await request('/api/bookings/status?token='+encodeURIComponent(booking.data.statusToken));
check('booking remains demo after forged callback',()=>{assert.equal(afterForgery.data.status,'demo');assert.equal(afterForgery.data.emailSent,false);});
const retry=await request('/api/internal/email-retry',{});
check('internal retry cannot be triggered without secret',()=>{assert.equal(retry.status,401);});
console.log(`${passed} demo API integration checks passed. No real payment or email was attempted.`);
