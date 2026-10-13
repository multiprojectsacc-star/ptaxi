import { AIRPORT } from "@/lib/booking";
import { config } from "@/lib/server/config";
import { json } from "@/lib/server/http";
export const dynamic="force-dynamic";
export async function GET(){const c=config();return json({mode:c.mode,minimumLeadHours:16,radiusKm:c.radiusKm,currency:"PLN",airport:AIRPORT});}
