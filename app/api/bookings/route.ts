import { createBooking } from "@/lib/server/booking-service";
import { assertSameOrigin,handle,json,rateLimit,readJson } from "@/lib/server/http";
export const dynamic="force-dynamic";
export async function POST(request:Request){return handle(async()=>{
  assertSameOrigin(request);
  await rateLimit(request,"bookings",8);
  return json(await createBooking(await readJson(request)),201);
});}
