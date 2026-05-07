import { LegalPageLayout } from "@/components/legal-page-layout";
import { PolicyDocumentView } from "@/components/policy-document";
import { vendorAgreementPolicy } from "@/lib/legal-policies";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vendor Agreement | Tat Vivah",
  description: "Vendor agreement summary for Tatvivah Trends sellers.",
};

export default function VendorAgreementPage() {
  return (
    <LegalPageLayout
      title={vendorAgreementPolicy.title}
      lastUpdated={vendorAgreementPolicy.lastUpdated}
      sections={vendorAgreementPolicy.sections.map((section) => ({ id: section.id, title: section.title }))}
    >
      <PolicyDocumentView policy={vendorAgreementPolicy} />
    </LegalPageLayout>
  );
}
