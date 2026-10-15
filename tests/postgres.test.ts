import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {eq} from 'drizzle-orm';
import {getDb, migrateDatabase, closeDb} from '../db/client';
import {bookings, quotes, emailOutbox} from '../db/schema';
import {config} from '../lib/server/config';
import {createQuote, createBooking, getBookingStatus} from '../lib/server/booking-service';
import {searchLocations, resolveLocation, DEMO_LOCATIONS} from '../lib/server/locations';
import {createTourQuote} from '../lib/server/tour-service';
import {TOURS, isTourPickup} from '../lib/tours';
import {registerPayment} from '../lib/server/payments';
import {processNotification} from '../lib/server/notification-service';
import {rateLimit, assertSameOrigin} from '../lib/server/http';
import {notificationSignFields, sha384, type Notification} from '../lib/server/rules';

let dataDir: string;
const quoteInput = () => ({direction: 'from-airport', location: DEMO_LOCATIONS[0], departureAt: new Date(Date.now()+48*3600000).toISOString(), vehicleId: 'sedan', passengers: 2, luggage: 2, currency: 'PLN'});
const customer = {firstName: 'Test', lastName: 'Passenger', email: 'test@example.com', phone: '+48000000000'};
const bookingInput = (quoteId: string) => ({quoteId, customer, acceptTerms: true, locale: 'pl'});

before(async () => {
 dataDir = await mkdtemp(join(tmpdir(), 'personal-taxi-postgres-'));
 process.env.PGLITE_DATA_DIR = dataDir;
 process.env.DEMO_MODE = 'true';
 delete process.env.DATABASE_URL;
 delete process.env.VERCEL;
 delete process.env.TOMTOM_API_KEY;
 await migrateDatabase();
});
after(async () => {await closeDb(); await rm(dataDir, {recursive: true, force: true});});

test('PostgreSQL migrations are repeatable and keep millisecond timestamps as numbers', async () => {
 await migrateDatabase();
 const quote = await createQuote(quoteInput());
 const [stored] = await getDb().select().from(quotes).where(eq(quotes.id, quote.quoteId));
 assert.equal(stored.expiresAt, quote.expiresAt);
 assert.ok(stored.createdAt > 1_700_000_000_000);
 assert.equal(stored.amount, 12900);
});

test('quote, booking and opaque status survive PostgreSQL persistence', async () => {
 const quote = await createQuote(quoteInput());
 const booking = await createBooking({...bookingInput(quote.quoteId), flightNumber: 'FR1234', notes: 'Test notes', invoice: {requested: true, companyName: 'Test company', taxId: 'PL1234567890', address: 'Test address'}});
 assert.equal(booking.mode, 'demo');
 assert.equal(booking.paymentUrl, null);
 const status = await getBookingStatus(booking.statusToken);
 assert.equal(status.status, 'demo');
 assert.equal(status.amount, quote.amount);
 assert.equal(status.emailSent, false);
 const [stored] = await getDb().select().from(bookings).where(eq(bookings.id, booking.bookingId));
 assert.notEqual(stored.statusTokenHash, booking.statusToken);
 assert.equal(JSON.parse(stored.payload).invoice.companyName, 'Test company');
 await assert.rejects(createBooking(bookingInput(quote.quoteId)), {code: 'ALREADY_BOOKED'});
 await assert.rejects(getBookingStatus('0'.repeat(64)), {code: 'NOT_FOUND'});
});

test('expired quotes and simultaneous reuse cannot create extra bookings', async () => {
 const expired = await createQuote(quoteInput());
 await getDb().update(quotes).set({expiresAt: Date.now()-1}).where(eq(quotes.id, expired.quoteId));
 await assert.rejects(createBooking(bookingInput(expired.quoteId)), {code: 'QUOTE_EXPIRED'});
 const quote = await createQuote(quoteInput());
 const attempts = await Promise.allSettled([createBooking(bookingInput(quote.quoteId)), createBooking(bookingInput(quote.quoteId))]);
 assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
 assert.equal(attempts.filter(result => result.status === 'rejected').length, 1);
});

