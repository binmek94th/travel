// src/lib/email/templates.ts
// Production HTML email templates — inline CSS, max-width 600px, dark-header style

// ─── Shared layout shell ──────────────────────────────────────────────────────

function shell(content: string, baseUrl: string, unsubUrl?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<title>Tizitaw Ethiopia</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F9FF;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F9FF;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

  <!-- Logo header -->
  <tr><td style="background:linear-gradient(135deg,#061E32 0%,#0A3D52 60%,#0A6A94 100%);border-radius:20px 20px 0 0;padding:28px 36px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <a href="${baseUrl}" style="text-decoration:none;">
            <span style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.02em;">
              Tizitaw <em style="font-style:italic;color:#28B8E8;">Ethiopia</em>
            </span>
          </a>
        </td>
        <td align="right">
          <span style="font-size:11px;color:rgba(255,255,255,0.45);letter-spacing:0.1em;text-transform:uppercase;">Your journey awaits</span>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Main content -->
  <tr><td style="background:#fff;padding:0;">
    ${content}
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#F8FCFF;border-radius:0 0 20px 20px;border-top:1px solid rgba(14,133,178,0.10);padding:24px 36px;text-align:center;">
    <p style="margin:0 0 8px;font-size:12px;color:#1A6A8A;font-family:Georgia,serif;">
      <a href="${baseUrl}/destinations" style="color:#1E9DC8;text-decoration:none;margin:0 8px;">Destinations</a>
      <span style="color:rgba(14,133,178,0.3);">·</span>
      <a href="${baseUrl}/tours" style="color:#1E9DC8;text-decoration:none;margin:0 8px;">Tours</a>
      <span style="color:rgba(14,133,178,0.3);">·</span>
      <a href="${baseUrl}/bookings" style="color:#1E9DC8;text-decoration:none;margin:0 8px;">My Bookings</a>
      <span style="color:rgba(14,133,178,0.3);">·</span>
      <a href="${baseUrl}/contact" style="color:#1E9DC8;text-decoration:none;margin:0 8px;">Contact</a>
    </p>
    <p style="margin:0 0 8px;font-size:11px;color:#94A3B8;font-family:Georgia,serif;">
      © ${new Date().getFullYear()} Tizitaw Ethiopia. All rights reserved.
    </p>
    ${unsubUrl ? `<p style="margin:0;font-size:11px;color:#CBD5E1;font-family:Georgia,serif;">
      <a href="${unsubUrl}" style="color:#CBD5E1;text-decoration:underline;">Unsubscribe</a> from marketing emails
    </p>` : ""}
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Divider ──────────────────────────────────────────────────────────────────

const divider = `<tr><td style="padding:0 36px;"><div style="height:1px;background:rgba(14,133,178,0.08);"></div></td></tr>`;

// ─── Info row ─────────────────────────────────────────────────────────────────

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 36px;border-bottom:1px solid rgba(14,133,178,0.06);">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#1A6A8A;font-family:Georgia,serif;">${label}</td>
          <td align="right" style="font-size:14px;font-weight:700;color:#0A3D52;font-family:Georgia,serif;">${value}</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// ─── CTA button ───────────────────────────────────────────────────────────────

function ctaButton(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#28B8E8,#0A6A94);color:#fff;font-family:Georgia,serif;font-size:15px;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:0.01em;">${text}</a>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. BOOKING CONFIRMATION
// ═══════════════════════════════════════════════════════════════════════════════

export function bookingConfirmationTemplate(opts: {
  travelerName:     string;
  tourTitle:        string;
  startDate:        string;
  endDate:          string;
  travelers:        number;
  totalAmountUSD:   number;
  depositAmountUSD: number;
  bookingId:        string;
  tourImageUrl?:    string;
  adminNote?:       string;
  baseUrl:          string;
}): string {
  const remainingUSD = opts.totalAmountUSD - opts.depositAmountUSD;
  const firstName    = opts.travelerName.split(" ")[0];
  const content = `
<table width="100%" cellpadding="0" cellspacing="0">

  <!-- Green confirmed bar -->
  <tr><td style="background:linear-gradient(135deg,#059669,#10B981);padding:14px 36px;text-align:center;">
    <span style="font-size:13px;font-weight:700;color:#fff;letter-spacing:0.08em;text-transform:uppercase;">✓ Booking Confirmed</span>
  </td></tr>

  <!-- Tour image -->
  ${opts.tourImageUrl ? `<tr><td style="padding:0;">
    <img src="${opts.tourImageUrl}" alt="${opts.tourTitle}" width="600" style="width:100%;max-height:220px;object-fit:cover;display:block;"/>
  </td></tr>` : ""}

  <!-- Greeting -->
  <tr><td style="padding:36px 36px 20px;">
    <h1 style="margin:0 0 10px;font-family:Georgia,serif;font-size:26px;font-weight:700;color:#0A3D52;line-height:1.2;letter-spacing:-0.02em;">
      You're going to Ethiopia, ${firstName}! ✦
    </h1>
    <p style="margin:0;font-size:15px;color:#1A6A8A;line-height:1.7;font-weight:300;font-family:Georgia,serif;">
      Your booking for <strong style="font-weight:700;color:#0A3D52;">${opts.tourTitle}</strong> is confirmed.
      Pack your bags — an extraordinary journey awaits.
    </p>
  </td></tr>

  ${divider}

  <!-- Booking details -->
  ${infoRow("Booking ID", `#${opts.bookingId.slice(0, 10).toUpperCase()}`)}
  ${infoRow("Tour", opts.tourTitle)}
  ${infoRow("Departure", opts.startDate)}
  ${infoRow("Return", opts.endDate)}
  ${infoRow("Travelers", `${opts.travelers} person${opts.travelers !== 1 ? "s" : ""}`)}

  ${divider}

  <!-- Payment breakdown -->
  <tr><td style="padding:20px 36px 0;">
    <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#1A6A8A;font-family:Georgia,serif;">Payment summary</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FCFF;border-radius:14px;overflow:hidden;border:1px solid rgba(14,133,178,0.10);">
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid rgba(14,133,178,0.07);">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:13px;color:#1A6A8A;font-family:Georgia,serif;">Total price</td>
            <td align="right" style="font-size:15px;font-weight:800;color:#0A3D52;font-family:Georgia,serif;">$${opts.totalAmountUSD.toLocaleString()}</td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid rgba(14,133,178,0.07);">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:13px;color:#1A6A8A;font-family:Georgia,serif;">Deposit paid</td>
            <td align="right">
              <span style="font-size:15px;font-weight:800;color:#059669;font-family:Georgia,serif;">$${opts.depositAmountUSD.toLocaleString()}</span>
              <span style="display:inline-block;margin-left:6px;font-size:10px;font-weight:700;background:#D1FAE5;color:#065F46;padding:2px 6px;border-radius:20px;">✓ Paid</span>
            </td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:13px;color:#1A6A8A;font-family:Georgia,serif;">Remaining balance</td>
            <td align="right">
              <span style="font-size:15px;font-weight:800;color:#0A3D52;font-family:Georgia,serif;">$${remainingUSD.toLocaleString()}</span>
              <span style="display:inline-block;margin-left:6px;font-size:10px;font-weight:700;background:#FEF3C7;color:#92400E;padding:2px 6px;border-radius:20px;">Due later</span>
            </td>
          </tr></table>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Admin note -->
  ${opts.adminNote ? `<tr><td style="padding:16px 36px 0;">
    <div style="background:#FEF3C7;border:1px solid rgba(245,158,11,0.25);border-radius:12px;padding:14px 18px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#92400E;font-family:Georgia,serif;">Note from our team</p>
      <p style="margin:0;font-size:14px;color:#78350F;line-height:1.6;font-family:Georgia,serif;">${opts.adminNote}</p>
    </div>
  </td></tr>` : ""}

  <!-- CTA -->
  <tr><td style="padding:28px 36px;text-align:center;">
    ${ctaButton("View My Booking", `${opts.baseUrl}/bookings/${opts.bookingId}/confirmation`)}
  </td></tr>

  <!-- What to expect -->
  <tr><td style="padding:0 36px 32px;">
    <div style="background:#F8FCFF;border-radius:14px;border:1px solid rgba(14,133,178,0.08);padding:20px 24px;">
      <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#0A3D52;font-family:Georgia,serif;">What happens next</p>
      ${["Our guide team will contact you 48 hours before departure with full logistics.",
         `Your remaining balance of $${remainingUSD.toLocaleString()} will be due closer to your departure date.`,
         "You'll receive a detailed trip brief with packing tips and what to expect on arrival."].map((s, i) => `
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
        <span style="display:inline-block;min-width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#28B8E8,#0A6A94);color:#fff;font-size:10px;font-weight:800;text-align:center;line-height:20px;font-family:Georgia,serif;">${i + 1}</span>
        <p style="margin:0;font-size:13px;color:#1A6A8A;line-height:1.6;font-family:Georgia,serif;">${s}</p>
      </div>`).join("")}
    </div>
  </td></tr>

</table>`;
  return shell(content, opts.baseUrl);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. WELCOME EMAIL
// ═══════════════════════════════════════════════════════════════════════════════

export function welcomeTemplate(opts: {
  travelerName: string;
  nationality?: string;
  baseUrl:      string;
}): string {
  const firstName = opts.travelerName.split(" ")[0];
  const content = `
<table width="100%" cellpadding="0" cellspacing="0">

  <!-- Hero image strip -->
  <tr><td style="background:linear-gradient(135deg,#0A3D52,#0A6A94);padding:40px 36px;text-align:center;">
    <p style="margin:0 0 8px;font-size:40px;">🌍</p>
    <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#fff;letter-spacing:-0.02em;line-height:1.2;">
      Welcome to Ethiopia, ${firstName}
    </h1>
    <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.65);font-weight:300;font-family:Georgia,serif;">
      Your gateway to one of Africa's most extraordinary countries
    </p>
  </td></tr>

  <!-- Intro -->
  <tr><td style="padding:36px 36px 20px;">
    <p style="margin:0 0 14px;font-size:15px;color:#1A6A8A;line-height:1.75;font-weight:300;font-family:Georgia,serif;">
      Thank you for joining Tizitaw Ethiopia. We're dedicated to connecting travellers${opts.nationality ? ` from ${opts.nationality}` : ""} with authentic, deeply-felt Ethiopian experiences — from the ancient rock churches of Lalibela to the dramatic Simien Mountains.
    </p>
    <p style="margin:0;font-size:15px;color:#1A6A8A;line-height:1.75;font-weight:300;font-family:Georgia,serif;">
      Here's what you can do right now:
    </p>
  </td></tr>

  <!-- Feature cards -->
  <tr><td style="padding:0 36px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${[
        { emoji:"🧭", title:"Browse tours",        desc:"Curated multi-day tours led by expert local guides.", url:`${opts.baseUrl}/tours`,        cta:"Explore tours"  },
        { emoji:"📍", title:"Discover destinations",desc:"From Lalibela to the Danakil Depression — explore it all.", url:`${opts.baseUrl}/destinations`, cta:"View destinations"},
        { emoji:"🗺", title:"Follow a route",       desc:"Multi-stop itineraries designed for depth, not just distance.", url:`${opts.baseUrl}/routes`, cta:"See routes"     },
      ].map(f => `
      <tr><td style="padding:0 0 10px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FCFF;border-radius:14px;border:1px solid rgba(14,133,178,0.10);padding:16px 18px;">
          <tr>
            <td style="width:40px;vertical-align:top;font-size:22px;">${f.emoji}</td>
            <td style="padding-left:12px;">
              <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#0A3D52;font-family:Georgia,serif;">${f.title}</p>
              <p style="margin:0 0 8px;font-size:12px;color:#1A6A8A;line-height:1.5;font-weight:300;font-family:Georgia,serif;">${f.desc}</p>
              <a href="${f.url}" style="font-size:12px;font-weight:700;color:#1E9DC8;text-decoration:none;font-family:Georgia,serif;">${f.cta} →</a>
            </td>
          </tr>
        </table>
      </td></tr>`).join("")}
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding:8px 36px 36px;text-align:center;">
    ${ctaButton("Start Exploring Ethiopia", `${opts.baseUrl}/tours`)}
  </td></tr>

