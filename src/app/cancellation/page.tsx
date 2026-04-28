import LegalPage from "@/src/components/LegalPage";

export const metadata = {
    title: "Cancellation Policy — Tizitaw Ethiopia",
    description: "Understand how cancellations, refunds, and changes work on Tizitaw Ethiopia.",
};

export default function CancellationPolicyPage() {
    return (
        <LegalPage
            title="Cancellation Policy"
            subtitle="Last updated: April 2026"
            sections={[
                {
                    heading: "1. Overview",
                    content: `This Cancellation Policy explains how booking cancellations, changes, and refunds are handled on Tizitaw Ethiopia ("we", "us", "our"). By making a booking through our platform, you agree to the terms outlined below.`,
                },
                {
                    heading: "2. Cancellation by Travelers",
                    content: `Cancellation terms vary depending on the tour operator and specific experience booked. Each listing clearly outlines its cancellation terms before booking.\n\nCommon policies include:\n• Free cancellation within a specified period (e.g., 24–72 hours after booking)\n• Partial refunds for cancellations made before a certain date\n• No refunds for last-minute cancellations or no-shows\n\nAlways review the cancellation terms on the booking page before confirming your reservation.`,
                },
                {
                    heading: "3. Refund Processing",
                    content: `When a cancellation qualifies for a refund:\n• Refunds are issued to the original payment method\n• Processing times may vary depending on your bank or payment provider\n• Platform service fees may be non-refundable unless otherwise stated\n\nWe aim to process eligible refunds promptly, typically within 5–10 business days.`,
                },
                {
                    heading: "4. Changes to Bookings",
                    content: `If you need to modify your booking (e.g., dates, number of travelers), you must contact the tour operator directly or through the platform.\n\nChanges are subject to:\n• Availability\n• Operator approval\n• Possible price adjustments\n\nSome bookings may not be eligible for changes depending on the operator’s policy.`,
                },
                {
                    heading: "5. Cancellation by Tour Operators",
                    content: `In rare cases, a tour operator may cancel a booking due to:\n• Weather conditions\n• Safety concerns\n• Insufficient participants\n• Operational issues\n\nIf this occurs, you will be offered:\n• A full refund, or\n• An alternative experience (if available)\n\nWe are not responsible for additional costs incurred outside the booking (e.g., flights, accommodations).`,
                },
                {
                    heading: "6. No-Show Policy",
                    content: `If you fail to show up at the scheduled time and location of your booking:\n• The booking is considered a "no-show"\n• No refund will be issued unless otherwise stated in the specific tour policy`,
                },
                {
                    heading: "7. Force Majeure",
                    content: `We and our tour operators are not liable for cancellations or changes caused by events beyond reasonable control, including:\n• Natural disasters\n• Political instability\n• Public health emergencies\n• Travel restrictions\n\nIn such cases, refund eligibility will depend on the operator’s policy and applicable laws.`,
                },
                {
                    heading: "8. Platform Fees",
                    content: `Certain platform service fees may be:\n• Non-refundable, even if the booking is canceled\n• Clearly disclosed before checkout\n\nWe strive for transparency in all pricing and fees.`,
                },
                {
                    heading: "9. Disputes",
                    content: `If you believe a cancellation or refund has been handled incorrectly, you may contact us. We will review the case and mediate between you and the tour operator where appropriate.`,
                },
                {
                    heading: "10. Contact Us",
                    content: `For cancellation or refund inquiries:\n\nsupport@tizitawethiopia.com\nTizitaw Ethiopia Travel Platform\nAddis Ababa, Ethiopia`,
                },
            ]}
        />
    );
}