test('TomTom cache deduplicates provider IDs and updates PostgreSQL rows', async t => {
 let address = 'Ozimska 2, Opole';
 t.mock.method(globalThis, 'fetch', async () => Response.json({results: [1, 2].map(() => ({id: 'provider-opole', type: 'Point Address', position: {lat: 50.669, lon: 17.923}, address: {countryCode: 'PL', freeformAddress: address}}))}));
 const c = {...config(), mapsMode: 'live' as const, tomtomKey: 'test-key'};
 assert.equal((await searchLocations('Opole', c)).length, 1);
 address = 'Ozimska 2, 45-057 Opole';
 await searchLocations('Opole', c);
 assert.equal((await resolveLocation('provider-opole', c)).address, address);
});

test('rate-limit counters increment atomically in PostgreSQL', async () => {
 const request = new Request('http://localhost/api/quote');
 await rateLimit(request, 'postgres-test', 2);
 await rateLimit(request, 'postgres-test', 2);
 await assert.rejects(rateLimit(request, 'postgres-test', 2), {code: 'RATE_LIMIT'});
});

test('same-origin requests use the public host despite Next internal URLs', () => {
 const request = new Request('http://localhost:5183/api/quote', {headers: {host: '127.0.0.1:5183', origin: 'http://127.0.0.1:5183', 'sec-fetch-site': 'same-origin'}});
 assert.doesNotThrow(() => assertSameOrigin(request));
 assert.throws(() => assertSameOrigin(new Request(request, {headers: {host: '127.0.0.1:5183', origin: 'https://foreign.example'}})), {code: 'ORIGIN'});
 assert.throws(() => assertSameOrigin(new Request(request, {headers: {host: '127.0.0.1:5183', origin: 'http://127.0.0.1:5183', 'sec-fetch-site': 'cross-site'}})), {code: 'ORIGIN'});
 assert.throws(() => assertSameOrigin(new Request(request, {headers: {host: '127.0.0.1:5183', 'x-forwarded-host': 'foreign.example', origin: 'http://foreign.example'}})), {code: 'ORIGIN'});
});

test('Vercel HTTPS origin uses the trusted forwarded host', t => {
 const previous = process.env.VERCEL;
 process.env.VERCEL = '1';
 t.after(() => {if (previous === undefined) delete process.env.VERCEL; else process.env.VERCEL = previous;});
 const request = new Request('http://localhost:3000/api/quote', {headers: {host: 'internal.local', 'x-forwarded-host': 'personal-taxi.vercel.app', origin: 'https://personal-taxi.vercel.app'}});
 assert.doesNotThrow(() => assertSameOrigin(request));
 assert.throws(() => assertSameOrigin(new Request(request, {headers: {host: 'internal.local', 'x-forwarded-host': 'personal-taxi.vercel.app', origin: 'https://foreign.example'}})), {code: 'ORIGIN'});
});

test('signed payment callbacks use PostgreSQL JSONB and create an idempotent email outbox', async t => {
 const quote = await createQuote(quoteInput());
 const booking = await createBooking(bookingInput(quote.quoteId));
 const db = getDb();
 await db.update(bookings).set({mode: 'live', status: 'pending'}).where(eq(bookings.id, booking.bookingId));
 const [stored] = await db.select().from(bookings).where(eq(bookings.id, booking.bookingId));
 const c = {...config(), mode: 'live' as const, merchantId: 100, posId: 101, p24Crc: 'test-crc', p24Key: 'test-key', resendKey: undefined};
 const notification: Notification = {merchantId: 100, posId: 101, sessionId: stored.sessionId, amount: stored.amount, originAmount: stored.amount, currency: 'PLN', orderId: 12345, methodId: 25, statement: 'TEST / ąćę', sign: ''};
 notification.sign = await sha384(JSON.stringify(notificationSignFields(notification, c.p24Crc)));
 let calls = 0;
 t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
  assert.ok(String(input).endsWith('/transaction/verify'));
  calls++;
  return Response.json({responseCode: 0, data: {status: 'success'}});
 });
 await processNotification(notification, c);
 await processNotification(notification, c);
 const [paid] = await db.select().from(bookings).where(eq(bookings.id, booking.bookingId));
 assert.equal(paid.status, 'paid');
 assert.equal(JSON.parse(paid.payload).paymentNotification.statement, notification.statement);
 assert.equal(JSON.parse(paid.payload).customer.email, customer.email);
 assert.ok(paid.paidAt! > 1_700_000_000_000);
 assert.equal((await db.select().from(emailOutbox).where(eq(emailOutbox.bookingId, booking.bookingId))).length, 2);
 assert.equal(calls, 1);
});

