// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase-admin";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function getUid(req: NextRequest): Promise<string | null> {
    try {
        const cookie = req.cookies.get("session")?.value;
        if (!cookie) return null;
        const decoded = await adminAuth.verifySessionCookie(cookie, true);
        return decoded.uid;
    } catch { return null; }
}

export async function POST(req: NextRequest) {
    const uid = await getUid(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const {
            tourId, startDate, travelers,
            emergencyName, emergencyPhone, specialRequests,
        } = await req.json();

        // Validate required fields
        if (!tourId || !startDate || !travelers || !emergencyName || !emergencyPhone) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Fetch tour to verify it exists and is active
        const tourDoc = await adminDb.collection("tours").doc(tourId).get();
        if (!tourDoc.exists) return NextResponse.json({ error: "Tour not found" }, { status: 404 });
        const tour = tourDoc.data()!;
        if (tour.status !== "active") return NextResponse.json({ error: "Tour is not available" }, { status: 400 });

        // Fetch user info
        const userDoc = await adminDb.collection("users").doc(uid).get();
        const user    = userDoc.data() ?? {};

        // Validate travelers within group size
        if (travelers < (tour.groupSizeMin ?? 1) || travelers > (tour.groupSizeMax ?? 999)) {
            return NextResponse.json({ error: `Travelers must be between ${tour.groupSizeMin} and ${tour.groupSizeMax}` }, { status: 400 });
        }

        // Server-side price calculation (don't trust client)
        const serverTotal   = Math.round(tour.priceUSD * travelers * 100) / 100;
        const serverDeposit = Math.round(serverTotal * 0.2 * 100) / 100;

        // Create pending booking in Firestore first
        const bookingRef = adminDb.collection("bookings").doc();
        const bookingData = {
            id:             bookingRef.id,
            tourId,
            userId:         uid,
            userName:       user.displayName ?? user.name ?? "",
            userEmail:      user.email ?? "",
            operatorId:     tour.operatorId ?? "",
            startDate,
            endDate:        calcEndDate(startDate, tour.durationDays ?? 1),
            travelers:      Number(travelers),
            emergencyName,
            emergencyPhone,
            specialRequests: specialRequests ?? "",
            status:         "pending_payment",
            confirmed: false,
            totalAmountUSD:   serverTotal,
            depositAmountUSD: serverDeposit,
            remainingAmountUSD: Math.round((serverTotal - serverDeposit) * 100) / 100,
            depositPaid:    false,
            remainingPaid:  false,
            createdAt:      new Date().toISOString(),
            updatedAt:      new Date().toISOString(),
        };

        await bookingRef.set(bookingData);

        // Create Stripe Checkout Session
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency:     "usd",
                        unit_amount:  Math.round(serverDeposit * 100), // cents
                        product_data: {
                            name:        `${tour.title} — 20% Deposit`,
                            description: `${travelers} traveler${travelers !== 1 ? "s" : ""} · Starts ${new Date(startDate).toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" })} · ${tour.durationDays} days`,
                            images:      tour.images?.[0] ? [tour.images[0]] : [],
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                bookingId: bookingRef.id,
                tourId,
                userId:    uid,
            },
            customer_email: user.email ?? undefined,
            success_url: `${appUrl}/bookings/${bookingRef.id}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url:  `${appUrl}/bookings/new?tourId=${tourId}&canceled=1`,
            expires_at:  Math.floor(Date.now() / 1000) + 30 * 60, // 30 min expiry
        });

        return NextResponse.json({ checkoutUrl: session.url, bookingId: bookingRef.id });

    } catch (err: any) {
        console.error("[POST /api/bookings]", err);
        return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
    }
}

// GET — list user's bookings
export async function GET(req: NextRequest) {
    const uid = await getUid(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const snap = await adminDb.collection("bookings")
        .where("userId", "==", uid)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

    const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ bookings });
}

function calcEndDate(startDate: string, durationDays: number): string {
    const d = new Date(startDate);
    d.setDate(d.getDate() + durationDays - 1);
    return d.toISOString().split("T")[0];
}