import { z } from "zod";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) { super(message); this.status=status; this.code=code; }
}

export const locationSchema = z.object({
  id: z.string().min(1).max(250), name: z.string().min(1).max(180), address: z.string().max(250),
  lat: z.number().finite().min(-90).max(90), lng: z.number().finite().min(-180).max(180),
});
export const quoteSchema = z.object({
  direction: z.enum(["from-airport", "to-airport"]),
  location: locationSchema,
  departureAt: z.string().datetime({ offset: true }),
  vehicleId: z.enum(["sedan", "premium", "van"]),
  passengers: z.number().int().min(1).max(8),
  luggage: z.number().int().min(0).max(8).default(1),
  childSeats: z.literal(0).default(0),
  boosterSeats: z.literal(0).default(0),
  combi: z.boolean().default(false),
  currency: z.literal("PLN").default("PLN"),
});
export type QuoteInput = z.infer<typeof quoteSchema>;
export const bookingSchema = z.object({
  quoteId: z.string().uuid(),
  locale: z.enum(["pl","en"]).default("pl"),
  customer: z.object({
    firstName: z.string().trim().min(2).max(50),
    lastName: z.string().trim().min(2).max(60),
    email: z.string().trim().email().max(50),
    phone: z.string().trim().regex(/^\+?[\d ()-]{7,20}$/).refine(value => { const digits=value.replace(/\D/g, ""); return digits.length>=7 && digits.length<=15; }),
  }),
  flightNumber: z.string().trim().max(20).default(""),
  notes: z.string().trim().max(1000).default(""),
  unusualItems: z.string().trim().max(500).default(""),
  invoice: z.object({
    requested: z.boolean().default(false),
    companyName: z.string().trim().max(150).default(""),
    taxId: z.string().trim().max(25).default(""),
    address: z.string().trim().max(250).default(""),
  }).default({ requested: false, companyName: "", taxId: "", address: "" }),
  acceptTerms: z.literal(true),
}).superRefine((data, ctx) => {
  if (data.invoice.requested && (!data.invoice.companyName || !data.invoice.taxId || !data.invoice.address)) {
    ctx.addIssue({ code: "custom", path: ["invoice"], message: "Uzupełnij dane do faktury." });
  }
});
export type BookingInput = z.infer<typeof bookingSchema>;

export const notificationSchema = z.object({
  merchantId: z.number().int().positive(), posId: z.number().int().positive(),
  sessionId: z.string().min(1).max(100), amount: z.number().int().positive(),
  originAmount: z.number().int().positive(), currency: z.literal("PLN"),
  orderId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  methodId: z.number().int().nonnegative(), statement: z.string().max(250),
  sign: z.string().regex(/^[a-fA-F0-9]{96}$/),
});
export type Notification = z.infer<typeof notificationSchema>;

export function assertLeadTime(departureAt: string, now = Date.now()) {
  const timestamp = Date.parse(departureAt);
  if (!Number.isFinite(timestamp) || timestamp < now + 16 * 3600_000) {
    throw new ApiError(422, "LEAD_TIME", "Zarezerwuj transfer co najmniej 16 godzin przed odjazdem.");
  }
}
export function assertPassengerCapacity(input: QuoteInput) {
  const capacity = input.vehicleId === "van" ? 8 : 4;
  const bags = input.vehicleId === "van" ? 7 : 4;
  if (input.passengers > capacity || input.luggage > bags) throw new ApiError(422, "CAPACITY", "Wybierz samochód mieszczący wszystkich pasażerów i bagaż.");
  if (input.childSeats + input.boosterSeats > Math.min(3, input.passengers)) throw new ApiError(422, "CHILD_SEATS", "Sprawdź liczbę fotelików i pasażerów.");
}
export function haversine(a: {lat:number;lng:number}, b: {lat:number;lng:number}) {
  const r = Math.PI / 180;
  const dlat = (b.lat - a.lat) * r, dlng = (b.lng - a.lng) * r;
  const n = Math.sin(dlat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dlng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(n), Math.sqrt(Math.max(0, 1 - n)));
}
export function assertServiceArea(airport: {lat:number;lng:number;id:string}, location: {lat:number;lng:number;id:string}, radiusKm: number) {
  const distance = haversine(airport, location);
  if (location.id === airport.id || distance < 0.05) throw new ApiError(422, "AIRPORT_ONLY", "Wybierz adres poza lotniskiem. Jeden koniec transferu to zawsze Kraków Airport.");
  if (radiusKm > 0 && distance > radiusKm) throw new ApiError(422, "OUTSIDE_AREA", `Ten adres znajduje się poza obszarem transferów (${radiusKm} km od lotniska).`);
}
export async function sha384(value: string) {
  const hash = await crypto.subtle.digest("SHA-384", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), x => x.toString(16).padStart(2, "0")).join("");
}
export function secureEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
export function notificationSignFields(n: Notification, crc: string) {
  return { merchantId:n.merchantId,posId:n.posId,sessionId:n.sessionId,amount:n.amount,originAmount:n.originAmount,currency:n.currency,orderId:n.orderId,methodId:n.methodId,statement:n.statement,crc };
}
export function assertNotificationMatches(n: Notification, stored: { sessionId:string;amount:number;currency:string;mode:string }, merchantId:number,posId:number) {
  if (stored.mode !== "live" || n.merchantId !== merchantId || n.posId !== posId || n.sessionId !== stored.sessionId || n.amount !== stored.amount || n.originAmount !== stored.amount || n.currency !== stored.currency) {
    throw new ApiError(400,"PAYMENT_MISMATCH","Dane płatności nie zgadzają się z rezerwacją.");
  }
}
export function escapeHtml(value: string) { return value.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!)); }

export async function registrationSign(sessionId:string,merchantId:number,amount:number,currency:string,crc:string){
  return sha384(JSON.stringify({sessionId,merchantId,amount,currency,crc}));
}
export async function verificationSign(sessionId:string,orderId:number,amount:number,currency:string,crc:string){
  return sha384(JSON.stringify({sessionId,orderId,amount,currency,crc}));
}

export function providerPaymentMatches(details: unknown, notification: Notification) {
  if (!details || typeof details !== "object") return false;
  const d = details as Record<string,unknown>;
  return d.status === 2 && d.sessionId === notification.sessionId && d.orderId === notification.orderId && d.amount === notification.amount && d.currency === notification.currency;
}
