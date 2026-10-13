import { config } from "@/lib/server/config";
import { handle,json } from "@/lib/server/http";
import { ApiError,secureEqual } from "@/lib/server/rules";
import { reconcileNotifications } from "@/lib/server/notification-service";
import { deliverOutbox } from "@/lib/server/email";
export const dynamic="force-dynamic";
export async function POST(request:Request){return handle(async()=>{
  const c=config();
  if(!c.cronSecret||c.cronSecret.length<32||!secureEqual(request.headers.get("authorization")||"",`Bearer ${c.cronSecret}`))throw new ApiError(401,"UNAUTHORIZED","Brak dostępu.");
  await reconcileNotifications(c);
  await deliverOutbox(c);
  return json({status:"processed"});
});}
