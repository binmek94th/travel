// src/app/bookings/new/BookingClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {Controller, useForm} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import DatePicker from "@/src/components/ui/DatePicker";

type Tour = {
    id: string; title: string; durationDays: number;
    priceUSD: number; priceETB: number; groupSizeMin: number; groupSizeMax: number;
    images: string[]; categories: string[]; description: string;
};

type User = { uid: string; name: string; email: string; nationality: string };

type Props = {
    tour: Tour; user: User;
    deposit: number; remaining: number;
};

const schema = z.object({
    startDate:        z.string().min(1, "Please select a start date"),
    travelers:        z.coerce.number().min(1, "At least 1 traveler").max(50, "Max 50 travelers"),
    emergencyName:    z.string().min(2, "Emergency contact name required"),
    emergencyPhone:   z.string().min(6, "Emergency contact phone required"),
    specialRequests:  z.string().optional(),
    agreedToTerms:    z.literal(true, { errorMap: () => ({ message: "You must agree to continue" }) }),
});

type FormValues = z.infer<typeof schema>;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function minDate() {
    const d = new Date();
    d.setDate(d.getDate() + 3); // at least 3 days from now
    return d.toISOString().split("T")[0];
}

function endDate(start: string, days: number) {
    if (!start) return "";
    const d = new Date(start);
    d.setDate(d.getDate() + days - 1);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── STEP INDICATOR ────────────────────────────────────────────────────────────
function Steps({ current }: { current: 1 | 2 }) {
    const steps = ["Trip details", "Review & pay"];
    return (
        <div className="flex items-center gap-0 mb-8">
            {steps.map((s, i) => {
                const n       = i + 1;
                const done    = n < current;
                const active  = n === current;
                return (
                    <div key={s} className="flex items-center">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all"
                                 style={{
                                     background: done || active ? "linear-gradient(135deg,#28B8E8,#0A6A94)" : "rgba(14,133,178,0.08)",
                                     color: done || active ? "#fff" : "#1A6A8A",
                                     boxShadow: active ? "0 4px 12px rgba(14,133,178,0.35)" : "none",
                                 }}>
                                {done ? (
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                        <path d="M2 6l3 3 5-5"/>
                                    </svg>
                                ) : n}
                            </div>
                            <span className="text-sm font-medium" style={{ color: active ? "#0A3D52" : done ? "#1E9DC8" : "#1A6A8A" }}>
                {s}
              </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className="mx-4 h-px w-16 transition-all" style={{ background: done ? "#1E9DC8" : "rgba(14,133,178,0.15)" }}/>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── TOUR SUMMARY CARD ─────────────────────────────────────────────────────────
function TourSummary({ tour, travelers, deposit, remaining, startDate }: {
    tour: Tour; travelers: number; deposit: number; remaining: number; startDate: string;
}) {
    const total   = tour.priceUSD * travelers;
    const depAmt  = Math.round(total * 0.2 * 100) / 100;
    const remAmt  = Math.round((total - depAmt) * 100) / 100;

    return (
        <div className="rounded-2xl border border-[rgba(14,133,178,0.12)] bg-white overflow-hidden shadow-[0_4px_24px_rgba(14,133,178,0.07)] sticky top-24">
            {/* Tour image */}
            <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA]">
                {tour.images?.[0] ? (
                    <img src={tour.images[0]} alt={tour.title} className="absolute inset-0 w-full h-full object-cover"/>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">🧭</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(6,30,50,0.55)]"/>
                <div className="absolute bottom-3 left-4 right-4">
                    <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily:"'Playfair Display',serif" }}>
                        {tour.title}
                    </p>
                </div>
            </div>

            <div className="p-5">
                {/* Trip info */}
                <div className="flex flex-col gap-2.5 mb-4">
                    {[
                        { icon: "🗓", label: "Duration", value: `${tour.durationDays} day${tour.durationDays !== 1 ? "s" : ""}` },
                        { icon: "👥", label: "Travelers", value: `${travelers} person${travelers !== 1 ? "s" : ""}` },
                        ...(startDate ? [{ icon: "📅", label: "Starts", value: new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }] : []),
                        ...(startDate ? [{ icon: "🏁", label: "Ends", value: endDate(startDate, tour.durationDays) }] : []),
                    ].map(({ icon, label, value }) => (
                        <div key={label} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-[#1A6A8A]">
                <span className="text-base">{icon}</span>{label}
              </span>
                            <span className="text-sm font-semibold text-[#0A3D52]">{value}</span>
                        </div>
                    ))}
                </div>

                {/* Price breakdown */}
                <div className="border-t border-[rgba(14,133,178,0.08)] pt-4">
                    <div className="flex flex-col gap-2 mb-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[#1A6A8A]">${fmt(tour.priceUSD)} × {travelers}</span>
                            <span className="text-sm font-semibold text-[#0A3D52]">${fmt(total)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-emerald-600 font-medium">Deposit today (20%)</span>
                            <span className="text-sm font-bold text-emerald-600">${fmt(depAmt)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[#1A6A8A]">Remaining balance</span>
                            <span className="text-sm text-[#1A6A8A]">${fmt(remAmt)}</span>
                        </div>
                    </div>

                    <div className="rounded-xl bg-gradient-to-r from-[#EBF8FF] to-[#D6F0FA] p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-[#0A3D52]">Due now</span>
                            <span className="text-xl font-bold text-[#1E9DC8]">${fmt(depAmt)}</span>
                        </div>
                        <p className="text-[0.65rem] text-[#1A6A8A] mt-0.5">Remaining ${fmt(remAmt)} due before travel</p>
                    </div>
                </div>

                {/* Trust badges */}
                <div className="mt-4 flex flex-col gap-1.5">
                    {["Free cancellation within 24h", "Secure payment via Stripe", "Instant confirmation"].map(b => (
                        <div key={b} className="flex items-center gap-1.5 text-[0.68rem] text-[#1A6A8A]">
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round">
                                <path d="M2 6l3 3 5-5"/>
                            </svg>
                            {b}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function BookingClient({ tour, user, deposit, remaining }: Props) {
    const router  = useRouter();
    const [step,     setStep]     = useState<1 | 2>(1);
    const [submitting, setSubmitting] = useState(false);

    const {
        register, handleSubmit, watch, setValue, control, trigger,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            startDate: "", travelers: tour.groupSizeMin ?? 1,
            emergencyName: "", emergencyPhone: "", specialRequests: "",
            agreedToTerms: undefined,
        },
    });

    const travelers = watch("travelers") || 1;
    const startDate = watch("startDate");
    const total     = tour.priceUSD * travelers;
    const depAmt    = Math.round(total * 0.2 * 100) / 100;
    const remAmt    = Math.round((total - depAmt) * 100) / 100;

    async function goToReview() {
        const ok = await trigger(["startDate", "travelers", "emergencyName", "emergencyPhone"]);
        if (!ok) { toast.error("Please fill in all required fields"); return; }
        setStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Final submit → create booking → redirect to Stripe
    async function onSubmit(data: FormValues) {
        setSubmitting(true);
        try {
            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tourId:          tour.id,
                    startDate:       data.startDate,
                    travelers:       data.travelers,
                    emergencyName:   data.emergencyName,
                    emergencyPhone:  data.emergencyPhone,
                    specialRequests: data.specialRequests,
                }),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "Failed to create booking");

            // Redirect to Stripe checkout
            if (json.checkoutUrl) {
                window.location.href = json.checkoutUrl;
            } else {
                throw new Error("No checkout URL returned");
            }
        } catch (err: any) {
            toast.error(err.message ?? "Something went wrong");
            setSubmitting(false);
        }
    }

    const inputCls = "w-full rounded-xl border border-[rgba(14,133,178,0.18)] bg-white px-4 py-3 text-sm text-[#0A3D52] outline-none transition-all placeholder:text-[#1A6A8A]/50 focus:border-[#1E9DC8] focus:ring-2 focus:ring-[rgba(14,133,178,0.12)]";
    const errCls   = "border-red-300 focus:border-red-400 focus:ring-red-100";
    const labelCls = "block text-sm font-semibold text-[#0A3D52] mb-1.5";

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F0F9FF] via-white to-[#F0F9FF]" style={{ paddingTop: 80 }}>

            <div className="mx-auto max-w-6xl px-6 py-10">

                {/* Back */}
                <Link href={`/tours/${tour.id}`}
                      className="inline-flex items-center gap-1.5 text-sm text-[#1A6A8A] mb-6 hover:text-[#0A3D52] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 2L4 7l5 5"/></svg>
                    Back to tour
                </Link>

                <div className="mb-2">
                    <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#1E9DC8] mb-1">Booking</p>
                    <h1 className="text-3xl font-bold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif", letterSpacing:"-0.02em" }}>
                        Complete your booking
                    </h1>
                </div>

                <Steps current={step}/>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

                    {/* ── LEFT FORM ── */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit(onSubmit)} noValidate>

                            {/* ── STEP 1: Trip details ── */}
                            {step === 1 && (
                                <div className="flex flex-col gap-6">

                                    {/* Traveler info (pre-filled) */}
                                    <div className="rounded-2xl border border-[rgba(14,133,178,0.10)] bg-white p-6 shadow-[0_2px_12px_rgba(14,133,178,0.05)]">
                                        <h2 className="text-base font-bold text-[#0A3D52] mb-4 flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#28B8E8] to-[#0A6A94] text-[0.6rem] font-bold text-white">1</div>
                                            Your details
                                        </h2>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className={labelCls}>Full name</label>
                                                <div className={`${inputCls} bg-[#F8FCFF] text-[#1A6A8A]`}>{user.name || "—"}</div>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Email</label>
                                                <div className={`${inputCls} bg-[#F8FCFF] text-[#1A6A8A]`}>{user.email || "—"}</div>
                                            </div>
                                            {user.nationality && (
                                                <div>
                                                    <label className={labelCls}>Nationality</label>
                                                    <div className={`${inputCls} bg-[#F8FCFF] text-[#1A6A8A]`}>{user.nationality}</div>
                                                </div>
                                            )}
                                        </div>
                                        <p className="mt-3 text-xs text-[#1A6A8A]">
                                            Wrong details?{" "}
                                            <Link href="/profile" className="text-[#1E9DC8] hover:underline">Update your profile</Link>
                                        </p>
                                    </div>

                                    {/* Trip dates & travelers */}
                                    <div className="rounded-2xl border border-[rgba(14,133,178,0.10)] bg-white p-6 shadow-[0_2px_12px_rgba(14,133,178,0.05)]">
                                        <h2 className="text-base font-bold text-[#0A3D52] mb-4 flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#28B8E8] to-[#0A6A94] text-[0.6rem] font-bold text-white">2</div>
                                            Trip details
                                        </h2>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className={labelCls} htmlFor="startDate">Enter date</label>
                                                <Controller
                                                    name="startDate"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <DatePicker
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            minDate={minDate()}
                                                            placeholder="Select start date"
                                                            error={!!errors.startDate}
                                                        />
                                                    )}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelCls} htmlFor="travelers">
                                                    Number of travelers <span className="text-red-400">*</span>
                                                    <span className="ml-1 font-normal text-[#1A6A8A]">({tour.groupSizeMin}–{tour.groupSizeMax})</span>
                                                </label>
                                                <input
                                                    {...register("travelers")}
                                                    id="travelers" type="number"
                                                    min={tour.groupSizeMin} max={tour.groupSizeMax}
                                                    className={`${inputCls} ${errors.travelers ? errCls : ""}`}
                                                />
                                                {errors.travelers && <p className="mt-1 text-xs text-red-500">{errors.travelers.message}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Emergency contact */}
                                    <div className="rounded-2xl border border-[rgba(14,133,178,0.10)] bg-white p-6 shadow-[0_2px_12px_rgba(14,133,178,0.05)]">
                                        <h2 className="text-base font-bold text-[#0A3D52] mb-1 flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#28B8E8] to-[#0A6A94] text-[0.6rem] font-bold text-white">3</div>
                                            Emergency contact
                                        </h2>
                                        <p className="text-xs text-[#1A6A8A] mb-4">Someone we can reach if needed during your trip.</p>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className={labelCls} htmlFor="emergencyName">Contact name <span className="text-red-400">*</span></label>
                                                <input
                                                    {...register("emergencyName")}
                                                    id="emergencyName" type="text" placeholder="Jane Doe"
                                                    className={`${inputCls} ${errors.emergencyName ? errCls : ""}`}
                                                />
                                                {errors.emergencyName && <p className="mt-1 text-xs text-red-500">{errors.emergencyName.message}</p>}
                                            </div>
                                            <div>
                                                <label className={labelCls} htmlFor="emergencyPhone">Phone number <span className="text-red-400">*</span></label>
                                                <input
                                                    {...register("emergencyPhone")}
                                                    id="emergencyPhone" type="tel" placeholder="+1 555 000 0000"
                                                    className={`${inputCls} ${errors.emergencyPhone ? errCls : ""}`}
                                                />
                                                {errors.emergencyPhone && <p className="mt-1 text-xs text-red-500">{errors.emergencyPhone.message}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Special requests */}
                                    <div className="rounded-2xl border border-[rgba(14,133,178,0.10)] bg-white p-6 shadow-[0_2px_12px_rgba(14,133,178,0.05)]">
                                        <h2 className="text-base font-bold text-[#0A3D52] mb-1 flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(14,133,178,0.10)] text-[0.6rem] font-bold text-[#1E9DC8]">4</div>
                                            Special requests
                                            <span className="text-xs font-normal text-[#1A6A8A]">(optional)</span>
                                        </h2>
                                        <p className="text-xs text-[#1A6A8A] mb-3">Dietary requirements, accessibility needs, or anything else we should know.</p>
                                        <textarea
                                            {...register("specialRequests")}
                                            rows={3} placeholder="e.g. Vegetarian meals, wheelchair accessible transport…"
                                            className={`${inputCls} resize-y min-h-[80px]`}
                                        />
                                    </div>

                                    <button type="button" onClick={goToReview}
                                            className="w-full rounded-xl bg-gradient-to-r from-[#28B8E8] to-[#0A6A94] py-4 text-sm font-bold text-white shadow-[0_4px_20px_rgba(14,133,178,0.38)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(14,133,178,0.45)]">
                                        Review booking →
                                    </button>
                                </div>
                            )}

                            {/* ── STEP 2: Review & Pay ── */}
                            {step === 2 && (
                                <div className="flex flex-col gap-6">

                                    {/* Summary review */}
                                    <div className="rounded-2xl border border-[rgba(14,133,178,0.10)] bg-white p-6 shadow-[0_2px_12px_rgba(14,133,178,0.05)]">
                                        <h2 className="text-base font-bold text-[#0A3D52] mb-4">Booking summary</h2>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            {[
                                                { label: "Tour",         value: tour.title },
                                                { label: "Traveler",     value: user.name },
                                                { label: "Start date",   value: startDate ? new Date(startDate).toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" }) : "—" },
                                                { label: "End date",     value: endDate(startDate, tour.durationDays) || "—" },
                                                { label: "Travelers",    value: `${travelers} person${travelers !== 1 ? "s" : ""}` },
                                                { label: "Emergency",    value: `${watch("emergencyName")} · ${watch("emergencyPhone")}` },
                                            ].map(({ label, value }) => (
                                                <div key={label} className="flex flex-col gap-0.5">
                                                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#1A6A8A]">{label}</span>
                                                    <span className="text-sm font-medium text-[#0A3D52] leading-snug">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {watch("specialRequests") && (
                                            <div className="mt-3 rounded-lg bg-[#F8FCFF] p-3">
                                                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#1A6A8A]">Special requests</span>
                                                <p className="text-sm text-[#0A3D52] mt-0.5">{watch("specialRequests")}</p>
                                            </div>
                                        )}
                                        <button type="button" onClick={() => setStep(1)}
                                                className="mt-4 text-xs font-medium text-[#1E9DC8] hover:underline">
                                            ← Edit details
                                        </button>
                                    </div>

                                    {/* Deposit info */}
                                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-base">💳</div>
                                            <div>
                                                <p className="text-sm font-bold text-emerald-800">20% deposit required today</p>
                                                <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                                                    You'll pay <strong>${fmt(depAmt)}</strong> now to secure your spot. The remaining{" "}
                                                    <strong>${fmt(remAmt)}</strong> is due before your travel date. No payment if you cancel within 24 hours.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment method */}
                                    <div className="rounded-2xl border border-[rgba(14,133,178,0.10)] bg-white p-6 shadow-[0_2px_12px_rgba(14,133,178,0.05)]">
                                        <h2 className="text-base font-bold text-[#0A3D52] mb-4">Payment</h2>
                                        <div className="flex items-center gap-3 rounded-xl border-2 border-[#1E9DC8] bg-[#EBF8FF] p-4">
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                                                <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
                                                    <rect width="24" height="16" rx="3" fill="#635BFF"/>
                                                    <text x="3" y="11" fontSize="7" fontWeight="700" fill="white" fontFamily="system-ui">stripe</text>
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[#0A3D52]">Pay with Stripe</p>
                                                <p className="text-xs text-[#1A6A8A]">Credit card, debit card, Apple Pay, Google Pay</p>
                                            </div>
                                            <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#1E9DC8] bg-[#1E9DC8]">
                                                <div className="h-2 w-2 rounded-full bg-white"/>
                                            </div>
                                        </div>
                                        <p className="mt-3 flex items-center gap-1.5 text-xs text-[#1A6A8A]">
                                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="5" width="10" height="8" rx="1.5"/><path d="M5 5V3.5a2 2 0 1 1 4 0V5"/></svg>
                                            Secured by Stripe · 256-bit SSL encryption
                                        </p>
                                    </div>

                                    {/* Terms */}
                                    <div className="rounded-2xl border border-[rgba(14,133,178,0.10)] bg-white p-5">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <div
                                                role="checkbox"
                                                aria-checked={!!watch("agreedToTerms")}
                                                tabIndex={0}
                                                onClick={() => setValue("agreedToTerms", watch("agreedToTerms") ? (undefined as any) : true)}
                                                onKeyDown={e => e.key === " " && setValue("agreedToTerms", watch("agreedToTerms") ? (undefined as any) : true)}
                                                className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all cursor-pointer"
                                                style={{
                                                    borderColor: errors.agreedToTerms ? "#EF4444" : watch("agreedToTerms") ? "#1E9DC8" : "rgba(14,133,178,0.25)",
                                                    background:  watch("agreedToTerms") ? "#1E9DC8" : "white",
                                                }}
                                            >
                                                {watch("agreedToTerms") && (
                                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                                                        <path d="M1.5 5l2.5 2.5 4.5-4"/>
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="text-sm text-[#1A6A8A] leading-relaxed">
                        I agree to the{" "}
                                                <a href="/terms" target="_blank" className="text-[#1E9DC8] hover:underline">booking terms</a>,{" "}
                                                <a href="/cancellation" target="_blank" className="text-[#1E9DC8] hover:underline">cancellation policy</a>, and confirm all details above are correct.
                      </span>
                                        </label>
                                        {errors.agreedToTerms && <p className="mt-2 text-xs text-red-500">{errors.agreedToTerms.message}</p>}
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={submitting || !watch("agreedToTerms")}
                                        className="w-full rounded-xl py-4 text-sm font-bold text-white shadow-[0_4px_20px_rgba(14,133,178,0.38)] transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_8px_28px_rgba(14,133,178,0.45)]"
                                        style={{ background: "linear-gradient(135deg,#28B8E8,#0A6A94)" }}>
                                        {submitting ? (
                                            <span className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>
                        Redirecting to payment…
                      </span>
                                        ) : (
                                            `Pay deposit $${fmt(depAmt)} →`
                                        )}
                                    </button>

                                    <p className="text-center text-xs text-[#1A6A8A]">
                                        You'll be redirected to Stripe's secure checkout page.
                                    </p>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* ── RIGHT SIDEBAR ── */}
                    <div>
                        <TourSummary
                            tour={tour}
                            travelers={travelers}
                            deposit={deposit}
                            remaining={remaining}
                            startDate={startDate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}