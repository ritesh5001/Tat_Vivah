import { LegalPageLayout } from "@/components/legal-page-layout";
import { PolicyDocumentView } from "@/components/policy-document";
import { returnPolicy } from "@/lib/legal-policies";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return & Refund Policy | Tat Vivah",
  description: "Tatvivah Trends return and refund policy.",
};

export default function ReturnPolicyPage() {
  return (
    <LegalPageLayout
      title={returnPolicy.title}
      lastUpdated={returnPolicy.lastUpdated}
      sections={returnPolicy.sections.map((section) => ({ id: section.id, title: section.title }))}
    >
      <PolicyDocumentView policy={returnPolicy} />
    </LegalPageLayout>
  );
}
