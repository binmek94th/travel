import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/src/lib/admin-auth";
import { triggerDepartureReminders } from "@/src/lib/email/triggers";

export async function POST(req: NextRequest) {
    if (!await verifyAdminSession(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const results = await triggerDepartureReminders();
    const sent    = results.filter(r => r.success).length;
    return NextResponse.json({ sent, total: results.length });
}