import {createTourQuote} from '@/lib/server/tour-service';
import {assertSameOrigin,handle,json,rateLimit,readJson} from '@/lib/server/http';
export const dynamic='force-dynamic';
export async function POST(request:Request){return handle(async()=>{
 assertSameOrigin(request);await rateLimit(request,'tour-quote',20);
 return json(await createTourQuote(await readJson(request)));
});}
