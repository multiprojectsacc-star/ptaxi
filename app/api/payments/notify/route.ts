import { config,requireLiveConfig } from "@/lib/server/config";
import { handle,json,readJson } from "@/lib/server/http";
import { ApiError,notificationSchema } from "@/lib/server/rules";
import { processNotification } from "@/lib/server/notification-service";
export const dynamic="force-dynamic";
export async function POST(request:Request){return handle(async()=>{
  const c=config();
  if(c.mode!=="live")throw new ApiError(409,"DEMO_MODE","Płatności nie są aktywne w trybie demonstracyjnym.");
  requireLiveConfig(c);
  await processNotification(notificationSchema.parse(await readJson(request)),c);
  return json({status:"ok"});
});}
