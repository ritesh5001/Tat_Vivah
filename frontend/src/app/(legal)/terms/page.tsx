import { LegalPageLayout } from "@/components/legal-page-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms & Conditions | Tat Vivah",
    description: "Read the rules, guidelines, and terms of service that govern your use of the Tat Vivah multi-vendor marketplace.",
};

const SECTIONS = [
    { id: "eligibility", title: "User Eligibility" },
    { id: "account-responsibilities", title: "Account Responsibilities" },
    { id: "vendor-responsibilities", title: "Vendor Responsibility" },
    { id: "platform-liability", title: "Platform Liability" },
    { id: "payment-pricing", title: "Payment & Pricing" },
    { id: "gst-applicability", title: "GST Applicability" },
    { id: "intellectual-property", title: "Intellectual Property" },
    { id: "termination", title: "Termination Rights" },
    { id: "governing-law", title: "Governing Law" },
];

export default function TermsPage() {
    return (
        <LegalPageLayout
            title="Terms & Conditions"
            lastUpdated="October 25, 2023"
            sections={SECTIONS}
        >
            <p>
                Welcome to Tat Vivah. These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of India. By accessing this website, we assume you accept these terms and conditions. Do not continue to use Tat Vivah if you do not agree to take all of the terms and conditions stated on this page.
            </p>

            <section id="eligibility">
                <h2>User Eligibility</h2>
                <p>
                    You must be at least 18 years of age to use this website. By using this website and by agreeing to these terms and conditions you warrant and represent that you are at least 18 years of age and hold the legal capacity to enter into binding contracts.
                </p>
            </section>

            <section id="account-responsibilities">
                <h2>Account Responsibilities</h2>
                <p>
                    If you create an account on the Site, you are responsible for maintaining the security of your account and you are fully responsible for all activities that occur under the account and any other actions taken in connection with it. We may, but have no obligation to, monitor and review new accounts before you may sign in and start using the Services.
                </p>
            </section>

            <section id="vendor-responsibilities">
                <h2>Vendor Responsibility</h2>
                <p>
                    Tat Vivah operates strictly as a Multi-Vendor E-Commerce Marketplace. Sellers or boutiques operating on our platform are required to ensure that all products listed comply with applicable laws and reflect accurate descriptions. The fulfillment, quality assurance, and after-market support belonging to a specific item rest solely with the vendor who sold it.
                </p>
            </section>

            <section id="platform-liability">
                <h2>Platform Liability Limitation</h2>
                <p>
                    To the maximum extent permitted by applicable law, in no event shall Tat Vivah, its affiliates, directors, employees or its licensors be liable for any indirect, punitive, incidental, special, consequential or exemplary damages, including without limitation damages for loss of profits, goodwill, use, data or other intangible losses, arising out of or relating to the use of, or inability to use, the service.
                </p>
            </section>

            <section id="payment-pricing">
                <h2>Payment & Pricing</h2>
                <p>
                    All product prices are stated in Indian Rupees (INR) unless otherwise noted. We reserve the right to refuse or cancel any order placed for a product that is listed at an incorrect price, whether due to a typographical error, vendor error, or an error in pricing information received from our suppliers.
                </p>
            </section>

            <section id="gst-applicability">
                <h2>GST Applicability</h2>
                <p>
                    All applicable Goods and Services Tax (GST) is calculated and charged by the respective seller at the time of checkout. Tat Vivah acts solely as an e-commerce operator collecting TCS (Tax Collected at Source) where mandated by the Government of India. Invoices for the purchase are generated directly by the fulfilling seller.
                </p>
            </section>

            <section id="intellectual-property">
                <h2>Intellectual Property</h2>
                <p>
                    The Tat Vivah logo, platform design, software, and original structural content are the intellectual property of Tat Vivah Trends Pvt. Ltd. Vendor-uploaded imagery, product designs, and brand logos remain the intellectual property of their respective creators or manufacturers. You may not republish, sell, rent, or reproduce material from Tat Vivah without explicit written consent.
                </p>
            </section>

            <section id="termination">
                <h2>Termination Rights</h2>
                <p>
                    We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                </p>
            </section>

            <section id="governing-law">
                <h2>Governing Law (India)</h2>
                <p>
                    These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any dispute arising out of or in connection with these terms, including any question regarding its existence, validity, or termination, shall be subject to the exclusive jurisdiction of the courts located in India.
                </p>
            </section>
        </LegalPageLayout>
    );
}
