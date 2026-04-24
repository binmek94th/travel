// src/app/bookings/[id]/confirmation/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/src/lib/firebase-admin";
import Link from "next/link";

async function getUid() {
    try {
        const jar = await cookies();
        const val = jar.get("session")?.value;
        if (!val) return null;
        const d = await adminAuth.verifySessionCookie(val, true);
        return d.uid;
    } catch { return null; }
}

function fmt(n: number) {
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function BookingConfirmationPage({
                                                          params,
                                                          searchParams,
                                                      }: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ session_id?: string }>;
}) {
    const { id }         = await params;
    const { session_id } = await searchParams;

    const uid = await getUid();
    if (!uid) redirect("/auth/login");

    const bookingDoc = await adminDb.collection("bookings").doc(id).get();
    if (!bookingDoc.exists) redirect("/bookings");

    const booking = { id: bookingDoc.id, ...bookingDoc.data() } as any;
    if (booking.userId !== uid) redirect("/bookings");

    const tourDoc = await adminDb.collection("tours").doc(booking.tourId).get();
    const tour    = tourDoc.exists ? { id: tourDoc.id, ...tourDoc.data() } as any : null;

    const isConfirmed = booking.status === "confirmed";
    const isPending   = booking.status === "pending_payment";

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F0F9FF] via-white to-[#F0F9FF]" style={{ paddingTop: 80 }}>
            <div className="mx-auto max-w-2xl px-6 py-16 text-center">

                {/* Status icon */}
                <div className="mb-6 flex justify-center">
                    {isConfirmed ? (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_8px_32px_rgba(16,185,129,0.35)]"
                             style={{ animation: "pop 0.5s cubic-bezier(0.22,1,0.36,1)" }}>
                            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                                <path d="M6 18l8 8 16-16"/>
                            </svg>
                        </div>
                    ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_8px_32px_rgba(245,158,11,0.35)]">
                            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                                <path d="M18 12v8M18 26v1"/>
                            </svg>
                        </div>
                    )}
                </div>

                <h1 className="text-3xl font-bold text-[#0A3D52] mb-2"
                    style={{ fontFamily:"'Playfair Display',serif", letterSpacing:"-0.02em" }}>
                    {isConfirmed ? "Booking confirmed! 🎉" : "Booking received"}
                </h1>
                <p className="text-base font-light text-[#1A6A8A] mb-2">
                    {isConfirmed
                        ? "Your deposit has been paid and your spot is secured."
                        : "We're waiting for payment confirmation. This usually takes a few seconds."
                    }
                </p>
                <p className="text-sm text-[#1A6A8A] mb-8">
                    Booking reference: <span className="font-mono font-bold text-[#0A3D52]">{id.slice(0, 8).toUpperCase()}</span>
                </p>

                {/* Booking card */}
                <div className="rounded-2xl border border-[rgba(14,133,178,0.12)] bg-white p-6 text-left shadow-[0_4px_24px_rgba(14,133,178,0.08)] mb-6">
                    {tour && (
                        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[rgba(14,133,178,0.08)]">
                            <div className="h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA]">
                                {tour.images?.[0]
                                    ? <img src={tour.images[0]} alt={tour.title} className="w-full h-full object-cover"/>
                                    : <div className="w-full h-full flex items-center justify-center text-2xl">🧭</div>
                                }
                            </div>
                            <div>
                                <p className="font-bold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>{tour.title}</p>
                                <p className="text-sm text-[#1A6A8A]">{tour.durationDays} days · {booking.travelers} traveler{booking.travelers !== 1 ? "s" : ""}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Start date",  value: booking.startDate ? new Date(booking.startDate).toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" }) : "—" },
                            { label: "End date",    value: booking.endDate   ? new Date(booking.endDate).toLocaleDateString("en-US",   { month:"long", day:"numeric", year:"numeric" }) : "—" },
                            { label: "Deposit paid",  value: `$${fmt(booking.depositAmountUSD)}` },
                            { label: "Remaining due", value: `$${fmt(booking.remainingAmountUSD)}` },
                            { label: "Status",      value: isConfirmed ? "✅ Confirmed" : "⏳ Pending" },
                            { label: "Total",       value: `$${fmt(booking.totalAmountUSD)}` },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[#1A6A8A]">{label}</p>
                                <p className="text-sm font-semibold text-[#0A3D52] mt-0.5">{value}</p>
                            </div>
                        ))}
                    </div>

                    {booking.specialRequests && (
                        <div className="mt-4 rounded-xl bg-[#F8FCFF] p-3">
                            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[#1A6A8A]">Special requests</p>
                            <p className="text-sm text-[#0A3D52] mt-0.5">{booking.specialRequests}</p>
                        </div>
                    )}
                </div>

                {/* Remaining payment info */}
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 mb-8 text-left">
                    <p className="text-sm font-bold text-amber-800 mb-1">⏰ Remaining balance</p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                        Your remaining balance of <strong>${fmt(booking.remainingAmountUSD)}</strong> is due before your travel date.
                        We'll email you a payment link closer to your trip. You can also view this in your bookings.
                    </p>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/bookings"
                          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#28B8E8] to-[#0A6A94] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_16px_rgba(14,133,178,0.35)] transition-all hover:-translate-y-0.5">
                        View my bookings
                    </Link>
                    <Link href="/tours"
                          className="flex items-center justify-center gap-2 rounded-xl border border-[rgba(14,133,178,0.22)] bg-white px-6 py-3 text-sm font-medium text-[#1A6A8A] transition-all hover:bg-[#EBF8FF]">
                        Browse more tours
                    </Link>
                </div>

                <style>{`
          @keyframes pop {
            0%   { transform: scale(0.5); opacity: 0; }
            70%  { transform: scale(1.1); }
            100% { transform: scale(1);   opacity: 1; }
          }
        `}</style>
            </div>
        </div>
    );
}