import { LegalPageLayout } from "@/components/legal-page-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Refund & Cancellation Policy | Tat Vivah",
    description: "Read about our cancellation windows, refund timelines, and the conditions under which refunds are processed at Tat Vivah.",
};

const SECTIONS = [
    { id: "cancellation-window", title: "Cancellation Window" },
    { id: "refund-timeline", title: "Refund Timeline" },
    { id: "non-refundable", title: "Non-Refundable Cases" },
    { id: "seller-approval", title: "Seller Approval Cases" },
];

export default function RefundPolicyPage() {
    return (
        <LegalPageLayout
            title="Refund & Cancellation Policy"
            lastUpdated="October 25, 2023"
            sections={SECTIONS}
        >
            <section id="cancellation-window">
                <h2>Cancellation Window</h2>
                <p>
                    You may request to cancel your order within <strong>24 hours</strong> of placing it, provided the seller has not already dispatched the package. Orders that have already been shipped or marked as "Ready to Dispatch" cannot be canceled, and you will need to follow our Return Policy upon receiving the item.
                </p>
            </section>

            <section id="seller-approval">
                <h2>Seller Approval Cases</h2>
                <p>
                    For custom-made, tailored, or customized garments, cancellations are strictly subject to seller approval. Once the seller begins working on a customized piece, standard cancellation rules do not apply, and refunds are solely at the seller's discretion.
                </p>
            </section>

            <section id="refund-timeline">
                <h2>Refund Timeline (Payment Reversal)</h2>
                <p>
                    Once a cancellation is approved or a returned item is successfully inspected by the seller, your refund will be initiated immediately from our end.
                </p>
                <ul>
                    <li><strong>Credit/Debit Cards:</strong> 5-7 business days to reflect in your account.</li>
                    <li><strong>Net Banking/UPI:</strong> 2-4 business days.</li>
                    <li><strong>Store Credit:</strong> Instant credit to your Tat Vivah wallet.</li>
                </ul>
            </section>

            <section id="non-refundable">
                <h2>Non-Refundable Cases</h2>
                <p>
                    The following scenarios are strictly non-refundable:
                </p>
                <ul>
                    <li>Products purchased during final clearance sales.</li>
                    <li>Delivery or shipping charges paid at the time of placing the order (only the product value is refunded).</li>
                    <li>Items damaged by the user after delivery or items returning without original tags and packaging.</li>
                </ul>
            </section>
        </LegalPageLayout>
    );
}