</table>`;
  return shell(content, opts.baseUrl);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. BOOKING CANCELLED
// ═══════════════════════════════════════════════════════════════════════════════

export function bookingCancelledTemplate(opts: {
  travelerName: string;
  tourTitle:    string;
  startDate:    string;
  bookingId:    string;
  baseUrl:      string;
}): string {
  const firstName = opts.travelerName.split(" ")[0];
  const content = `
<table width="100%" cellpadding="0" cellspacing="0">

  <!-- Red bar -->
  <tr><td style="background:linear-gradient(135deg,#DC2626,#EF4444);padding:14px 36px;text-align:center;">
    <span style="font-size:13px;font-weight:700;color:#fff;letter-spacing:0.08em;text-transform:uppercase;">Booking Cancelled</span>
  </td></tr>

  <tr><td style="padding:36px 36px 20px;">
    <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#0A3D52;line-height:1.2;">
      We're sorry to see you go, ${firstName}
    </h1>
    <p style="margin:0 0 12px;font-size:14px;color:#1A6A8A;line-height:1.7;font-weight:300;font-family:Georgia,serif;">
      Your booking for <strong style="color:#0A3D52;">${opts.tourTitle}</strong> (departure ${opts.startDate}) has been cancelled.
    </p>
    <p style="margin:0;font-size:14px;color:#1A6A8A;line-height:1.7;font-weight:300;font-family:Georgia,serif;">
      If you believe this was a mistake or have questions about a refund, please contact our support team.
    </p>
  </td></tr>

  ${divider}
  ${infoRow("Booking ID", `#${opts.bookingId.slice(0, 10).toUpperCase()}`)}
  ${infoRow("Tour", opts.tourTitle)}
  ${infoRow("Cancelled departure", opts.startDate)}
  ${divider}

  <tr><td style="padding:24px 36px;text-align:center;">
    <p style="margin:0 0 16px;font-size:14px;color:#1A6A8A;font-family:Georgia,serif;">Ethiopia is always here when you're ready to return.</p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="padding-right:10px;">${ctaButton("Browse Tours", `${opts.baseUrl}/tours`)}</td>
        <td>
          <a href="${opts.baseUrl}/contact" style="display:inline-block;border:1.5px solid rgba(14,133,178,0.30);color:#1A6A8A;font-family:Georgia,serif;font-size:14px;font-weight:600;padding:13px 24px;border-radius:12px;text-decoration:none;">Contact Support</a>
        </td>
      </tr>
    </table>
  </td></tr>

