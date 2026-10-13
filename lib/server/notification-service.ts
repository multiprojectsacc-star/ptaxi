import { and,eq,ne,or,isNull,sql } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings,emailOutbox } from "@/db/schema";
import type { Config } from "./config";
import { ApiError,assertNotificationMatches,notificationSchema,type Notification } from "./rules";
import { checkNotificationSignature,verifyPayment,confirmedPaymentDetails } from "./payments";
import { deliverOutbox } from "./email";

export async function processNotification(notification:Notification,c:Config){
  await checkNotificationSignature(notification,c);
  const db=getDb();
  const [booking]=await db.select().from(bookings).where(eq(bookings.sessionId,notification.sessionId)).limit(1);
  if(!booking)throw new ApiError(404,"NOT_FOUND","Nie znaleziono płatności.");
  assertNotificationMatches(notification,booking,c.merchantId,c.posId);
  if(booking.providerOrderId&&booking.providerOrderId!==String(notification.orderId))throw new ApiError(409,"ORDER_CONFLICT","Identyfikator płatności jest niezgodny.");
  if(booking.status==="paid"){
    await deliverOutbox(c,booking.id);
    return;
  }
  // Save the authenticated event BEFORE the external side effect. The retry job can recover a crash.
  const claimed=await db.update(bookings).set({
    status:"verifying",providerOrderId:String(notification.orderId),
    payload:sql`json_set(${bookings.payload}, '$.paymentNotification', json(${JSON.stringify(notification)}))`,
  }).where(and(eq(bookings.id,booking.id),ne(bookings.status,"paid"),or(isNull(bookings.providerOrderId),eq(bookings.providerOrderId,String(notification.orderId))))).returning({id:bookings.id});
  if(!claimed.length){
    const [current]=await db.select().from(bookings).where(eq(bookings.id,booking.id)).limit(1);
    if(current?.status==="paid"&&current.providerOrderId===String(notification.orderId))return;
    throw new ApiError(409,"ORDER_CONFLICT","Identyfikator płatności jest niezgodny.");
  }
  try{await verifyPayment(notification,c);}catch(error){
    const [current]=await db.select().from(bookings).where(eq(bookings.id,booking.id)).limit(1);
    if(current?.status!=="paid"||current.providerOrderId!==String(notification.orderId)){
      // A previous process may have verified remotely, then died before the local commit.
      if(!await confirmedPaymentDetails(notification,c))throw error;
    }
  }
  const now=Date.now();
  await db.batch([
    db.update(bookings).set({status:"paid",paidAt:now,providerOrderId:String(notification.orderId)}).where(and(eq(bookings.id,booking.id),ne(bookings.status,"paid"),eq(bookings.providerOrderId,String(notification.orderId)))),
    db.insert(emailOutbox).values({id:`${booking.id}:customer`,bookingId:booking.id,audience:"customer",createdAt:now}).onConflictDoNothing(),
    db.insert(emailOutbox).values({id:`${booking.id}:operations`,bookingId:booking.id,audience:"operations",createdAt:now}).onConflictDoNothing(),
  ]);
  await deliverOutbox(c,booking.id);
}

export async function reconcileNotifications(c:Config){
  if(c.mode!=="live")return;
  const pending=await getDb().select({payload:bookings.payload}).from(bookings).where(and(eq(bookings.mode,"live"),eq(bookings.status,"verifying"))).limit(5);
  for(const row of pending){
    try{
      const payload=JSON.parse(row.payload) as {paymentNotification?:unknown};
      await processNotification(notificationSchema.parse(payload.paymentNotification),c);
    }catch{
      // Retained for the next signed callback/scheduler attempt; never downgrade to paid on error.
      console.error("Payment reconciliation remains pending");
    }
  }
}
