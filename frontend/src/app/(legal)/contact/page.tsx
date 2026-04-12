import { LegalPageLayout } from "@/components/legal-page-layout";
import { Metadata } from "next";
import { PARTNERSHIP_EMAIL, SELLER_SUPPORT_EMAIL, SUPPORT_EMAIL } from "@/lib/site-config";

export const metadata: Metadata = {
    title: "Contact Us | Tat Vivah",
    description: "Get in touch with Tat Vivah. We are here to assist you with orders, vendor inquiries, and any other questions you may have.",
};

const SECTIONS = [
    { id: "customer-support", title: "Customer Support" },
    { id: "vendor-support", title: "Vendor Support" },
    { id: "business-inquiries", title: "Business Inquiries" },
];

export default function ContactPage() {
    return (
        <LegalPageLayout
            title="Contact Us"
            lastUpdated="October 25, 2023"
            sections={SECTIONS}
        >
            <p>
                We value your feedback and are always here to help. Whether you are a customer looking for order updates or a boutique wanting to join our platform, reach out to the appropriate department below.
            </p>

            <section id="customer-support">
                <h2>Customer Support</h2>
                <p>
                    For questions regarding your orders, shipping, returns, or general assistance navigating our marketplace, our customer care team is available to assist you.
                </p>
                <ul>
                    <li><strong>Email:</strong> <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>
                    <li><strong>Phone:</strong> +91-7777777777</li>
                    <li><strong>Hours:</strong> Monday to Saturday, 9:00 AM - 6:00 PM (IST)</li>
                </ul>
            </section>

            <section id="vendor-support">
                <h2>Vendor Support</h2>
                <p>
                    If you are an existing seller on Tat Vivah and need help with your seller dashboard, product listings, or payouts, please contact our dedicated vendor team.
                </p>
                <ul>
                    <li><strong>Email:</strong> <a href={`mailto:${SELLER_SUPPORT_EMAIL}`}>{SELLER_SUPPORT_EMAIL}</a></li>
                    <li><strong>Phone:</strong> +91-7777777777 (Extension 2)</li>
                </ul>
            </section>

            <section id="business-inquiries">
                <h2>Business Inquiries</h2>
                <p>
                    For marketing collaborations, press inquiries, or corporate partnerships, please direct your communication to our business team.
                </p>
                <ul>
                    <li><strong>Email:</strong> <a href={`mailto:${PARTNERSHIP_EMAIL}`}>{PARTNERSHIP_EMAIL}</a></li>
                </ul>
                <p>
                    <strong>Registered Office Address:</strong><br />
                    Tat Vivah Trends Pvt. Ltd.<br />
                    [Insert Legal Address Here]<br />
                    India
                </p>
            </section>
        </LegalPageLayout>
    );
}
