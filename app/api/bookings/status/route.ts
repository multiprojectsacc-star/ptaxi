import { getBookingStatus } from "@/lib/server/booking-service";
import { handle,json,rateLimit } from "@/lib/server/http";
export const dynamic="force-dynamic";
export async function GET(request:Request){return handle(async()=>{
  await rateLimit(request,"status",90);
  return json(await getBookingStatus(new URL(request.url).searchParams.get("token")||""));
});}
