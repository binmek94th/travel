import LegalPage from "@/src/components/LegalPage";

export const metadata = {
    title: "Cookie Policy — Tizitaw Ethiopia",
    description: "How Tizitaw Ethiopia uses cookies and similar technologies.",
};

export default function CookiesPage() {
    return (
        <LegalPage
            title="Cookie Policy"
            subtitle="Last updated: April 2026"
            sections={[
                {
                    heading: "1. What Are Cookies",
                    content: `Cookies are small text files placed on your device when you visit a website. They help the website remember information about your visit, making it easier to return and making the site more useful to you.\n\nWe also use similar technologies including local storage, session storage, and pixel tags which work in comparable ways.`,
                },
                {
                    heading: "2. How We Use Cookies",
                    content: `We use cookies for several purposes:\n\n• Essential operation: Keep you logged in, remember your session, secure your account\n• Preferences: Remember your language, currency, and display settings\n• Analytics: Understand how visitors use the Platform so we can improve it\n• Performance: Identify and fix technical issues\n• Marketing: Show you relevant content (only with your consent)`,
                },
                {
                    heading: "3. Types of Cookies We Use",
                    content: `Strictly necessary cookies — These are required for the Platform to function and cannot be disabled:\n\n• session — Keeps you authenticated (expires after 5 days)\n• __cf_bm — Cloudflare bot management (expires after 30 minutes)\n\nAnalytics cookies — Help us understand Platform usage (only with consent):\n\n• _ga, _ga_* — Google Analytics, tracks page views and user journeys (expires after 2 years)\n\nFunctional cookies — Improve your experience:\n\n• preferences — Stores your filter and display preferences (expires after 1 year)\n\nWe do not use advertising or third-party tracking cookies.`,
                },
                {
                    heading: "4. Third-Party Cookies",
                    content: `Some of our service providers may set their own cookies:\n\n• Firebase (Google): Authentication and database services — subject to Google's Privacy Policy\n• Stripe: Payment processing — sets cookies for fraud prevention and security\n• Cloudinary: Image delivery optimization\n\nWe carefully vet our service providers and only work with those who meet our data protection standards.`,
                },
                {
                    heading: "5. Your Cookie Choices",
                    content: `You have several options for managing cookies:\n\nBrowser settings: All modern browsers allow you to control cookies through settings. You can block all cookies, block third-party cookies only, or delete existing cookies. Note that blocking essential cookies will affect Platform functionality.\n\nOpt out of analytics: You can opt out of Google Analytics by installing the Google Analytics Opt-out Browser Add-on.\n\nPlatform settings: You can manage your cookie preferences through the cookie banner that appears on your first visit, or by visiting Settings in your account.`,
                },
                {
                    heading: "6. Do Not Track",
                    content: `Some browsers offer a "Do Not Track" feature that signals websites not to track your activity. The Platform currently does not respond to Do Not Track signals, but we do not use cookies for behavioral advertising.`,
                },
                {
                    heading: "7. Cookie Retention",
                    content: `Different cookies have different lifespans. Session cookies expire when you close your browser. Persistent cookies remain until their expiry date or until you delete them. The specific retention periods for each cookie we use are listed in Section 3 above.`,
                },
                {
                    heading: "8. Updates to This Policy",
                    content: `We may update this Cookie Policy as our use of cookies changes or as laws and regulations evolve. We will notify you of significant changes through the Platform or by email. The date at the top of this page shows when it was last updated.`,
                },
                {
                    heading: "9. Contact",
                    content: `For questions about our use of cookies:\n\nprivacy@tizitawethiopia.com\nTizitaw Ethiopia Travel Platform\nAddis Ababa, Ethiopia`,
                },
            ]}
        />
    );
}