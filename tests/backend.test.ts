import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
// @ts-ignore Native Node TypeScript runner requires explicit file extensions.
import { ApiError, assertLeadTime, assertPassengerCapacity, assertServiceArea, assertNotificationMatches, quoteSchema, bookingSchema, notificationSchema, notificationSignFields, registrationSign, verificationSign, sha384, secureEqual, providerPaymentMatches } from "../lib/server/rules.ts";
// @ts-ignore Native Node TypeScript runner requires explicit file extensions.
import { AIRPORT, calculatePrice } from "../lib/booking.ts";

const now=Date.parse("2026-10-13T12:00:00Z");
const location={id:"test",name:"Rynek Główny",address:"Kraków",lat:50.06143,lng:19.93658};
const input={direction:"from-airport",location,departureAt:"2026-10-14T10:00:00Z",vehicleId:"sedan",passengers:2,luggage:2,currency:"PLN"};
const notification={merchantId:100,posId:101,sessionId:"session-test",amount:12900,originAmount:12900,currency:"PLN",orderId:12345,methodId:25,statement:"TEST / ąćę",sign:"a".repeat(96)};

test("legacy price thresholds use rounded road kilometres and integer grosz",()=>{
  assert.equal(calculatePrice(20.499,"sedan"),12900);
  assert.equal(calculatePrice(20.5,"sedan"),13600);
  assert.equal(calculatePrice(31,"premium"),24600);
  assert.equal(calculatePrice(20,"van"),14900);
  assert.equal(calculatePrice(112.4,"van"),79300);
});
test("16-hour advance booking enforced, including invalid and past dates",()=>{
  assert.doesNotThrow(()=>assertLeadTime(new Date(now+16*3600_000).toISOString(),now));
  for(const date of [new Date(now+16*3600_000-1).toISOString(),"not a date","2026-10-12T12:00:00Z"]){assert.throws(()=>assertLeadTime(date,now),ApiError);}
});
test("no default radial limit but fixed airport cannot be both endpoints",()=>{
  assert.doesNotThrow(()=>assertServiceArea(AIRPORT,{id:"zakopane",lat:49.29412,lng:19.95311},0));
  assert.throws(()=>assertServiceArea(AIRPORT,AIRPORT,0),ApiError);
  assert.throws(()=>assertServiceArea(AIRPORT,{id:"spoof",lat:AIRPORT.lat,lng:AIRPORT.lng},0),ApiError);
  assert.throws(()=>assertServiceArea(AIRPORT,{id:"zakopane",lat:49.29412,lng:19.95311},60),ApiError);
});
test("schema rejects unknown travel directions and invalid coordinates",()=>{
  assert.equal(quoteSchema.safeParse({...input,direction:"city-to-city"}).success,false);
  assert.equal(quoteSchema.safeParse({...input,location:{...location,lat:91}}).success,false);
  assert.equal(quoteSchema.safeParse({...input,location:{...location,lng:NaN}}).success,false);
  assert.equal(quoteSchema.safeParse({...input,childSeats:1}).success,false);
});
test("capacity is enforced independently of client vehicle availability",()=>{
  assert.throws(()=>assertPassengerCapacity(quoteSchema.parse({...input,passengers:5})),ApiError);
  assert.throws(()=>assertPassengerCapacity(quoteSchema.parse({...input,vehicleId:"van",luggage:8})),ApiError);
  assert.doesNotThrow(()=>assertPassengerCapacity(quoteSchema.parse({...input,vehicleId:"van",passengers:8,luggage:7})));
});
test("client amount, paid state and arbitrary redirect URLs are not accepted booking fields",()=>{
  const result=bookingSchema.parse({quoteId:"17a06a88-83d5-4c20-9c05-93a5cec6274d",customer:{firstName:"Jan",lastName:"Kowalski",email:"test@example.com",phone:"+48123456789"},acceptTerms:true,amount:1,isPayed:true,urlReturn:"https://attacker.example"});
  assert.equal("amount" in result,false);
  assert.equal("isPayed" in result,false);
  assert.equal("urlReturn" in result,false);
  assert.equal(bookingSchema.safeParse({...result,acceptTerms:false}).success,false);
  assert.equal(bookingSchema.safeParse({...result,customer:{...result.customer,phone:"()()()()()"}}).success,false);
  assert.equal(bookingSchema.safeParse({...result,invoice:{requested:true}}).success,false);
});
test("P24 register and verification signatures use distinct ordered numeric fields",async()=>{
  const expectedRegister=createHash("sha384").update('{"sessionId":"session-test","merchantId":100,"amount":12900,"currency":"PLN","crc":"test-crc"}').digest("hex");
  const expectedVerify=createHash("sha384").update('{"sessionId":"session-test","orderId":12345,"amount":12900,"currency":"PLN","crc":"test-crc"}').digest("hex");
  assert.equal(await registrationSign("session-test",100,12900,"PLN","test-crc"),expectedRegister);
  assert.equal(await verificationSign("session-test",12345,12900,"PLN","test-crc"),expectedVerify);
  assert.notEqual(expectedRegister,expectedVerify);
});
test("notification signature preserves required key order and unescaped Unicode",async()=>{
  const n=notificationSchema.parse(notification);
  const serialized=JSON.stringify(notificationSignFields(n,"test-crc"));
  assert.equal(serialized,'{"merchantId":100,"posId":101,"sessionId":"session-test","amount":12900,"originAmount":12900,"currency":"PLN","orderId":12345,"methodId":25,"statement":"TEST / ąćę","crc":"test-crc"}');
  const signature=await sha384(serialized);
  assert.equal(signature,createHash("sha384").update(serialized).digest("hex"));
  assert.equal(secureEqual(signature,signature),true);
  assert.equal(secureEqual(signature,signature.slice(0,-1)+"x"),false);
});
test("valid signature cannot authorize wrong amount, session, merchant or demo booking",()=>{
  const n=notificationSchema.parse(notification);
  const stored={sessionId:"session-test",amount:12900,currency:"PLN",mode:"live"};
  assert.doesNotThrow(()=>assertNotificationMatches(n,stored,100,101));
  for(const modified of [{...n,amount:1},{...n,originAmount:1},{...n,sessionId:"other"},{...n,merchantId:102},{...n,posId:102}])assert.throws(()=>assertNotificationMatches(modified,stored,100,101),ApiError);
  assert.throws(()=>assertNotificationMatches(n,{...stored,mode:"demo"},100,101),ApiError);
});
test("P24 rejects unsafe integer IDs and malformed signatures",()=>{
  assert.equal(notificationSchema.safeParse({...notification,orderId:Number.MAX_SAFE_INTEGER+1}).success,false);
  assert.equal(notificationSchema.safeParse({...notification,sign:"not-signed"}).success,false);
  assert.equal(notificationSchema.safeParse({...notification,amount:129.5}).success,false);
});

test("reconciliation only accepts the same fully paid provider transaction",()=>{
  const n=notificationSchema.parse(notification);
  const details={status:2,sessionId:n.sessionId,orderId:n.orderId,amount:n.amount,currency:n.currency};
  assert.equal(providerPaymentMatches(details,n),true);
  for(const invalid of [null,{}, {...details,status:1},{...details,status:3},{...details,amount:1},{...details,orderId:999},{...details,currency:"EUR"},{...details,sessionId:"other"}])assert.equal(providerPaymentMatches(invalid,n),false);
});
