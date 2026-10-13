import { createQuote } from "@/lib/server/booking-service";
import { assertSameOrigin,handle,json,rateLimit,readJson } from "@/lib/server/http";
export const dynamic="force-dynamic";
export async function POST(request:Request){return handle(async()=>{
  assertSameOrigin(request);
  await rateLimit(request,"quote",20);
  return json(await createQuote(await readJson(request)));
});}
