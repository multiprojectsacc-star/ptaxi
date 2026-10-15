import type { Config } from "./config";
import { ApiError, notificationSignFields, secureEqual, sha384, registrationSign, verificationSign, providerPaymentMatches, type Notification } from "./rules";

function authorization(c:Config){return `Basic ${btoa(`${c.posId}:${c.p24Key}`)}`;}
export async function registerPayment(booking:{id:string;sessionId:string;amount:number;currency:string;email:string;customerName:string;locale:"pl"|"en";returnPath?:"/travels/status"|"/rezerwacja/status"},statusToken:string,c:Config){
  const sign=await registrationSign(booking.sessionId,c.merchantId,booking.amount,booking.currency,c.p24Crc!);
  const response=await fetch(`${c.p24Base}/api/v1/transaction/register`,{
    method:"POST",headers:{"Content-Type":"application/json",Authorization:authorization(c)},signal:AbortSignal.timeout(15_000),
    body:JSON.stringify({merchantId:c.merchantId,posId:c.posId,sessionId:booking.sessionId,amount:booking.amount,currency:booking.currency,description:`Personal Taxi — ${booking.id}`,email:booking.email,client:booking.customerName.slice(0,40),country:"PL",language:booking.locale,urlReturn:`${c.appUrl}${booking.returnPath||"/rezerwacja/status"}?token=${encodeURIComponent(statusToken)}`,urlStatus:`${c.appUrl}/api/payments/notify`,timeLimit:30,encoding:"UTF-8",sign}),
  });
  const data=await response.json() as {data?:{token?:string};responseCode?:number};
  if(!response.ok||data.responseCode!==0||!data.data?.token)throw new ApiError(502,"PAYMENT_UNAVAILABLE","Nie udało się uruchomić płatności. Żadna opłata nie została pobrana przez stronę.");
  return {token:data.data.token,paymentUrl:`${c.p24Base}/trnRequest/${encodeURIComponent(data.data.token)}`};
}
export async function checkNotificationSignature(notification:Notification,c:Config){
  const expected=await sha384(JSON.stringify(notificationSignFields(notification,c.p24Crc!)));
  if(!secureEqual(expected,notification.sign.toLowerCase()))throw new ApiError(401,"INVALID_SIGNATURE","Nieprawidłowy podpis płatności.");
}
export async function verifyPayment(notification:Notification,c:Config){
  const {sessionId,orderId,amount,currency}=notification;
  const sign=await verificationSign(sessionId,orderId,amount,currency,c.p24Crc!);
  const response=await fetch(`${c.p24Base}/api/v1/transaction/verify`,{
    method:"PUT",headers:{"Content-Type":"application/json",Authorization:authorization(c)},signal:AbortSignal.timeout(15_000),
    body:JSON.stringify({merchantId:c.merchantId,posId:c.posId,sessionId,amount,currency,orderId,sign}),
  });
  const data=await response.json() as {data?:{status?:string};responseCode?:number};
  if(!response.ok||data.responseCode!==0||data.data?.status!=="success")throw new ApiError(502,"VERIFY_FAILED","Potwierdzenie płatności jest chwilowo niedostępne.");
}

/** Authenticated reconciliation after a timeout/crash around transaction/verify. */
export async function confirmedPaymentDetails(notification:Notification,c:Config){
  const response=await fetch(`${c.p24Base}/api/v1/transaction/by/sessionId/${encodeURIComponent(notification.sessionId)}`,{
    headers:{Authorization:authorization(c)},signal:AbortSignal.timeout(10_000),
  });
  if(!response.ok)return false;
  const data=await response.json() as {data?:unknown;responseCode?:number};
  return data.responseCode===0&&providerPaymentMatches(data.data,notification);
}