test('PostgreSQL transaction rollback preserves booking state', async () => {
 const quote = await createQuote(quoteInput());
 const booking = await createBooking(bookingInput(quote.quoteId));
 const db = getDb();
 await assert.rejects(db.transaction(async tx => {
  await tx.update(bookings).set({status: 'paid'}).where(eq(bookings.id, booking.bookingId));
  await tx.insert(emailOutbox).values({id: 'invalid-foreign-key', bookingId: 'missing-booking', audience: 'customer', createdAt: Date.now()});
 }));
 const [stored] = await db.select().from(bookings).where(eq(bookings.id, booking.bookingId));
 assert.equal(stored.status, 'demo');
});

test('Vercel never falls back to a local file database', async () => {
 await closeDb();
 process.env.VERCEL = '1';
 assert.throws(() => getDb(), /DATABASE_URL/);
 delete process.env.VERCEL;
});

const tourInput = (slug='wieliczka',vehicleId='sedan') => ({slug,vehicleId,pickupId:'demo-rynek',visitAt:new Date(Date.now()+72*3600000).toISOString(),passengers:2,luggage:0});

test('tour tariffs are fixed per vehicle and ignore client amounts and coordinates', async () => {
 for(const tour of TOURS){
  for(const vehicleId of ['sedan','premium','van'] as const){
   const quote=await createTourQuote({...tourInput(tour.slug,vehicleId),amount:1,to:{id:'forged',lat:0,lng:0}});
   assert.equal(quote.amount,tour.prices[vehicleId]);
   assert.equal(quote.to.id,tour.destination.id);
   assert.equal(quote.from.id,'demo-rynek');
   assert.equal(quote.kind,'tour');
   assert.ok(quote.distanceKm>quote.tour.outboundKm);
   assert.ok(Date.parse(quote.departureAt)<Date.parse(quote.tour.visitAt));
  }
 }
 await assert.rejects(createTourQuote(tourInput('unknown')),{code:'TOUR_NOT_FOUND'});
 await assert.rejects(createTourQuote({...tourInput(),passengers:5}),{code:'CAPACITY'});
 assert.equal((await createTourQuote({...tourInput('wieliczka','van'),passengers:8,luggage:7})).amount,35000);
});

test('tour pickup filtering does not constrain airport transfers or trust client municipality',async t=>{
 const c={...config(),mapsMode:'live' as const,tomtomKey:'test-key'};
 t.mock.method(globalThis,'fetch',async()=>Response.json({results:[
  {id:'tour-search-krakow',position:{lat:50.06,lon:19.93},address:{countryCode:'PL',municipality:'Kraków',freeformAddress:'Hotel, Kraków'}},
  {id:'tour-search-zabierzow',position:{lat:50.11,lon:19.79},address:{countryCode:'PL',municipality:'Zabierzów',freeformAddress:'Krakowska, Zabierzów'}},
  {id:'tour-search-opole',position:{lat:50.66,lon:17.92},address:{countryCode:'PL',municipality:'Opole',freeformAddress:'Ozimska, Opole'}}
 ]}));
 assert.equal((await searchLocations('adres',c,'tour')).length,2);
 assert.equal((await searchLocations('adres',c)).length,3);
 assert.equal(isTourPickup(await resolveLocation('tour-search-opole',c)),false);
 assert.equal((await searchLocations('airport',c,'tour'))[0].isAirport,true);
 await assert.rejects(createTourQuote({...tourInput(),pickupId:'demo-wieliczka',municipality:'Kraków'}),{code:'TOUR_OUTSIDE_AREA'});
 assert.equal((await createTourQuote({...tourInput(),pickupId:'krakow-airport'})).from.isAirport,true);
});

