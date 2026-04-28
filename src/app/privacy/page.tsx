import LegalPage from "@/src/components/LegalPage";

export const metadata = {
    title: "Privacy Policy — Tizitaw Ethiopia",
    description: "How Tizitaw Ethiopia collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
    return (
        <LegalPage
            title="Privacy Policy"
            subtitle="Last updated: April 2026"
            sections={[
                {
                    heading: "1. Who We Are",
                    content: `Tizitaw Ethiopia ("we", "us", "our") operates a travel marketplace platform at tizitawethiopia.com. We are committed to protecting your personal information and your right to privacy. This policy explains what information we collect, how we use it, and your rights regarding your data.`,
                },
                {
                    heading: "2. Information We Collect",
                    content: `We collect information you provide directly:\n• Account information: name, email address, nationality, profile photo\n• Booking details: travel dates, number of travelers, emergency contact, special requirements\n• Payment information: processed securely by Stripe and Chapa — we never store your full card details\n• Communications: messages, reviews, community posts, support requests\n\nWe collect information automatically:\n• Usage data: pages visited, features used, time spent\n• Device information: browser type, IP address, operating system\n• Cookies and similar tracking technologies (see our Cookie Policy)`,
                },
                {
                    heading: "3. How We Use Your Information",
                    content: `We use your information to:\n• Create and manage your account\n• Process bookings and payments\n• Send booking confirmations and travel-related communications\n• Improve the Platform and personalize your experience\n• Send promotional emails (you can opt out at any time)\n• Comply with legal obligations\n• Detect and prevent fraud\n\nWe do not sell your personal information to third parties.`,
                },
                {
                    heading: "4. Sharing Your Information",
                    content: `We share your information only in limited circumstances:\n\n• Tour operators: When you book, we share your name, contact details, and trip requirements with the relevant operator to fulfill your booking\n• Payment processors: Stripe and Chapa receive payment information to process transactions\n• Service providers: We use trusted third-party services (Firebase, Cloudinary, Algolia) that process data on our behalf under strict data processing agreements\n• Legal requirements: We may disclose information when required by law or to protect rights and safety`,
                },
                {
                    heading: "5. Data Retention",
                    content: `We retain your personal information for as long as your account is active or as needed to provide services. Booking records are retained for 7 years for tax and legal compliance. You may request deletion of your account and associated data at any time, subject to our legal retention obligations.`,
                },
                {
                    heading: "6. Your Rights",
                    content: `Depending on your location, you may have the following rights:\n\n• Access: Request a copy of the personal data we hold about you\n• Correction: Request correction of inaccurate data\n• Deletion: Request deletion of your data ("right to be forgotten")\n• Portability: Receive your data in a machine-readable format\n• Objection: Object to certain types of processing\n• Withdraw consent: Where processing is based on consent\n\nTo exercise any of these rights, contact privacy@tizitawethiopia.com`,
                },
                {
                    heading: "7. Data Security",
                    content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These include:\n\n• HTTPS encryption for all data in transit\n• Encrypted storage of sensitive data\n• Access controls limiting who can view your data\n• Regular security audits\n\nNo method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.`,
                },
                {
                    heading: "8. International Transfers",
                    content: `Your data may be transferred to and processed in countries other than Ethiopia, including countries where our cloud service providers operate. We ensure appropriate safeguards are in place for such transfers in accordance with applicable data protection laws.`,
                },
                {
                    heading: "9. Children's Privacy",
                    content: `The Platform is not directed to children under 16 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.`,
                },
                {
                    heading: "10. Third-Party Links",
                    content: `The Platform may contain links to third-party websites. We are not responsible for the privacy practices of those sites. We encourage you to review the privacy policies of any third-party sites you visit.`,
                },
                {
                    heading: "11. Changes to This Policy",
                    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on the Platform. The date at the top of this page indicates when it was last revised.`,
                },
                {
                    heading: "12. Contact Us",
                    content: `For privacy-related questions or to exercise your rights:\n\nprivacy@tizitawethiopia.com\nData Protection Officer\nTizitaw Ethiopia Travel Platform\nAddis Ababa, Ethiopia`,
                },
            ]}
        />
    );
}