</table>`;
  return shell(content, opts.baseUrl);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. BOOKING REMINDER
// ═══════════════════════════════════════════════════════════════════════════════

export function bookingReminderTemplate(opts: {
  travelerName:  string;
  tourTitle:     string;
  startDate:     string;
  daysUntil:     number;
  bookingId:     string;
  tourImageUrl?: string;
  baseUrl:       string;
}): string {
  const firstName = opts.travelerName.split(" ")[0];
  const urgency   = opts.daysUntil <= 3 ? "🔥" : opts.daysUntil <= 7 ? "⚡" : "🎒";
  const content = `
<table width="100%" cellpadding="0" cellspacing="0">

  <!-- Countdown bar -->
  <tr><td style="background:linear-gradient(135deg,#0A3D52,#0E85B2);padding:20px 36px;text-align:center;">
    <p style="margin:0 0 4px;font-size:40px;">${urgency}</p>
    <p style="margin:0;font-size:22px;font-weight:800;color:#fff;font-family:Georgia,serif;letter-spacing:-0.02em;">
      ${opts.daysUntil} day${opts.daysUntil !== 1 ? "s" : ""} to go!
    </p>
    <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.65);font-family:Georgia,serif;">Your Ethiopia adventure is almost here</p>
  </td></tr>

  ${opts.tourImageUrl ? `<tr><td style="padding:0;">
    <img src="${opts.tourImageUrl}" alt="${opts.tourTitle}" width="600" style="width:100%;max-height:200px;object-fit:cover;display:block;"/>
  </td></tr>` : ""}

  <tr><td style="padding:32px 36px 20px;">
    <h2 style="margin:0 0 10px;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#0A3D52;">
      Almost time, ${firstName}!
    </h2>
    <p style="margin:0;font-size:14px;color:#1A6A8A;line-height:1.7;font-weight:300;font-family:Georgia,serif;">
      Your booking for <strong style="color:#0A3D52;">${opts.tourTitle}</strong> departs on <strong style="color:#0A3D52;">${opts.startDate}</strong>.
      Make sure everything is in order before you head off.
    </p>
  </td></tr>

  <!-- Checklist -->
  <tr><td style="padding:0 36px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FCFF;border-radius:14px;border:1px solid rgba(14,133,178,0.10);padding:18px 20px;">
      <tr><td>
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#1A6A8A;font-family:Georgia,serif;">Pre-departure checklist</p>
        ${["Valid passport (check expiry)", "Ethiopian visa or e-visa arranged", "Travel insurance confirmed", "Remaining balance paid", "Emergency contacts shared with family"].map(item => `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <span style="display:inline-block;width:18px;height:18px;border-radius:50%;border:2px solid rgba(14,133,178,0.30);flex-shrink:0;"></span>
          <p style="margin:0;font-size:13px;color:#0A3D52;font-family:Georgia,serif;">${item}</p>
        </div>`).join("")}
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:8px 36px 36px;text-align:center;">
    ${ctaButton("View Booking Details", `${opts.baseUrl}/bookings/${opts.bookingId}/confirmation`)}
  </td></tr>

