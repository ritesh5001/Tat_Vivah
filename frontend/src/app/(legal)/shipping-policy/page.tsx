import { LegalPageLayout } from "@/components/legal-page-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Shipping & Delivery Policy | Tat Vivah",
    description: "Information regarding processing times, delivery timelines, shipping charges, and order tracking for Tat Vivah orders.",
};

const SECTIONS = [
    { id: "processing", title: "Processing Time" },
    { id: "delivery", title: "Delivery Time" },
    { id: "charges", title: "Shipping Charges" },
    { id: "tracking", title: "Order Tracking" },
    { id: "delays", title: "Handling Delays" },
];

export default function ShippingPolicyPage() {
    return (
        <LegalPageLayout
            title="Shipping & Delivery Policy"
            lastUpdated="October 25, 2023"
            sections={SECTIONS}
        >
            <section id="processing">
                <h2>Processing Time</h2>
                <p>
                    As a multi-vendor marketplace, processing times vary by seller and product type. Ready-to-ship ethnic wear is typically processed and handed over to our logistics partners within 2-3 business days. Made-to-order, customized, or heavy bridal wear may require a processing time ranging from 7 to 21 business days, depending on the craftsmanship involved.
                </p>
            </section>

            <section id="delivery">
                <h2>Delivery Time</h2>
                <p>
                    Once dispatched, the standard delivery time across most metropolitan and tier-1 Indian cities is 3-6 business days. Delivery to tier-2, tier-3 cities, and remote locations may take 7-10 business days.
                </p>
            </section>

            <section id="charges">
                <h2>Shipping Charges</h2>
                <p>
                    Shipping charges are dynamically calculated at checkout based on the delivery PIN code, weight, and dimensional volume of the package. Some sellers offer free shipping above a certain cart value threshold. Any applicable shipping costs will be clearly highlighted before you finalize your payment.
                </p>
            </section>

            <section id="tracking">
                <h2>Order Tracking</h2>
                <p>
                    Once your order has shipped, you will receive an email and an SMS notification containing your tracking number and a link to track the package via our logistics partner. You can also track the real-time status of your delivery through the "My Orders" section in your Tat Vivah account dashboard.
                </p>
            </section>

            <section id="delays">
                <h2>Handling Delays</h2>
                <p>
                    While we partner with top-tier courier services to ensure timely delivery, unpredictable circumstances such as extreme weather, regional public holidays, strikes, or logistical bottlenecks can occasionally cause delays. In such rare events, we will proactively notify you of the delay and provide an updated delivery estimate. Neither Tat Vivah nor the seller can be held legally liable for delays resulting from such force majeure events.
                </p>
            </section>
        </LegalPageLayout>
    );
}
