import * as React from "react";
import { LegalScreen } from "../../src/components/LegalScreen";
import { companyInfo } from "../../src/data/company";

export default function ReturnPolicyScreen() {
  return (
    <LegalScreen
      title="Return Policy"
      intro="Tatvivah Trends supports hassle-free returns for eligible products when requests are raised in the approved return window."
      updatedAt="March 14, 2026"
      sections={[
        {
          title: "Eligibility",
          body: "Returns are accepted for eligible items in original condition with brand tags, invoice, and packaging. Items marked final-sale or altered products are not returnable.",
        },
        {
          title: "Return Window",
          body: "Return requests must be raised within 7 days from the delivery date. Pickup is scheduled after request approval and serviceability confirmation.",
        },
        {
          title: "Quality Check",
          body: "Returned items go through quality checks. Used, damaged, washed, or perfume-marked products may be rejected and shipped back.",
        },
        {
          title: "Need Help",
          body: `For return assistance, call ${companyInfo.supportPhoneDisplay} or email ${companyInfo.supportEmail}.`,
        },
      ]}
    />
  );
}
