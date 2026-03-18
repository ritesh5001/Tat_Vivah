import { LegalPageLayout } from "@/components/legal-page-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Us | Tat Vivah",
    description: "Learn more about Tat Vivah, a premium marketplace for curated Indian fashion, connecting customers with trusted sellers and timeless craftsmanship.",
};

const SECTIONS = [
    { id: "our-story", title: "Our Story" },
    { id: "our-mission", title: "Our Mission" },
    { id: "why-choose-us", title: "Why Choose Us" },
];

export default function AboutPage() {
    return (
        <LegalPageLayout
            title="About Us"
            lastUpdated="October 25, 2023"
            sections={SECTIONS}
        >
            <section id="our-story">
                <h2>Our Story</h2>
                <p>
                    "Elegance Woven in Tradition." At Tat Vivah, we bring curated ethnic wear and handcrafted wedding fashion for modern celebrations rooted in heritage. We started with a vision to connect talented artisans, designers, and boutiques directly with customers seeking authentic Indian fashion for their special moments.
                </p>
                <p>
                    Tat Vivah serves as a premier multi-vendor marketplace focusing exclusively on the rich, diverse textile heritage of India. Whether it is a grand wedding, a festive celebration, or a traditional gathering, our platform ensures you have access to the finest garments from across the country.
                </p>
            </section>

            <section id="our-mission">
                <h2>Our Mission</h2>
                <p>
                    Our mission is to empower local businesses and artisans by providing them a robust digital storefront, while simultaneously offering our customers an unparalleled selection of high-quality, authentic Indian ethnic wear.
                </p>
                <ul>
                    <li><strong>Quality:</strong> We maintain strict quality standards for all vendors on our platform.</li>
                    <li><strong>Authenticity:</strong> We celebrate genuine craftsmanship and traditional techniques.</li>
                    <li><strong>Customer Delight:</strong> We strive to make every purchase a memorable experience.</li>
                </ul>
            </section>

            <section id="why-choose-us">
                <h2>Why Choose Us</h2>
                <p>
                    Shopping for wedding wear should be as joyous as the occasion itself. By choosing Tat Vivah, you get:
                </p>
                <ul>
                    <li>Access to hundreds of verified sellers nationwide.</li>
                    <li>Curated collections tailored for Indian ceremonies and festivals.</li>
                    <li>Secure payment gateways and reliable shipping partners.</li>
                    <li>Dedicated customer support focusing on your satisfaction.</li>
                </ul>
            </section>
        </LegalPageLayout>
    );
}
