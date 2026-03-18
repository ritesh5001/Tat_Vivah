import { LegalPageLayout } from "@/components/legal-page-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy | Tat Vivah",
    description: "Learn how Tat Vivah collects, uses, and protects your personal data when you use our multi-vendor marketplace.",
};

const SECTIONS = [
    { id: "data-collection", title: "Data Collection" },
    { id: "payment-data", title: "Payment Data" },
    { id: "sharing-with-sellers", title: "Sharing with Sellers" },
    { id: "cookies", title: "Cookies & Tracking" },
    { id: "security", title: "Security Measures" },
    { id: "user-rights", title: "User Rights & Retention" },
];

export default function PrivacyPolicyPage() {
    return (
        <LegalPageLayout
            title="Privacy Policy"
            lastUpdated="October 25, 2023"
            sections={SECTIONS}
        >
            <section id="data-collection">
                <h2>Data Collection</h2>
                <p>
                    Tat Vivah ("we", "us", or "our") respects your privacy and is committed to protecting your personal data. We collect data you provide directly to us when you create an account, make a purchase, or communicate with us. This includes your name, email address, phone number, shipping and billing addresses, and order history.
                </p>
            </section>

            <section id="payment-data">
                <h2>Payment Data</h2>
                <p>
                    We do not store complete credit card numbers or UPI PINs on our servers. All financial transactions are processed securely through certified third-party payment gateways (such as Razorpay). We only retain the transaction ID, status, and the payment method used for accounting and refund processing.
                </p>
            </section>

            <section id="sharing-with-sellers">
                <h2>Sharing with Sellers</h2>
                <p>
                    Because Tat Vivah is a multi-vendor marketplace, we must share limited personal information with the specific sellers you purchase from to fulfill your order.
                </p>
                <ul>
                    <li>We share your shipping address, name, and phone number with the seller.</li>
                    <li>We do <strong>not</strong> share your payment information or account password with sellers.</li>
                    <li>Sellers are contractually bound to use your data only for order fulfillment and customer service related to that specific order.</li>
                </ul>
            </section>

            <section id="cookies">
                <h2>Cookies & Tracking</h2>
                <p>
                    We use cookies and similar tracking technologies to track activity on our Site and hold certain information to improve your browsing experience. Cookies help us remember your cart items, keep you logged in, and understand how users interact with our marketplace so we can make improvements.
                </p>
            </section>

            <section id="security">
                <h2>Security Measures</h2>
                <p>
                    We implement industry-standard technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure. Although we will do our best to protect your personal information, the transmission of personal information to and from our Site is at your own risk.
                </p>
            </section>

            <section id="user-rights">
                <h2>User Rights & Retention</h2>
                <p>
                    We will only retain your personal information for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.
                </p>
                <p>
                    You have the right to request access to, correction of, or deletion of your personal data. To exercise these rights to remove your data from our database, please contact our Data Protection Officer at <strong>support@tatvivahtrends.com</strong>.
                </p>
            </section>
        </LegalPageLayout>
    );
}
