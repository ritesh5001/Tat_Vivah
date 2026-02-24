import { LegalPageLayout } from "@/components/legal-page-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Seller Terms & Conditions | Tat Vivah",
    description: "Comprehensive terms, conditions, and operational guidelines for vendors selling on the Tat Vivah marketplace.",
};

const SECTIONS = [
    { id: "commission", title: "Commission Model" },
    { id: "platform-fees", title: "Platform Fees" },
    { id: "seller-obligations", title: "Seller Obligations" },
    { id: "return-handling", title: "Return Handling" },
    { id: "gst-compliance", title: "GST Compliance" },
    { id: "settlements", title: "Settlement Timeline" },
];

export default function SellerTermsPage() {
    return (
        <LegalPageLayout
            title="Seller Terms & Conditions"
            lastUpdated="October 25, 2023"
            sections={SECTIONS}
        >
            <section id="commission">
                <h2>Commission Model</h2>
                <p>
                    By registering as a vendor on Tat Vivah, you agree to our standard commission model. A predefined commission percentage will be deducted from the finalized selling price of every successfully completed order. The exact percentage depends on the product category and your seller tier. Commission structures are subject to periodic review and sellers will be notified 30 days prior to any changes taking effect.
                </p>
            </section>

            <section id="platform-fees">
                <h2>Platform Fees</h2>
                <p>
                    In addition to the commission, certain nominal platform fees or payment gateway processing charges may apply per transaction. These fees help us maintain the technical infrastructure, marketing initiatives, and secure checkout experiences that drive sales to your store. All deductions will be clearly itemized in your seller dashboard and payout reports.
                </p>
            </section>

            <section id="seller-obligations">
                <h2>Seller Obligations</h2>
                <p>
                    As a registered vendor, you are strictly obligated to:
                </p>
                <ul>
                    <li>Maintain accurate inventory counts and promptly mark items as out of stock when unavailable.</li>
                    <li>Ensure product images and descriptions are truthful and accurately represent the final product shipped to the customer.</li>
                    <li>Package all items securely using robust materials to prevent transit damage.</li>
                    <li>Dispatch orders within the processing SLA declared on your product listings.</li>
                </ul>
            </section>

            <section id="return-handling">
                <h2>Return Handling</h2>
                <p>
                    You agree to abide by the Tat Vivah overarching Return Policy. When a returned item reaches your facility, you are required to conduct an inspection within 48 hours and process the approval or rejection via the dashboard. Unjustified or bad-faith rejections of legitimate returns will result in platform penalties and potential account suspension.
                </p>
            </section>

            <section id="gst-compliance">
                <h2>GST Compliance (India)</h2>
                <p>
                    As an e-commerce operator, Tat Vivah is required by Indian law to collect Tax Collected at Source (TCS) and remit it to the government. It is your sole responsibility as a seller to:
                </p>
                <ul>
                    <li>Provide a valid GSTIN number upon registration.</li>
                    <li>Assign accurate HSN codes and GST slab rates to your product listings.</li>
                    <li>File your respective GSTR returns correctly, claiming the TCS credit deposited by Tat Vivah against your PAN/GSTIN.</li>
                </ul>
            </section>

            <section id="settlements">
                <h2>Settlement Timeline</h2>
                <p>
                    Seller payouts are processed on a rolling weekly basis. The settlement cycle begins once an order is marked "Delivered" and the customer's return window has expired without a return request being raised. Funds will be transferred directly to your registered bank account after adjusting for commissions, platform fees, logistics costs (if utilizing Tat Vivah shipping), and applicable TCS.
                </p>
            </section>
        </LegalPageLayout>
    );
}