</table>`;
  return shell(content, opts.baseUrl);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. MARKETING CAMPAIGN
// ═══════════════════════════════════════════════════════════════════════════════

export function marketingCampaignTemplate(opts: {
  recipientName: string;
  headline:      string;
  body:          string;
  ctaText:       string;
  ctaUrl:        string;
  imageUrl?:     string;
  unsubToken:    string;
  baseUrl:       string;
}): string {
  const firstName = opts.recipientName.split(" ")[0];
  const content = `
<table width="100%" cellpadding="0" cellspacing="0">

  ${opts.imageUrl ? `<tr><td style="padding:0;">
    <img src="${opts.imageUrl}" alt="" width="600" style="width:100%;max-height:260px;object-fit:cover;display:block;"/>
  </td></tr>` : ""}

  <tr><td style="padding:36px 36px 20px;">
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#1E9DC8;font-family:Georgia,serif;">
      Tizitaw Ethiopia
    </p>
    <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#0A3D52;line-height:1.2;letter-spacing:-0.02em;">
      ${opts.headline}
    </h1>
    <p style="margin:0 0 6px;font-size:14px;color:#1A6A8A;font-weight:300;font-family:Georgia,serif;">
      Hi ${firstName},
    </p>
    <div style="font-size:15px;color:#1A6A8A;line-height:1.8;font-weight:300;font-family:Georgia,serif;">
      ${opts.body.split("\n").map(p => `<p style="margin:0 0 14px;">${p}</p>`).join("")}
    </div>
  </td></tr>

  <tr><td style="padding:8px 36px 36px;text-align:center;">
    ${ctaButton(opts.ctaText, opts.ctaUrl)}
    <p style="margin:16px 0 0;font-size:12px;color:#94A3B8;font-family:Georgia,serif;">
      Questions? <a href="${opts.baseUrl}/contact" style="color:#1E9DC8;text-decoration:none;">Contact us</a>
    </p>
  </td></tr>

</table>`;
  return shell(content, opts.baseUrl, `${opts.baseUrl}/unsubscribe?token=${opts.unsubToken}`);
}