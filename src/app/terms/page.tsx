import LegalPage from "@/src/components/LegalPage";

export const metadata = {
    title: "Terms of Service — Tizitaw Ethiopia",
    description: "Terms of service for using the Tizitaw Ethiopia travel platform.",
};

export default function TermsPage() {
    return (
        <LegalPage
            title="Terms of Service"
            subtitle="Last updated: April 2026"
            sections={[
                {
                    heading: "1. Acceptance of Terms",
                    content: `By accessing or using Tizitaw Ethiopia ("the Platform"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.`,
                },
                {
                    heading: "2. Use of the Platform",
                    content: `Tizitaw Ethiopia is a travel marketplace connecting travelers with licensed local tour operators and guides across Ethiopia. You may use the Platform solely for lawful purposes and in accordance with these Terms.\n\nYou agree not to:\n• Use the Platform in any way that violates any applicable local, national, or international law\n• Transmit any unsolicited or unauthorized advertising or promotional material\n• Impersonate any person or entity or misrepresent your affiliation\n• Attempt to gain unauthorized access to any part of the Platform`,
                },
                {
                    heading: "3. User Accounts",
                    content: `When you create an account, you must provide accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.\n\nYou must notify us immediately of any unauthorized use of your account. We reserve the right to terminate accounts that violate these Terms.`,
                },
                {
                    heading: "4. Bookings and Payments",
                    content: `All bookings made through the Platform are subject to availability and operator confirmation. Prices displayed are in USD unless otherwise stated.\n\nA non-refundable deposit of 20% is required to secure your booking. The remaining balance is due before your travel date. We use Stripe for international payments and Chapa for local Ethiopian payments — both are PCI-compliant and encrypted.\n\nTizitaw Ethiopia acts as a marketplace and is not directly responsible for the services provided by tour operators. We facilitate the booking but the contractual relationship for the tour itself is between you and the operator.`,
                },
                {
                    heading: "5. Cancellation Policy",
                    content: `Cancellations made within 24 hours of booking are fully refunded. After 24 hours:\n\n• More than 30 days before departure: 75% refund of deposit\n• 15–30 days before departure: 50% refund of deposit\n• Less than 15 days before departure: No refund\n\nOperators may have additional cancellation terms which will be clearly displayed on the tour listing. We strongly recommend purchasing travel insurance.`,
                },
                {
                    heading: "6. Reviews and Community Content",
                    content: `Reviews may only be submitted by users who have completed a verified booking. We reserve the right to remove reviews that contain false information, hate speech, or violate our community guidelines.\n\nBy posting content on the Platform, you grant Tizitaw Ethiopia a worldwide, non-exclusive, royalty-free license to use, reproduce, and display that content in connection with the Platform.`,
                },
                {
                    heading: "7. Intellectual Property",
                    content: `The Platform and its original content, features, and functionality are and will remain the exclusive property of Tizitaw Ethiopia and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without prior written consent.`,
                },
                {
                    heading: "8. Disclaimer of Warranties",
                    content: `The Platform is provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, regarding the operation of the Platform or the information, content, or materials included.\n\nTravel to certain regions of Ethiopia may carry inherent risks. We strongly recommend checking your government's travel advisories and purchasing comprehensive travel insurance before booking.`,
                },
                {
                    heading: "9. Limitation of Liability",
                    content: `To the fullest extent permitted by law, Tizitaw Ethiopia shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Platform or services booked through it.`,
                },
                {
                    heading: "10. Governing Law",
                    content: `These Terms shall be governed by and construed in accordance with the laws of the Federal Democratic Republic of Ethiopia. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of Addis Ababa, Ethiopia.`,
                },
                {
                    heading: "11. Changes to Terms",
                    content: `We reserve the right to modify these Terms at any time. We will notify registered users of material changes via email. Your continued use of the Platform after changes constitutes acceptance of the new Terms.`,
                },
                {
                    heading: "12. Contact",
                    content: `For any questions regarding these Terms, please contact us at:\n\nlegal@tizitawethiopia.com\nTizitaw Ethiopia Travel Platform\nAddis Ababa, Ethiopia`,
                },
            ]}
        />
    );
}