test('tour pickup handles midnight and driving time, and checks lead time before pickup',async()=>{
 const visit='2031-06-12T00:30:00+02:00';
 const quote=await createTourQuote({...tourInput('auschwitz-birkenau'),visitAt:visit});
 assert.equal(quote.departureAt,'2031-06-11T20:30:00.000Z');
 const mountains=await createTourQuote(tourInput('zakopane'));
 assert.equal((Date.parse(mountains.tour.visitAt)-Date.parse(mountains.departureAt))/60000,165);
 await assert.rejects(createTourQuote({...tourInput('zakopane'),visitAt:new Date(Date.now()+17*3600000).toISOString()}),{code:'LEAD_TIME'});
});

test('unknown pickup remains explicit and tour booking persists without charging or sending mail in demo',async()=>{
 const quote=await createTourQuote({...tourInput(),pickupId:undefined,pickupPending:true});
 assert.equal(quote.tour.pickupPending,true);
 assert.equal(quote.from.id,'krakow-pickup-pending');
 const booking=await createBooking(bookingInput(quote.quoteId));
 assert.equal(booking.paymentUrl,null);
 const status=await getBookingStatus(booking.statusToken);
 assert.equal(status.kind,'tour');assert.equal(status.tour?.slug,'wieliczka');
 assert.equal(status.tour?.pickupPending,true);assert.equal(status.status,'demo');
 assert.equal(status.amount,29000);assert.equal(status.emailSent,false);
 await assert.rejects(createQuote({...quoteInput(),direction:'tour'}));
});

test('payment return URL is selected by the server for tours and defaults to the airport flow',async t=>{
 const urls:string[]=[];
 t.mock.method(globalThis,'fetch',async(_url:unknown,init?:RequestInit)=>{urls.push(JSON.parse(String(init?.body)).urlReturn);return Response.json({responseCode:0,data:{token:'test-token'}});});
 const c={...config(),p24Crc:'test-crc',p24Key:'test-key',merchantId:100,posId:101,appUrl:'https://example.com'};
 const booking={id:'test',sessionId:'test-session',amount:29000,currency:'PLN',email:'test@example.com',customerName:'Test Passenger',locale:'pl' as const};
 await registerPayment({...booking,returnPath:'/travels/status'},'test-token',c);
 await registerPayment(booking,'test-token',c);
 assert.equal(urls[0],'https://example.com/travels/status?token=test-token');
 assert.equal(urls[1],'https://example.com/rezerwacja/status?token=test-token');
});

test('paid tour callback sends one complete return itinerary to customer and operator using mocked providers',async t=>{
 const quote=await createTourQuote({...tourInput('auschwitz-birkenau'),pickupPending:true,pickupId:undefined});
 const booking=await createBooking(bookingInput(quote.quoteId));
 const db=getDb();await db.update(bookings).set({mode:'live',status:'pending'}).where(eq(bookings.id,booking.bookingId));
 const [row]=await db.select().from(bookings).where(eq(bookings.id,booking.bookingId));
 const c={...config(),mode:'live' as const,merchantId:100,posId:101,p24Crc:'test-crc',p24Key:'test-key',resendKey:'test-key',emailFrom:'test@example.com',operationsEmail:'ops@example.com'};
 const notification:Notification={merchantId:100,posId:101,sessionId:row.sessionId,amount:row.amount,originAmount:row.amount,currency:'PLN',orderId:99999,methodId:25,statement:'TEST',sign:''};
 notification.sign=await sha384(JSON.stringify(notificationSignFields(notification,c.p24Crc)));
 const sent:{subject:string;text:string}[]=[];
 t.mock.method(globalThis,'fetch',async(url:unknown,init?:RequestInit)=>{
  if(String(url).endsWith('/transaction/verify'))return Response.json({responseCode:0,data:{status:'success'}});
  assert.equal(String(url),'https://api.resend.com/emails');sent.push(JSON.parse(String(init?.body)));return Response.json({id:'mock-mail-'+sent.length});
 });
 await processNotification(notification,c);await processNotification(notification,c);
 assert.equal(sent.length,2);
 for(const mail of sent){assert.match(mail.subject,/opłacona wycieczka/);assert.match(mail.text,/Auschwitz-Birkenau/);assert.match(mail.text,/Wyjazd w drogę powrotną/);assert.match(mail.text,/dokładny adres odbioru/);assert.match(mail.text,/bilety osobno/);assert.match(mail.text,/600.00 PLN/);}
 assert.equal((await getBookingStatus(booking.statusToken)).emailSent,true);
});
