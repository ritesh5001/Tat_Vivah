import { LegalPageLayout } from "@/components/legal-page-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Return Policy | Tat Vivah",
    description: "Conditions and eligibility requirements for returning an item purchased on the Tat Vivah multi-vendor marketplace.",
};

const SECTIONS = [
    { id: "eligibility", title: "Eligibility" },
    { id: "return-window", title: "Return Window" },
    { id: "condition", title: "Condition Requirements" },
    { id: "inspection", title: "Inspection Process" },
    { id: "rejection", title: "Rejection Cases" },
];

export default function ReturnPolicyPage() {
    return (
        <LegalPageLayout
            title="Return Policy"
            lastUpdated="October 25, 2023"
            sections={SECTIONS}
        >
            <section id="eligibility">
                <h2>Eligibility</h2>
                <p>
                    We want you to love your purchase. Items are eligible for a return if they arrive damaged, defective, or significantly different from the description provided by the seller. Changes in mind or slight color variations (due to digital display differences) may not qualify for a free return, depending on the individual seller's policies.
                </p>
            </section>

            <section id="return-window">
                <h2>Return Window</h2>
                <p>
                    You must initiate a return request within <strong>7 days</strong> of the delivery date. Requests placed beyond this window will not be entertained by our system or the sellers.
                </p>
            </section>

            <section id="condition">
                <h2>Condition Requirements</h2>
                <p>
                    For a return to be accepted, the product must meet the following strict conditions:
                </p>
                <ul>
                    <li>The item must be unused, unwashed, and completely unworn.</li>
                    <li>All original brand tags, pricing labels, and security ribbons must remain intact and attached to the garment.</li>
                    <li>The item must be returned in its original packaging, including dust bags and hangers if provided.</li>
                </ul>
            </section>

            <section id="inspection">
                <h2>Inspection Process</h2>
                <p>
                    Once your return request is approved and the item is picked up, it will be delivered back to the respective seller. The seller will perform a quality check to ensure the condition requirements are met. The inspection process typically takes 2-3 business days after the seller receives the package. The final refund approval rests with the seller upon physical verification of the goods.
                </p>
            </section>

            <section id="rejection">
                <h2>Rejection Cases</h2>
                <p>
                    Returns will be rejected, and the item will be shipped back to you at your expense, if:
                </p>
                <ul>
                    <li>The item shows signs of wear, perfume, makeup stains, or washing.</li>
                    <li>The price tags or security ribbons are tampered with or removed.</li>
                    <li>The product returned does not match the item originally dispatched by the seller.</li>
                </ul>
            </section>
        </LegalPageLayout>
    );
}
